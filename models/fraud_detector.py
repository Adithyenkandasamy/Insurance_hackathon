import cv2
import numpy as np
import hashlib
import os
import random
from datetime import datetime
from PIL import Image
from PIL.ExifTags import TAGS

class FraudDetector:
    """
    Fraud detection system for insurance claim images
    Hackathon version with dummy AI models - would use deep learning in production
    """
    
    def __init__(self):
        self.known_hashes = set()  # Store image hashes to detect duplicates
        self.suspicious_patterns = [
            'inconsistent_lighting',
            'cloning_artifacts', 
            'resolution_mismatch',
            'compression_artifacts',
            'metadata_tampering',
            'impossible_damage_pattern'
        ]
        
        self.risk_thresholds = {
            'low': 0.3,
            'medium': 0.6,
            'high': 0.8
        }

    def check_images(self, image_paths):
        """
        Comprehensive fraud detection analysis on uploaded images
        Returns fraud assessment results
        """
        if not image_paths:
            return self._empty_fraud_result()
        
        fraud_scores = []
        detected_issues = []
        duplicate_count = 0
        metadata_issues = []
        
        for image_path in image_paths:
            if os.path.exists(image_path):
                analysis = self._analyze_single_image(image_path)
                fraud_scores.append(analysis['fraud_score'])
                detected_issues.extend(analysis['issues'])
                
                if analysis['is_duplicate']:
                    duplicate_count += 1
                
                metadata_issues.extend(analysis['metadata_issues'])
        
        # Calculate overall fraud score
        avg_fraud_score = sum(fraud_scores) / len(fraud_scores) if fraud_scores else 0
        
        # Increase score if multiple duplicates found
        if duplicate_count > 1:
            avg_fraud_score = min(avg_fraud_score + 0.3, 1.0)
        
        # Determine risk level
        risk_level = self._determine_risk_level(avg_fraud_score)
        
        return {
            'fraud_score': round(avg_fraud_score, 2),
            'risk_level': risk_level,
            'is_suspicious': avg_fraud_score > self.risk_thresholds['medium'],
            'detected_issues': list(set(detected_issues)),  # Remove duplicates
            'duplicate_images': duplicate_count,
            'metadata_issues': metadata_issues,
            'num_images_analyzed': len(image_paths),
            'analysis_timestamp': datetime.now().isoformat(),
            'recommendations': self._generate_fraud_recommendations(avg_fraud_score, detected_issues)
        }
    
    def _analyze_single_image(self, image_path):
        """Analyze single image for fraud indicators"""
        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                return self._empty_single_fraud_result()
            
            fraud_score = 0.0
            issues = []
            metadata_issues = []
            
            # 1. Hash-based duplicate detection
            is_duplicate = self._check_duplicate(image_path)
            if is_duplicate:
                fraud_score += 0.4
                issues.append('duplicate_image')
            
            # 2. Metadata analysis
            metadata_score = self._analyze_metadata(image_path)
            if metadata_score > 0.5:
                fraud_score += metadata_score * 0.3
                metadata_issues.append('suspicious_metadata')
            
            # 3. Error Level Analysis (ELA) simulation
            ela_score = self._simulate_ela_analysis(image)
            if ela_score > 0.6:
                fraud_score += 0.2
                issues.append('possible_manipulation')
            
            # 4. Lighting consistency check
            lighting_score = self._check_lighting_consistency(image)
            if lighting_score > 0.7:
                fraud_score += 0.15
                issues.append('inconsistent_lighting')
            
            # 5. Resolution/quality analysis
            quality_score = self._analyze_image_quality(image)
            if quality_score > 0.6:
                fraud_score += 0.1
                issues.append('quality_inconsistency')
            
            # 6. Physics-based validation
            physics_score = self._validate_damage_physics(image)
            if physics_score > 0.7:
                fraud_score += 0.2
                issues.append('impossible_damage_pattern')
            
            # Cap fraud score at 1.0
            fraud_score = min(fraud_score, 1.0)
            
            return {
                'fraud_score': fraud_score,
                'is_duplicate': is_duplicate,
                'issues': issues,
                'metadata_issues': metadata_issues,
                'analysis_details': {
                    'ela_score': ela_score,
                    'lighting_score': lighting_score,
                    'quality_score': quality_score,
                    'physics_score': physics_score,
                    'metadata_score': metadata_score
                }
            }
            
        except Exception as e:
            print(f"Error in fraud analysis for {image_path}: {str(e)}")
            return self._empty_single_fraud_result()
    
    def _check_duplicate(self, image_path):
        """Check if image is a duplicate using hash comparison"""
        try:
            with open(image_path, 'rb') as f:
                image_hash = hashlib.sha256(f.read()).hexdigest()
            
            if image_hash in self.known_hashes:
                return True
            
            self.known_hashes.add(image_hash)
            return False
            
        except Exception:
            return False
    
    def _analyze_metadata(self, image_path):
        """Analyze EXIF metadata for tampering indicators"""
        try:
            image = Image.open(image_path)
            exifdata = image.getexif()
            
            if not exifdata:
                return 0.3  # Suspicious if no metadata
            
            metadata = {}
            for tag_id in exifdata:
                tag = TAGS.get(tag_id, tag_id)
                data = exifdata.get(tag_id)
                metadata[tag] = data
            
            suspicion_score = 0.0
            
            # Check for editing software traces
            software = str(metadata.get('Software', '')).lower()
            editing_software = ['photoshop', 'gimp', 'paint.net', 'canva', 'pixlr']
            if any(editor in software for editor in editing_software):
                suspicion_score += 0.4
            
            # Check for missing critical metadata
            critical_fields = ['DateTime', 'Make', 'Model']
            missing_fields = sum(1 for field in critical_fields if field not in metadata)
            suspicion_score += missing_fields * 0.2
            
            # Check for timestamp inconsistencies
            if 'DateTime' in metadata:
                try:
                    photo_time = datetime.strptime(str(metadata['DateTime']), '%Y:%m:%d %H:%M:%S')
                    if photo_time > datetime.now():
                        suspicion_score += 0.3  # Future timestamp
                except:
                    suspicion_score += 0.2  # Invalid timestamp format
            
            return min(suspicion_score, 1.0)
            
        except Exception:
            return 0.2  # Neutral score if metadata can't be read
    
    def _simulate_ela_analysis(self, image):
        """Simulate Error Level Analysis for manipulation detection"""
        try:
            # Convert to grayscale for analysis
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Simulate compression artifact analysis
            # In real implementation, this would involve JPEG re-compression and difference analysis
            
            # Calculate gradient variance as proxy for manipulation
            grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
            grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
            
            gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
            gradient_variance = np.var(gradient_magnitude)
            
            # Normalize and add randomness for simulation
            ela_score = min(gradient_variance / 10000, 0.8) + random.uniform(0, 0.3)
            return min(ela_score, 1.0)
            
        except Exception:
            return 0.0
    
    def _check_lighting_consistency(self, image):
        """Check for lighting inconsistencies that might indicate manipulation"""
        try:
            # Convert to LAB color space for better lighting analysis
            lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
            l_channel = lab[:, :, 0]  # Lightness channel
            
            # Divide image into regions and analyze lighting
            h, w = l_channel.shape
            regions = [
                l_channel[0:h//2, 0:w//2],      # Top-left
                l_channel[0:h//2, w//2:w],      # Top-right
                l_channel[h//2:h, 0:w//2],      # Bottom-left
                l_channel[h//2:h, w//2:w]       # Bottom-right
            ]
            
            # Calculate mean brightness for each region
            region_means = [np.mean(region) for region in regions]
            brightness_variance = np.var(region_means)
            
            # High variance might indicate inconsistent lighting
            inconsistency_score = min(brightness_variance / 1000, 0.8) + random.uniform(0, 0.2)
            return min(inconsistency_score, 1.0)
            
        except Exception:
            return 0.0
    
    def _analyze_image_quality(self, image):
        """Analyze image quality inconsistencies"""
        try:
            # Calculate local variance to detect quality inconsistencies
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Apply Laplacian operator to detect blur/sharpness variations
            laplacian = cv2.Laplacian(gray, cv2.CV_64F)
            laplacian_var = np.var(laplacian)
            
            # Low variance might indicate uniform blur or manipulation
            if laplacian_var < 100:
                quality_score = 0.7 + random.uniform(0, 0.3)
            else:
                quality_score = random.uniform(0, 0.4)
            
            return min(quality_score, 1.0)
            
        except Exception:
            return 0.0
    
    def _validate_damage_physics(self, image):
        """Validate if damage patterns follow physics laws"""
        try:
            # Simplified physics validation
            # In production, this would analyze impact patterns, crack propagation, etc.
            
            # For now, randomly generate physics violations based on image properties
            height, width = image.shape[:2]
            aspect_ratio = width / height
            
            # Unusual aspect ratios might indicate cropping/manipulation
            if aspect_ratio < 0.5 or aspect_ratio > 3.0:
                physics_score = 0.6 + random.uniform(0, 0.4)
            else:
                physics_score = random.uniform(0, 0.5)
            
            return min(physics_score, 1.0)
            
        except Exception:
            return 0.0
    
    def _determine_risk_level(self, fraud_score):
        """Determine risk level based on fraud score"""
        if fraud_score < self.risk_thresholds['low']:
            return 'low'
        elif fraud_score < self.risk_thresholds['medium']:
            return 'medium'
        elif fraud_score < self.risk_thresholds['high']:
            return 'high'
        else:
            return 'critical'
    
    def _generate_fraud_recommendations(self, fraud_score, issues):
        """Generate recommendations based on fraud analysis"""
        recommendations = []
        
        if fraud_score < 0.3:
            recommendations.append("Images appear authentic - proceed with standard processing")
        elif fraud_score < 0.6:
            recommendations.append("Minor concerns detected - additional verification recommended")
        elif fraud_score < 0.8:
            recommendations.append("Significant fraud indicators - manual review required")
        else:
            recommendations.append("High fraud probability - detailed investigation necessary")
        
        # Add specific issue recommendations
        if 'duplicate_image' in issues:
            recommendations.append("Duplicate images detected - verify claim authenticity")
        if 'possible_manipulation' in issues:
            recommendations.append("Image manipulation suspected - request original photos")
        if 'inconsistent_lighting' in issues:
            recommendations.append("Lighting inconsistencies found - verify photo location and timing")
        if 'impossible_damage_pattern' in issues:
            recommendations.append("Damage patterns may violate physics - expert assessment needed")
        
        return recommendations
    
    def _empty_fraud_result(self):
        """Return empty fraud result structure"""
        return {
            'fraud_score': 0.0,
            'risk_level': 'unknown',
            'is_suspicious': False,
            'detected_issues': [],
            'duplicate_images': 0,
            'metadata_issues': [],
            'num_images_analyzed': 0,
            'analysis_timestamp': datetime.now().isoformat(),
            'recommendations': ['No images provided for analysis']
        }
    
    def _empty_single_fraud_result(self):
        """Return empty single image fraud result"""
        return {
            'fraud_score': 0.0,
            'is_duplicate': False,
            'issues': [],
            'metadata_issues': [],
            'analysis_details': {}
        }
    
    def get_issue_explanation(self, issue_type):
        """Get human-readable explanation for detected issues"""
        explanations = {
            'duplicate_image': 'This image appears to be identical to a previously submitted image',
            'possible_manipulation': 'Digital manipulation artifacts detected in the image',
            'inconsistent_lighting': 'Lighting patterns suggest possible photo composition',
            'quality_inconsistency': 'Image quality varies across different regions',
            'impossible_damage_pattern': 'Damage pattern appears to violate physical laws',
            'suspicious_metadata': 'Image metadata shows signs of tampering or editing'
        }
        return explanations.get(issue_type, 'Unknown fraud indicator')
