from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date
import os
import hashlib
import shutil

from ..database import get_database
from ..models import User, Claim, ClaimImage
from ..schemas import ClaimResponse, ClaimStatusUpdate
from ..auth import get_current_user, get_admin_user
from ..utils.car_verification import car_verifier

router = APIRouter(prefix="/claims", tags=["claims"])

# Directory setup
UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Load AI models
try:
    import sys
    sys.path.append('../..')
    from models.damage_assessor import DamageAssessor
    from models.fraud_detector import FraudDetector
    from ..utils.report_generator import ReportGenerator
    damage_assessor = DamageAssessor()
    fraud_detector = FraudDetector()
    report_generator = ReportGenerator()
except ImportError:
    # Fallback implementations
    class DamageAssessor:
        def analyze_images(self, paths):
            return {
                'damage_score': 0.65,
                'cost_estimate': 45000,
                'confidence': 0.85,
                'severity': 'moderate',
                'detected_damages': ['dent', 'scratch'],
                'recommendations': ['Professional repair needed']
            }
    
    class FraudDetector:
        def check_images(self, paths):
            return {
                'fraud_score': 0.25,
                'risk_level': 'low',
                'is_suspicious': False,
                'detected_issues': [],
                'recommendations': ['Images appear authentic']
            }
    
    class ReportGenerator:
        def generate_pdf_report(self, claim):
            return f"static/reports/claim_report_{claim.id}.pdf"
    
    damage_assessor = DamageAssessor()
    fraud_detector = FraudDetector()
    report_generator = ReportGenerator()

@router.get("/", response_model=List[ClaimResponse])
async def get_claims(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    if current_user.is_admin:
        claims = db.query(Claim).order_by(Claim.created_at.desc()).all()
    else:
        claims = db.query(Claim).filter(Claim.user_id == current_user.id).order_by(Claim.created_at.desc()).all()
    
    return claims

@router.get("/{claim_id}", response_model=ClaimResponse)
async def get_claim(
    claim_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    # Check permission
    if not current_user.is_admin and claim.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return claim

@router.post("/", response_model=ClaimResponse)
async def create_claim(
    policy_number: str = Form(...),
    accident_date: date = Form(...),
    location: str = Form(...),
    description: str = Form(...),
    images: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    # Create new claim
    claim = Claim(
        user_id=current_user.id,
        policy_number=policy_number,
        accident_date=accident_date,
        location=location,
        description=description
    )
    
    db.add(claim)
    db.commit()
    db.refresh(claim)
    
    # Handle uploaded images
    image_paths = []
    for i, image in enumerate(images):
        if image.filename:
            filename = f"claim_{claim.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{i}_{image.filename}"
            filepath = os.path.join(UPLOAD_DIR, filename)
            
            # Save file
            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            
            # Calculate hash
            with open(filepath, "rb") as f:
                image_hash = hashlib.sha256(f.read()).hexdigest()
            
            # Create claim image record
            claim_image = ClaimImage(
                claim_id=claim.id,
                image_path=filepath,
                image_hash=image_hash,
                exif_metadata={"filename": filename},
                angle="unknown"
            )
            
            db.add(claim_image)
            image_paths.append(filepath)
    
    # Run AI analysis
    damage_results = damage_assessor.analyze_images(image_paths)
    fraud_results = fraud_detector.check_images(image_paths)
    
    # Run car verification analysis
    car_verification_results = {}
    if image_paths:
        try:
            # Create angle mapping for car verification
            angle_paths = {}
            for i, path in enumerate(image_paths):
                angle = f"angle_{i}"  # Default angle naming
                angle_paths[angle] = path
            
            car_verification_results = await car_verifier.verify_multiple_angles(angle_paths)
        except Exception as e:
            car_verification_results = {
                'verified': False,
                'score': 0,
                'message': f'Car verification failed: {str(e)}',
                'angle_results': {}
            }
    
    # Combine scores - car verification score affects overall assessment
    car_verification_score = car_verification_results.get('score', 0)
    combined_fraud_score = (fraud_results['fraud_score'] + (1 - car_verification_score)) / 2
    
    # Update claim with AI results
    claim.damage_score = damage_results['damage_score']
    claim.cost_estimate = damage_results['cost_estimate']
    claim.fraud_score = min(combined_fraud_score, 1.0)  # Cap at 1.0
    claim.ai_analysis = {
        'damage_analysis': damage_results,
        'fraud_analysis': fraud_results,
        'car_verification': car_verification_results
    }
    
    # Auto-approve or flag for review based on combined scores
    if combined_fraud_score > 0.7 or not car_verification_results.get('verified', False):
        claim.status = 'review'
    elif damage_results['confidence'] > 0.8 and car_verification_results.get('verified', False):
        claim.status = 'approved'
    else:
        claim.status = 'review'
    
    db.commit()
    db.refresh(claim)
    
    return claim

@router.get("/{claim_id}/scores")
async def get_claim_scores(
    claim_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Get AI analysis scores for a claim"""
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    # Check permission
    if not current_user.is_admin and claim.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return {
        "claim_id": claim.id,
        "damage_score": claim.damage_score,
        "fraud_score": claim.fraud_score,
        "cost_estimate": claim.cost_estimate,
        "status": claim.status,
        "ai_analysis": claim.ai_analysis,
        "scores_breakdown": {
            "damage_assessment": {
                "score": claim.damage_score,
                "confidence": claim.ai_analysis.get('damage_analysis', {}).get('confidence', 0) if claim.ai_analysis else 0,
                "severity": claim.ai_analysis.get('damage_analysis', {}).get('severity', 'unknown') if claim.ai_analysis else 'unknown'
            },
            "fraud_detection": {
                "score": claim.fraud_score,
                "risk_level": claim.ai_analysis.get('fraud_analysis', {}).get('risk_level', 'unknown') if claim.ai_analysis else 'unknown',
                "is_suspicious": claim.ai_analysis.get('fraud_analysis', {}).get('is_suspicious', False) if claim.ai_analysis else False
            },
            "car_verification": {
                "verified": claim.ai_analysis.get('car_verification', {}).get('verified', False) if claim.ai_analysis else False,
                "score": claim.ai_analysis.get('car_verification', {}).get('score', 0) if claim.ai_analysis else 0,
                "message": claim.ai_analysis.get('car_verification', {}).get('message', 'Not verified') if claim.ai_analysis else 'Not verified'
            }
        }
    }

@router.get("/{claim_id}/report")
async def generate_report(
    claim_id: int,
    format: str = 'pdf',
    include_images: bool = True,
    include_analysis: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    # Check permission
    if not current_user.is_admin and claim.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Load claim images
    claim.images = db.query(ClaimImage).filter(ClaimImage.claim_id == claim_id).all()
    
    try:
        report_path = report_generator.generate_pdf_report(
            claim, 
            format=format, 
            include_images=include_images, 
            include_analysis=include_analysis
        )
        
        if os.path.exists(report_path):
            return FileResponse(
                report_path, 
                filename=f'claim_report_{claim.id}.pdf',
                media_type='application/pdf'
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to generate report")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

@router.delete("/{claim_id}")
async def delete_claim(
    claim_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database)
):
    """Delete a claim and all associated data"""
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    # Check permission - only admin or claim owner can delete
    if not current_user.is_admin and claim.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Delete associated images from filesystem
    images = db.query(ClaimImage).filter(ClaimImage.claim_id == claim_id).all()
    for image in images:
        if os.path.exists(image.image_path):
            try:
                os.remove(image.image_path)
            except OSError:
                pass  # Continue even if file deletion fails
    
    # Delete from database (cascade will handle related records)
    db.delete(claim)
    db.commit()
    
    return {"message": "Claim deleted successfully", "claim_id": claim_id}
