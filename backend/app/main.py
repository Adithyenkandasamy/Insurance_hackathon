from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os

from .database import engine, get_database, Base
from .models import User
from .auth import get_password_hash
from .routers import auth, claims, admin, contact

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Insurance Claims API",
    description="AI-powered insurance claims processing system",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
os.makedirs("static/uploads", exist_ok=True)
os.makedirs("static/reports", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers
app.include_router(auth.router)
app.include_router(claims.router)
app.include_router(admin.router)
app.include_router(contact.router)

@app.get("/")
async def root():
    return {"message": "Insurance Claims API", "version": "1.0.0"}

@app.on_event("startup")
async def startup_event():
    """Create admin user on startup if not exists"""
    db = next(get_database())
    
    admin_user = db.query(User).filter(User.email == "admin@example.com").first()
    if not admin_user:
        admin_user = User(
            name="Admin User",
            email="admin@example.com",
            password_hash=get_password_hash("admin123"),
            is_admin=True
        )
        db.add(admin_user)
        db.commit()
        print("Admin user created: admin@example.com / admin123")
    
    db.close()
