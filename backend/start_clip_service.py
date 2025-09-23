#!/usr/bin/env python3
"""
Quick start script for CLIP Car Verification Service
Run this to start the service with all dependencies
"""

import subprocess
import sys
import os

def install_dependencies():
    """Install required dependencies"""
    print("📦 Installing dependencies...")
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", 
            "fastapi", "uvicorn", 
            "torch", "torchvision", "torchaudio", 
            "git+https://github.com/openai/CLIP.git", 
            "pillow", "numpy", "python-multipart"
        ])
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        sys.exit(1)

def start_service():
    """Start the CLIP car verification service"""
    print("🚀 Starting CLIP Car Verification Service...")
    try:
        # Import and run the service
        from clip_car_verification_service import start_service
        start_service()
    except ImportError:
        print("❌ Failed to import service. Make sure clip_car_verification_service.py exists")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Failed to start service: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🎯 CLIP Car Verification Service Startup")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.exists("clip_car_verification_service.py"):
        print("❌ clip_car_verification_service.py not found in current directory")
        print("Please run this script from the backend directory")
        sys.exit(1)
    
    # Install dependencies
    install_dependencies()
    
    # Start service
    start_service()
