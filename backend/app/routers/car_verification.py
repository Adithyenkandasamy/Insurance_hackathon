from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pathlib import Path
from datetime import datetime
import time
import hashlib
import os
import aiofiles

from ..database import get_database
from ..models import ClaimImage, Claim, User
from ..schemas import ClaimImageResponse
from ..auth import get_current_user
from ..utils.car_verification import car_verifier

router = APIRouter(prefix="/api/car-verification", tags=["car-verification"])

# Allowed image types
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

async def save_upload_file(upload_file: UploadFile, claim_id: int, angle: str) -> str:
    """Save uploaded file to disk and return the file path"""
    if not allowed_file(upload_file.filename):
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    # Create uploads directory if it doesn't exist
    upload_dir = os.path.join("static", "uploads", str(claim_id))
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_ext = upload_file.filename.split('.')[-1]
    filename = f"{angle}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}.{file_ext}"
    file_path = os.path.join(upload_dir, filename)
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await upload_file.read()
        await out_file.write(content)
    
    return file_path

@router.post("/upload/{claim_id}")
async def upload_car_image(
    claim_id: int,
    angle: str = Query(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Upload car image for verification using OpenAPI specification endpoints"""
    # Verify claim exists and user has access
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    if not current_user.is_admin and claim.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Validate angle parameter
    valid_angles = ["front", "back", "left", "right"]
    if angle not in valid_angles:
        raise HTTPException(status_code=400, detail=f"Invalid angle. Must be one of: {valid_angles}")
    
    # Create upload directory
    upload_dir = Path("static/uploads")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"car_{claim_id}_{angle}_{int(time.time())}{file_extension}"
    file_path = upload_dir / unique_filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Calculate file hash for database constraint
    file_hash = hashlib.md5(content).hexdigest()
    
    # Perform car verification with angle-specific API
    try:
        verification_result = await car_verifier.verify_car(str(file_path), angle)
        
        # Save to database
        claim_image = ClaimImage(
            claim_id=claim_id,
            image_path=str(file_path),
            angle=angle,
            image_hash=file_hash,
            ai_analysis={
                "car_verification": verification_result,
                "upload_timestamp": datetime.utcnow().isoformat(),
                "angle": angle,
                "classification_percentage": verification_result.get("classification_percentage", 0),
                "api_used": verification_result.get("api_used", "OpenAPI Specification")
            }
        )
        
        db.add(claim_image)
        db.commit()
        db.refresh(claim_image)
        
        return {
            "message": f"Image uploaded and verified successfully for {angle} angle",
            "image_id": claim_image.id,
            "verification_result": verification_result,
            "classification_percentage": verification_result.get("classification_percentage", 0),
            "angle": angle,
            "file_path": f"/static/uploads/{unique_filename}",
            "api_endpoints_used": {
                "upload": f"/upload/{angle}",
                "check": "/check_car"
            },
            "scores": {
                "verified": verification_result.get("verified", False),
                "similarity_score": verification_result.get("score", 0),
                "confidence": verification_result.get("score", 0) * 100,
                "status": "verified" if verification_result.get("verified", False) else "needs_review"
            }
        }
        
    except Exception as e:
        # Clean up file if it was saved but something else failed
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@router.get("/status/{claim_id}")
async def get_verification_status(
    claim_id: int,
    db = Depends(get_database),
    current_user = Depends(get_current_user)
):
    """
    Get verification status for all angles of a claim
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    if not current_user.is_admin and claim.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this claim")
    
    # Get all images for this claim
    images = db.query(ClaimImage).filter(ClaimImage.claim_id == claim_id).all()
    
    # Group by angle
    angle_results = {}
    for img in images:
        angle_results[img.angle] = {
            "uploaded": True,
            "verified": img.ai_analysis.get("verification_result", {}).get("verified", False) if img.ai_analysis else False,
            "score": img.ai_analysis.get("verification_result", {}).get("score", 0) if img.ai_analysis else 0,
            "image_id": img.id,
            "uploaded_at": img.uploaded_at.isoformat()
        }
    
    # Add missing angles
    for angle in ["front", "back", "left", "right"]:
        if angle not in angle_results:
            angle_results[angle] = {
                "uploaded": False,
                "verified": False,
                "score": 0,
                "image_id": None,
                "uploaded_at": None
            }
    
    # Calculate overall status
    verified_angles = sum(1 for v in angle_results.values() if v["verified"])
    total_angles = len(angle_results)
    
    return {
        "claim_id": claim_id,
        "status": "complete" if verified_angles == total_angles else "pending",
        "verified_angles": verified_angles,
        "total_angles": total_angles,
        "angles": angle_results,
        "threshold": car_verifier.threshold,
        "overall_score": sum(v["score"] for v in angle_results.values()) / len(angle_results) if angle_results else 0,
        "verification_summary": {
            "all_verified": verified_angles == total_angles,
            "completion_percentage": (verified_angles / total_angles * 100) if total_angles > 0 else 0,
            "recommendation": "approved" if verified_angles == total_angles else "needs_more_images"
        }
    }

@router.post("/submit/{claim_id}")
async def submit_verification(
    claim_id: int,
    db = Depends(get_database),
    current_user = Depends(get_current_user)
):
    """
    Submit car verification and get final results
    """
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    if not current_user.is_admin and claim.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to submit this claim")
    
    # Get all images for this claim
    images = db.query(ClaimImage).filter(ClaimImage.claim_id == claim_id).all()
    
    if not images:
        raise HTTPException(status_code=400, detail="No images found for verification")
    
    # Aggregate verification results
    verification_results = []
    total_score = 0
    verified_count = 0
    
    for img in images:
        if img.ai_analysis and 'verification_result' in img.ai_analysis:
            result = img.ai_analysis['verification_result']
            verification_results.append({
                "angle": img.angle,
                "verified": result.get("verified", False),
                "score": result.get("score", 0),
                "image_id": img.id
            })
            
            if result.get("verified", False):
                verified_count += 1
            total_score += result.get("score", 0)
    
    avg_score = total_score / len(verification_results) if verification_results else 0
    all_verified = verified_count == len(verification_results) and len(verification_results) > 0
    
    # Update claim with final verification status
    final_verification = {
        "submitted_at": datetime.utcnow().isoformat(),
        "total_images": len(verification_results),
        "verified_images": verified_count,
        "average_score": avg_score,
        "all_verified": all_verified,
        "recommendation": "approved" if all_verified and avg_score >= car_verifier.threshold else "review_required",
        "individual_results": verification_results
    }
    
    # Update claim AI analysis
    if not claim.ai_analysis:
        claim.ai_analysis = {}
    claim.ai_analysis["car_verification_final"] = final_verification
    
    # Update claim status based on verification
    if all_verified and avg_score >= car_verifier.threshold:
        claim.status = "verified"
    else:
        claim.status = "review"
    
    db.commit()
    
    return {
        "message": "Car verification submitted successfully",
        "claim_id": claim_id,
        "verification_status": final_verification,
        "next_steps": "Your claim has been submitted for review" if not all_verified else "Your claim has been verified and approved"
    }
