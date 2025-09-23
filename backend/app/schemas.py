from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, date

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    is_admin: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class ClaimCreate(BaseModel):
    policy_number: str
    accident_date: date
    location: str
    description: str

class ClaimImageResponse(BaseModel):
    id: int
    claim_id: int
    image_path: str
    image_hash: str
    angle: str
    ai_analysis: Optional[dict]
    exif_metadata: Optional[dict]
    uploaded_at: datetime
    
    class Config:
        from_attributes = True

class ClaimResponse(BaseModel):
    id: int
    user_id: int
    policy_number: str
    accident_date: date
    location: str
    description: str
    status: str
    damage_score: Optional[float] = None
    cost_estimate: Optional[float] = None
    fraud_score: Optional[float] = None
    ai_analysis: Optional[dict] = None
    images: Optional[List[ClaimImageResponse]] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ClaimStatusUpdate(BaseModel):
    status: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
