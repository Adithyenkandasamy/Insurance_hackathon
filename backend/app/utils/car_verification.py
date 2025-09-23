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
        self.api_url = os.getenv("CAR_VERIFICATION_API_URL")
        self.threshold = float(os.getenv("VERIFICATION_THRESHOLD", 0.7))
        
        if not self.api_url:
            logger.warning("CAR_VERIFICATION_API_URL not set. Car verification will be disabled.")
    
    async def verify_car(self, image_path: str) -> Dict[str, Any]:
        """
        Verify if the car image matches existing records
        
        Args:
            image_path: Path to the image file to verify
            
        Returns:
            Dict containing verification results
        """
        if not self.api_url:
            return {
                "verified": False,
                "score": 0,
                "message": "Car verification is not configured"
            }
            
        try:
            if not os.path.exists(image_path):
                raise CarVerificationError(f"Image file not found: {image_path}")
                
            with open(image_path, 'rb') as f:
                files = {'file': (os.path.basename(image_path), f, 'image/jpeg')}
                
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        f"{self.api_url}/check_car",
                        data={"threshold": self.threshold},
                        files=files
                    ) as response:
                        if response.status != 200:
                            error_text = await response.text()
                            raise CarVerificationError(
                                f"Verification API error: {response.status} - {error_text}"
                            )
                            
                        result = await response.json()
                        return {
                            "verified": result.get("similarity_score", 0) >= self.threshold,
                            "score": result.get("similarity_score", 0),
                            "message": "Verification completed",
                            "details": result
                        }
                        
        except Exception as e:
            logger.error(f"Error during car verification: {str(e)}")
            raise CarVerificationError(f"Failed to verify car: {str(e)}")
    
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
