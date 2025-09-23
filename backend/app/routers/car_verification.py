from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from typing import Dict, Optional
import os
import uuid
from datetime import datetime
import aiofiles
import hashlib

from ..database import get_database
from ..models import ClaimImage, Claim
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
    angle: str = Query(..., regex="^(front|back|left|right)$"),
    file: UploadFile = File(...),
    db = Depends(get_database),
    current_user = Depends(get_current_user)
):
    """
    Upload a car image for verification
    """
    # Verify claim exists and belongs to user (or user is admin)
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    if not current_user.is_admin and claim.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this claim")
    
    try:
        # Read file content for hash calculation
        content = await file.read()
        await file.seek(0)  # Reset file pointer
        
        # Calculate image hash
        image_hash = hashlib.sha256(content).hexdigest()
        
        # Save the uploaded file
        file_path = await save_upload_file(file, claim_id, angle)
        
        # Create database record
        db_image = ClaimImage(
            claim_id=claim_id,
            image_path=file_path,
            image_hash=image_hash,
            angle=angle,
            uploaded_at=datetime.utcnow()
        )
        db.add(db_image)
        db.commit()
        db.refresh(db_image)
        
        # Verify the image
        verification_result = await car_verifier.verify_car(file_path)
        
        # Update the image record with verification results
        db_image.ai_analysis = {
            "verification_result": verification_result,
            "verified_at": datetime.utcnow().isoformat()
        }
        db.commit()
        
        # Update claim status if needed
        if verification_result.get("verified", False):
            claim.status = "pending"  # Move to pending for review
            db.commit()
        
        return {
            "message": "Image uploaded and verified successfully",
            "verification_result": verification_result,
            "image": db_image
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
        "threshold": car_verifier.threshold
    }
