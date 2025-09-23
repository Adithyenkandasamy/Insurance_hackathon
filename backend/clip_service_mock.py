#!/usr/bin/env python3
"""
CLIP Car Verification Service - Mock Version
Standalone FastAPI service for car image verification (mock implementation for testing)
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from typing import Optional
from PIL import Image
import numpy as np
import io
import logging
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CLIP Car Verification Service",
    description="AI-powered car image verification using OpenAI's CLIP model",
    version="1.0.0"
)

# Mock model status
model_loaded = True
device = "cpu"

# Dictionary to temporarily store uploaded images per user/session
uploaded_images = {
    "front": None,
    "back": None,
    "left": None,
    "right": None
}

def get_mock_embedding(file_bytes):
    """Generate mock embedding for testing"""
    try:
        image = Image.open(io.BytesIO(file_bytes))
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Generate mock embedding based on image properties
        img_array = np.array(image)
        # Use image statistics to create a consistent "embedding"
        mean_color = np.mean(img_array, axis=(0, 1))
        std_color = np.std(img_array, axis=(0, 1))
        
        # Create a 512-dimensional mock embedding
        embedding = np.concatenate([
            mean_color / 255.0,  # Normalized mean colors
            std_color / 255.0,   # Normalized std colors
            [image.size[0] / 1000.0, image.size[1] / 1000.0],  # Normalized dimensions
            np.random.random(504)  # Random features to fill 512 dimensions
        ])
        
        return embedding.reshape(1, -1)
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        raise HTTPException(status_code=400, detail=f"Image processing failed: {str(e)}")

def cosine_sim(a, b):
    """Calculate cosine similarity between two embeddings"""
    return np.dot(a.flatten(), b.flatten()) / (np.linalg.norm(a) * np.linalg.norm(b))

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "CLIP Car Verification Service is running (Mock Mode)",
        "model_loaded": model_loaded,
        "device": device,
        "uploaded_images": {k: v is not None for k, v in uploaded_images.items()}
    }

@app.post("/upload/front")
async def upload_front(file: UploadFile = File(...)):
    """Upload front view image of the car"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        uploaded_images["front"] = await file.read()
        logger.info(f"Front image uploaded: {file.filename}")
        return {"message": "Front image uploaded successfully", "filename": file.filename}
    except Exception as e:
        logger.error(f"Error uploading front image: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")

@app.post("/upload/back")
async def upload_back(file: UploadFile = File(...)):
    """Upload back view image of the car"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        uploaded_images["back"] = await file.read()
        logger.info(f"Back image uploaded: {file.filename}")
        return {"message": "Back image uploaded successfully", "filename": file.filename}
    except Exception as e:
        logger.error(f"Error uploading back image: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")

@app.post("/upload/left")
async def upload_left(file: UploadFile = File(...)):
    """Upload left side view image of the car"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        uploaded_images["left"] = await file.read()
        logger.info(f"Left image uploaded: {file.filename}")
        return {"message": "Left image uploaded successfully", "filename": file.filename}
    except Exception as e:
        logger.error(f"Error uploading left image: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")

@app.post("/upload/right")
async def upload_right(file: UploadFile = File(...)):
    """Upload right side view image of the car"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        uploaded_images["right"] = await file.read()
        logger.info(f"Right image uploaded: {file.filename}")
        return {"message": "Right image uploaded successfully", "filename": file.filename}
    except Exception as e:
        logger.error(f"Error uploading right image: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")

@app.get("/check_car")
async def check_car(threshold: float = 0.85):
    """
    Check if all uploaded images are from the same car using mock CLIP similarity
    
    Args:
        threshold: Minimum similarity threshold (default: 0.85)
    
    Returns:
        Dictionary with similarity results and verification status
    """
    # Check if all four images are uploaded
    missing_images = [angle for angle, img in uploaded_images.items() if img is None]
    if missing_images:
        raise HTTPException(
            status_code=400, 
            detail=f"Missing images for angles: {', '.join(missing_images)}. Upload all four images first (front, back, left, right)"
        )

    try:
        # Get mock embeddings for all images
        logger.info("Computing mock CLIP embeddings for all images...")
        embeddings = []
        for angle, img_bytes in uploaded_images.items():
            if img_bytes is not None:
                emb = get_mock_embedding(img_bytes)
                embeddings.append(emb)
        
        names = [angle for angle, img in uploaded_images.items() if img is not None]

        # Calculate pairwise similarities
        sims = []
        for i in range(len(embeddings)):
            for j in range(i+1, len(embeddings)):
                sim = cosine_sim(embeddings[i], embeddings[j])
                sims.append({
                    "pair": f"{names[i]} vs {names[j]}", 
                    "similarity": float(sim)
                })

        # Calculate average similarity and determine if same car
        avg_sim = float(np.mean([s["similarity"] for s in sims]))
        same_car = all(s["similarity"] > threshold for s in sims)
        
        logger.info(f"Mock verification complete: avg_sim={avg_sim:.3f}, same_car={same_car}")
        
        return {
            "similarities": sims,
            "average_similarity": avg_sim,
            "same_car": same_car,
            "threshold_used": threshold,
            "total_comparisons": len(sims),
            "verification_status": "verified" if same_car else "needs_review",
            "note": "Using mock CLIP embeddings for testing"
        }
        
    except Exception as e:
        logger.error(f"Error during car verification: {e}")
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

@app.delete("/clear")
async def clear_images():
    """Clear all uploaded images"""
    global uploaded_images
    uploaded_images = {
        "front": None,
        "back": None,
        "left": None,
        "right": None
    }
    logger.info("All uploaded images cleared")
    return {"message": "All images cleared successfully"}

@app.get("/status")
async def get_status():
    """Get current upload status"""
    return {
        "uploaded_images": {k: v is not None for k, v in uploaded_images.items()},
        "total_uploaded": sum(1 for v in uploaded_images.values() if v is not None),
        "ready_for_verification": all(v is not None for v in uploaded_images.values()),
        "model_loaded": model_loaded,
        "device": device,
        "mode": "mock"
    }

def start_service(port: int = 8001):
    """Start the CLIP car verification service locally"""
    logger.info(f"🚀 Starting CLIP Car Verification Service (Mock) on port {port}")
    logger.info(f"📋 API Documentation: http://localhost:{port}/docs")
    logger.info(f"🌐 Service URL: http://localhost:{port}")
    
    print(f"CLIP Car Verification Service (Mock Mode)")
    print(f"Service URL: http://localhost:{port}")
    print(f"API Documentation: http://localhost:{port}/docs")
    print("=" * 50)
    
    # Run FastAPI app
    uvicorn.run(app, host="0.0.0.0", port=port, reload=False, log_level="info")

if __name__ == "__main__":
    # Configuration - using port 8001 to avoid conflict with main API
    PORT = 8001
    
    start_service(port=PORT)
