from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_database
from ..models import User, Claim, ClaimImage
from ..schemas import ClaimStatusUpdate
from ..auth import get_admin_user

router = APIRouter(prefix="/admin", tags=["admin"])

@router.put("/claims/{claim_id}/status")
async def update_claim_status(
    claim_id: int,
    status_update: ClaimStatusUpdate,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    if status_update.status not in ['pending', 'approved', 'rejected', 'review']:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    claim.status = status_update.status
    db.commit()
    
    return {"success": True, "status": status_update.status}

@router.get("/stats")
async def get_admin_stats(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    stats = {
        'total_claims': db.query(Claim).count(),
        'pending_claims': db.query(Claim).filter(Claim.status == 'pending').count(),
        'approved_claims': db.query(Claim).filter(Claim.status == 'approved').count(),
        'rejected_claims': db.query(Claim).filter(Claim.status == 'rejected').count(),
        'review_claims': db.query(Claim).filter(Claim.status == 'review').count(),
        'high_risk_claims': db.query(Claim).filter(Claim.fraud_score > 0.7).count(),
        'total_cost_estimates': db.query(func.sum(Claim.cost_estimate)).scalar() or 0
    }
    
    return stats

@router.get("/images")
async def get_all_images(
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """Get all claim images for admin review"""
    images = db.query(ClaimImage).join(Claim).join(User).all()
    
    result = []
    for image in images:
        result.append({
            'id': image.id,
            'claim_id': image.claim_id,
            'image_path': image.image_path,
            'angle': image.angle,
            'ai_analysis': image.ai_analysis,
            'uploaded_at': image.uploaded_at,
            'claim_policy': image.claim.policy_number,
            'claim_status': image.claim.status,
            'user_name': image.claim.user.name,
            'user_email': image.claim.user.email
        })
    
    return result

@router.get("/images/{image_id}")
async def get_image_details(
    image_id: int,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """Get detailed information about a specific image"""
    image = db.query(ClaimImage).filter(ClaimImage.id == image_id).first()
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    return {
        'id': image.id,
        'claim_id': image.claim_id,
        'image_path': image.image_path,
        'image_hash': image.image_hash,
        'angle': image.angle,
        'ai_analysis': image.ai_analysis,
        'exif_metadata': image.exif_metadata,
        'uploaded_at': image.uploaded_at,
        'claim': {
            'id': image.claim.id,
            'policy_number': image.claim.policy_number,
            'status': image.claim.status,
            'accident_date': image.claim.accident_date,
            'location': image.claim.location,
            'description': image.claim.description,
            'damage_score': image.claim.damage_score,
            'fraud_score': image.claim.fraud_score,
            'user': {
                'name': image.claim.user.name,
                'email': image.claim.user.email
            }
        }
    }

@router.delete("/images/{image_id}")
async def delete_image(
    image_id: int,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """Delete a claim image"""
    image = db.query(ClaimImage).filter(ClaimImage.id == image_id).first()
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # TODO: Delete actual file from filesystem
    # os.remove(image.image_path)
    
    db.delete(image)
    db.commit()
    
    return {"success": True, "message": "Image deleted successfully"}

@router.get("/claims/{claim_id}/images")
async def get_claim_images(
    claim_id: int,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """Get all images for a specific claim"""
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    images = db.query(ClaimImage).filter(ClaimImage.claim_id == claim_id).all()
    
    return [{
        'id': image.id,
        'image_path': image.image_path,
        'angle': image.angle,
        'ai_analysis': image.ai_analysis,
        'uploaded_at': image.uploaded_at,
        'exif_metadata': image.exif_metadata
    } for image in images]
