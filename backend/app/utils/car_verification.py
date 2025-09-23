import os
import requests
from fastapi import UploadFile, HTTPException
from typing import Dict, Any, Optional
import aiohttp
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class CarVerificationError(Exception):
    """Custom exception for car verification errors"""
    pass

class CarVerifier:
    def __init__(self):
        self.api_url = os.getenv("CAR_VERIFICATION_API_URL", "http://localhost:8000")
        self.threshold = float(os.getenv("VERIFICATION_THRESHOLD", 0.85))  # Higher threshold for CLIP
        
        if not self.api_url:
            logger.warning("CAR_VERIFICATION_API_URL not set. Car verification will be disabled.")
    
    async def verify_car(self, image_path: str, angle: str = "front") -> Dict[str, Any]:
        """
        Verify if the car image matches existing records using the provided OpenAPI specification
        
        Args:
            image_path: Path to the image file to verify
            angle: The angle of the car image (front, back, left, right)
            
        Returns:
            Dict containing verification results with classification percentage
        """
        if not self.api_url:
            # Simulate verification for demo purposes
            return self._simulate_verification(image_path)
            
        try:
            if not os.path.exists(image_path):
                raise CarVerificationError(f"Image file not found: {image_path}")
                
            # Use the provided OpenAPI specification endpoints
            car_result = await self._call_car_verification_api(image_path, angle)
            
            # Extract classification percentage from the API response
            classification_score = car_result.get('score', 0)
            verification_result = car_result.get('verification_result', {})
            
            return {
                "verified": classification_score >= self.threshold,
                "score": classification_score,
                "classification_percentage": classification_score * 100,
                "angle": angle,
                "threshold_used": self.threshold,
                "message": f"Car verification completed for {angle} angle",
                "details": {
                    "upload_result": car_result.get('upload_result', {}),
                    "verification_result": verification_result,
                    "api_response": car_result
                },
                "api_used": "CLIP-based Car Verification"
            }
                        
        except Exception as e:
            logger.error(f"Error during car verification: {str(e)}")
            # Fall back to simulation if API fails
            return self._simulate_verification(image_path)
    
    def _simulate_verification(self, image_path: str) -> Dict[str, Any]:
        """Simulate verification results for demo purposes"""
        import random
        import hashlib
        
        # Generate consistent results based on image hash
        with open(image_path, 'rb') as f:
            image_hash = hashlib.md5(f.read()).hexdigest()
        
        # Use hash to generate consistent random values
        random.seed(image_hash)
        
        similarity_score = random.uniform(0.6, 0.95)
        fraud_probability = random.uniform(0.05, 0.3)
        damage_confidence = random.uniform(0.7, 0.95)
        
        return {
            "verified": similarity_score >= self.threshold,
            "score": similarity_score,
            "message": "Verification completed (CLIP simulation mode)",
            "details": {
                "car_verification": {
                    "similarity_score": similarity_score,
                    "match_confidence": random.uniform(0.8, 0.95),
                    "vehicle_type": random.choice(["sedan", "suv", "hatchback", "truck"])
                },
                "fraud_detection": {
                    "fraud_probability": fraud_probability,
                    "authenticity_score": 1 - fraud_probability,
                    "manipulation_detected": fraud_probability > 0.5,
                    "metadata_consistent": random.choice([True, True, True, False])
                },
                "damage_assessment": {
                    "damage_detected": True,
                    "confidence": damage_confidence,
                    "severity": random.choice(["minor", "moderate", "major"]),
                    "affected_parts": random.sample(["bumper", "door", "fender", "headlight", "mirror"], random.randint(1, 3))
                }
            },
            "fraud_risk": fraud_probability,
            "damage_detected": True
        }
    
    async def _call_car_verification_api(self, image_path: str, angle: str = "front") -> Dict[str, Any]:
        """Call car verification API endpoint using the provided OpenAPI specification"""
        try:
            # Map angles to the specific upload endpoints
            angle_endpoints = {
                "front": "/upload/front",
                "back": "/upload/back", 
                "left": "/upload/left",
                "right": "/upload/right"
            }
            
            upload_endpoint = angle_endpoints.get(angle, "/upload/front")
            
            with open(image_path, 'rb') as f:
                files = {'file': (os.path.basename(image_path), f, 'image/jpeg')}
                
                async with aiohttp.ClientSession() as session:
                    # Step 1: Upload the image for the specific angle
                    async with session.post(
                        f"{self.api_url}{upload_endpoint}",
                        data=files
                    ) as upload_response:
                        if upload_response.status != 200:
                            raise Exception(f"Upload failed: {upload_response.status}")
                        
                        upload_result = await upload_response.json()
                    
                    # Step 2: Check car verification with threshold
                    async with session.get(
                        f"{self.api_url}/check_car",
                        params={"threshold": self.threshold}
                    ) as check_response:
                        if check_response.status == 200:
                            check_result = await check_response.json()
                            
                            # Combine upload and check results
                            avg_similarity = check_result.get("average_similarity", 0.5)
                            same_car = check_result.get("same_car", False)
                            
                            return {
                                "score": avg_similarity,
                                "angle": angle,
                                "upload_result": upload_result,
                                "verification_result": {
                                    "verified": same_car,
                                    "average_similarity": avg_similarity,
                                    "similarities": check_result.get("similarities", []),
                                    "same_car": same_car
                                },
                                "threshold_used": self.threshold,
                                "classification_percentage": int(avg_similarity * 100)
                            }
                        else:
                            raise Exception(f"Check car API error: {check_response.status}")
                            
        except Exception as e:
            logger.warning(f"Car verification API failed for {angle}: {e}")
            return {"score": 0.5, "angle": angle, "error": str(e)}
    
    async def _call_fraud_detection_api(self, image_path: str) -> Dict[str, Any]:
        """Call fraud detection API endpoint"""
        try:
            with open(image_path, 'rb') as f:
                files = {'image': (os.path.basename(image_path), f, 'image/jpeg')}
                
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        f"{self.api_url}/api/v1/detect-fraud",
                        files=files
                    ) as response:
                        if response.status == 200:
                            return await response.json()
                        else:
                            raise Exception(f"API error: {response.status}")
        except Exception as e:
            logger.warning(f"Fraud detection API failed: {e}")
            return {"fraud_probability": 0.1, "error": str(e)}
    
    async def _call_damage_assessment_api(self, image_path: str) -> Dict[str, Any]:
        """Call damage assessment API endpoint"""
        try:
            with open(image_path, 'rb') as f:
                files = {'image': (os.path.basename(image_path), f, 'image/jpeg')}
                
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        f"{self.api_url}/api/v1/assess-damage",
                        files=files
                    ) as response:
                        if response.status == 200:
                            return await response.json()
                        else:
                            raise Exception(f"API error: {response.status}")
        except Exception as e:
            logger.warning(f"Damage assessment API failed: {e}")
            return {"confidence": 0.7, "damage_detected": True, "error": str(e)}
    
    async def verify_multiple_angles(self, image_paths: Dict[str, str]) -> Dict[str, Any]:
        """
        Verify car images from multiple angles
        
        Args:
            image_paths: Dictionary mapping angle names to image paths
            
        Returns:
            Combined verification results for all angles
        """
        if not self.api_url:
            return {
                "verified": False,
                "score": 0,
                "message": "Car verification is not configured",
                "angle_results": {}
            }
            
        results = {}
        total_score = 0
        verified_count = 0
        
        for angle, path in image_paths.items():
            try:
                result = await self.verify_car(path)
                results[angle] = result
                if result.get("verified", False):
                    verified_count += 1
                    total_score += result.get("score", 0)
            except Exception as e:
                results[angle] = {
                    "verified": False,
                    "score": 0,
                    "error": str(e)
                }
        
        avg_score = total_score / len(image_paths) if image_paths else 0
        
        return {
            "verified": (verified_count / len(image_paths)) >= 0.5 if image_paths else False,
            "score": avg_score,
            "message": f"Verified {verified_count} of {len(image_paths)} angles",
            "angle_results": results
        }

# Create a singleton instance
car_verifier = CarVerifier()
