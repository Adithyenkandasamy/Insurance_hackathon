from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from typing import List, Dict, Any
import uuid
import io
import logging
from PIL import Image
import numpy as np
from datetime import datetime
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Car Damage Assessment API",
    description="AI-powered car damage detection and assessment REST API",
    version="2.0.0"
)

# Mock model status (replace with actual model loading)
MODEL_STATUS = {
    "car_detection_model": True,
    "damage_assessment_model": True,
    "clip_model": False  # Will be True when CLIP is loaded
}

def is_valid_image(file_bytes: bytes) -> bool:
    """Check if uploaded file is a valid image"""
    try:
        image = Image.open(io.BytesIO(file_bytes))
        # Basic validation
        if image.size[0] < 50 or image.size[1] < 50:
            return False
        return True
    except Exception as e:
        logger.error(f"Image validation failed: {e}")
        return False

def detect_car_in_image(image_bytes: bytes) -> Dict[str, Any]:
    """
    Mock car detection function
    In production, this would use CLIP or another vision model
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        
        # Mock detection logic - replace with actual model
        # For now, assume car is detected if image is reasonable size
        width, height = image.size
        
        # Simple heuristics for demo
        car_detected = width > 200 and height > 200
        confidence = 0.85 if car_detected else 0.15
        
        return {
            "car_detected": car_detected,
            "confidence": confidence,
            "image_dimensions": {"width": width, "height": height}
        }
    except Exception as e:
        logger.error(f"Car detection failed: {e}")
        return {
            "car_detected": False,
            "confidence": 0.0,
            "error": str(e)
        }

def assess_damage(image_bytes: bytes) -> Dict[str, Any]:
    """
    Mock damage assessment function
    In production, this would use trained damage detection models
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to numpy array for analysis
        img_array = np.array(image)
        
        # Mock damage detection logic
        # In reality, this would use computer vision models
        
        # Simple heuristics based on image properties
        mean_brightness = np.mean(img_array)
        std_brightness = np.std(img_array)
        
        # Mock damage detection based on image characteristics
        damage_detected = std_brightness > 50  # High variance might indicate damage
        
        if damage_detected:
            # Mock damage location detection
            locations = ["front", "rear", "side", "roof"]
            damage_location = np.random.choice(locations)
            
            # Mock severity assessment
            if std_brightness > 80:
                severity = "severe"
                confidence = 0.9
            elif std_brightness > 65:
                severity = "moderate" 
                confidence = 0.75
            else:
                severity = "minor"
                confidence = 0.6
        else:
            damage_location = None
            severity = None
            confidence = 0.8
            
        return {
            "damage_detected": damage_detected,
            "damage_location": damage_location,
            "damage_severity": severity,
            "confidence_scores": {
                "damage_detection": confidence,
                "location_accuracy": 0.85 if damage_detected else None,
                "severity_accuracy": 0.80 if damage_detected else None
            },
            "analysis_metadata": {
                "mean_brightness": float(mean_brightness),
                "brightness_variance": float(std_brightness)
            }
        }
    except Exception as e:
        logger.error(f"Damage assessment failed: {e}")
        return {
            "damage_detected": False,
            "damage_location": None,
            "damage_severity": None,
            "confidence_scores": {"damage_detection": 0.0},
            "error": str(e)
        }

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "Car Damage Assessment API",
        "version": "2.0.0",
        "status": "running",
        "endpoints": ["/health", "/assess", "/assess/batch", "/models/info"]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "models": MODEL_STATUS,
        "api_version": "2.0.0"
    }

@app.post("/assess")
async def assess_damage_endpoint(file: UploadFile = File(...)):
    """
    Assess car damage from uploaded image
    
    Returns:
        - assessment_id: Unique identifier for this assessment
        - filename: Original filename
        - car_detected: Whether a car was detected in the image
        - damage_detected: Whether damage was found
        - damage_location: Location of damage (front/rear/side) if detected
        - damage_severity: Severity level (minor/moderate/severe) if detected
        - confidence_scores: Model confidence levels
        - status: Overall assessment status
    """
    try:
        # Generate unique assessment ID
        assessment_id = str(uuid.uuid4())
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read file bytes
        file_bytes = await file.read()
        
        # Validate image
        if not is_valid_image(file_bytes):
            raise HTTPException(status_code=400, detail="Invalid or corrupted image file")
        
        # Step 1: Car Detection
        car_detection_result = detect_car_in_image(file_bytes)
        
        if not car_detection_result["car_detected"]:
            return {
                "assessment_id": assessment_id,
                "filename": file.filename,
                "car_detected": False,
                "damage_detected": False,
                "damage_location": None,
                "damage_severity": None,
                "confidence_scores": car_detection_result,
                "status": "no_car_detected",
                "message": "No car detected in the image"
            }
        
        # Step 2: Damage Assessment (only if car is detected)
        damage_result = assess_damage(file_bytes)
        
        # Combine results
        result = {
            "assessment_id": assessment_id,
            "filename": file.filename,
            "car_detected": True,
            "damage_detected": damage_result["damage_detected"],
            "damage_location": damage_result["damage_location"],
            "damage_severity": damage_result["damage_severity"],
            "confidence_scores": {
                "car_detection": car_detection_result["confidence"],
                **damage_result["confidence_scores"]
            },
            "status": "assessment_complete",
            "timestamp": datetime.now().isoformat(),
            "analysis_metadata": damage_result.get("analysis_metadata", {})
        }
        
        logger.info(f"Assessment completed: {assessment_id}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Assessment failed: {e}")
        raise HTTPException(status_code=500, detail=f"Assessment failed: {str(e)}")

@app.post("/assess/batch")
async def assess_multiple_images(files: List[UploadFile] = File(...)):
    """
    Assess multiple car images in batch
    
    Returns results for each uploaded image
    """
    if len(files) > 10:  # Limit batch size
        raise HTTPException(status_code=400, detail="Maximum 10 files allowed per batch")
    
    results = []
    
    for file in files:
        try:
            # Process each file individually
            file_bytes = await file.read()
            
            if not file.content_type.startswith('image/'):
                results.append({
                    "filename": file.filename,
                    "status": "error",
                    "error": "File must be an image"
                })
                continue
            
            if not is_valid_image(file_bytes):
                results.append({
                    "filename": file.filename,
                    "status": "error", 
                    "error": "Invalid or corrupted image file"
                })
                continue
            
            # Generate assessment ID
            assessment_id = str(uuid.uuid4())
            
            # Car detection
            car_detection_result = detect_car_in_image(file_bytes)
            
            if not car_detection_result["car_detected"]:
                results.append({
                    "assessment_id": assessment_id,
                    "filename": file.filename,
                    "car_detected": False,
                    "damage_detected": False,
                    "status": "no_car_detected"
                })
                continue
            
            # Damage assessment
            damage_result = assess_damage(file_bytes)
            
            results.append({
                "assessment_id": assessment_id,
                "filename": file.filename,
                "car_detected": True,
                "damage_detected": damage_result["damage_detected"],
                "damage_location": damage_result["damage_location"],
                "damage_severity": damage_result["damage_severity"],
                "confidence_scores": {
                    "car_detection": car_detection_result["confidence"],
                    **damage_result["confidence_scores"]
                },
                "status": "assessment_complete"
            })
            
        except Exception as e:
            results.append({
                "filename": file.filename,
                "status": "error",
                "error": str(e)
            })
    
    return {
        "batch_id": str(uuid.uuid4()),
        "total_files": len(files),
        "processed_files": len(results),
        "timestamp": datetime.now().isoformat(),
        "results": results
    }

@app.get("/models/info")
async def get_model_info():
    """Get information about loaded models"""
    return {
        "models": MODEL_STATUS,
        "model_details": {
            "car_detection": {
                "type": "Computer Vision Model",
                "status": "active" if MODEL_STATUS["car_detection_model"] else "inactive",
                "description": "Detects presence of cars in images"
            },
            "damage_assessment": {
                "type": "Damage Classification Model", 
                "status": "active" if MODEL_STATUS["damage_assessment_model"] else "inactive",
                "description": "Assesses damage severity and location"
            },
            "clip_model": {
                "type": "CLIP Vision-Language Model",
                "status": "active" if MODEL_STATUS["clip_model"] else "inactive", 
                "description": "Advanced image understanding and verification"
            }
        },
        "api_version": "2.0.0",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
