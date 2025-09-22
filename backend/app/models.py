from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, JSON, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(200), nullable=True)  # Make nullable for Google OAuth
    google_id = Column(String(50), unique=True, nullable=True)  # Google OAuth ID
    profile_picture = Column(String(500), nullable=True)  # Google profile picture URL
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    
    claims = relationship("Claim", back_populates="user")
    policies = relationship("PolicyInfo")

class Claim(Base):
    __tablename__ = "claims"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    policy_number = Column(String(50), nullable=False)
    accident_date = Column(Date, nullable=False)
    location = Column(String(200), nullable=False)
    description = Column(Text)
    status = Column(String(20), default="pending")
    damage_score = Column(Float, default=0.0)
    cost_estimate = Column(Float, default=0.0)
    fraud_score = Column(Float, default=0.0)
    ai_analysis = Column(JSON)
    report_file = Column(String(200))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="claims")
    images = relationship("ClaimImage", back_populates="claim", cascade="all, delete-orphan")
    ai_analyses = relationship("AIAnalysis")
    documents = relationship("ClaimDocument")
    history = relationship("ClaimHistory")

class ClaimImage(Base):
    __tablename__ = "claim_images"
    
    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=False)
    image_path = Column(String(200), nullable=False)
    image_hash = Column(String(64), nullable=False)
    exif_metadata = Column(JSON)
    angle = Column(String(20))  # front, rear, back, top
    ai_analysis = Column(JSON)  # Store AI analysis results for each image
    uploaded_at = Column(DateTime, default=func.now())
    
    claim = relationship("Claim", back_populates="images")

class AIAnalysis(Base):
    __tablename__ = "ai_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=False)
    image_id = Column(Integer, ForeignKey("claim_images.id"), nullable=True)
    analysis_type = Column(String(20))  # damage, fraud, overall
    
    # Damage Analysis
    severity = Column(String(20))  # minor, moderate, severe
    confidence = Column(Float)
    detected_damages = Column(JSON)  # Array of damage types
    damage_areas = Column(JSON)  # Specific areas affected
    
    # Fraud Analysis  
    risk_level = Column(String(20))  # low, medium, high
    fraud_score = Column(Float)
    is_suspicious = Column(Boolean, default=False)
    fraud_indicators = Column(JSON)  # Array of suspicious indicators
    
    # Recommendations
    recommendations = Column(JSON)
    estimated_cost = Column(Float)
    
    created_at = Column(DateTime, default=func.now())
    
    claim = relationship("Claim")
    
class ClaimDocument(Base):
    __tablename__ = "claim_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=False)
    document_type = Column(String(50))  # report, estimate, receipt, etc.
    file_path = Column(String(200), nullable=False)
    original_filename = Column(String(200))
    file_size = Column(Integer)
    mime_type = Column(String(100))
    generated_by = Column(String(20))  # system, user, admin
    uploaded_at = Column(DateTime, default=func.now())
    
    claim = relationship("Claim")

class ClaimHistory(Base):
    __tablename__ = "claim_history"
    
    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=False)
    action = Column(String(50))  # created, updated, approved, rejected, etc.
    old_status = Column(String(20))
    new_status = Column(String(20))
    notes = Column(Text)
    performed_by = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(DateTime, default=func.now())
    
    claim = relationship("Claim")
    user = relationship("User")

class PolicyInfo(Base):
    __tablename__ = "policy_info"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    policy_number = Column(String(50), unique=True, nullable=False)
    policy_type = Column(String(50))  # auto, home, health, etc.
    coverage_amount = Column(Float)
    deductible = Column(Float)
    premium = Column(Float)
    start_date = Column(Date)
    end_date = Column(Date)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    
    user = relationship("User")
