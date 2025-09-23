#!/usr/bin/env python3
import requests
import json
from PIL import Image
import io
from datetime import date

def create_test_image(color='blue'):
    """Create a test image with specified color"""
    img = Image.new('RGB', (300, 200), color=color)
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    return img_bytes

def test_claim_with_scoring():
    # Login as regular user first
    login_data = {
        "email": "admin@example.com",  # Using admin for testing
        "password": "admin123"
    }
    
    print("🔐 Logging in...")
    login_response = requests.post("http://localhost:8000/auth/login", json=login_data)
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        return
    
    token = login_response.json()["access_token"]
    print("✅ Login successful!")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create a new claim with images
    print("📝 Creating new claim with images...")
    
    # Prepare form data
    form_data = {
        'policy_number': 'TEST-POL-001',
        'accident_date': str(date.today()),
        'location': 'Test Location, Test City',
        'description': 'Test accident for scoring verification'
    }
    
    # Create test images
    test_images = [
        ('images', ('front.jpg', create_test_image('red'), 'image/jpeg')),
        ('images', ('back.jpg', create_test_image('blue'), 'image/jpeg')),
        ('images', ('left.jpg', create_test_image('green'), 'image/jpeg')),
        ('images', ('right.jpg', create_test_image('yellow'), 'image/jpeg'))
    ]
    
    # Submit claim
    claim_response = requests.post(
        "http://localhost:8000/claims/",
        headers=headers,
        data=form_data,
        files=test_images
    )
    
    print(f"Claim creation response status: {claim_response.status_code}")
    if claim_response.status_code == 200:
        claim_data = claim_response.json()
        claim_id = claim_data['id']
        print(f"✅ Claim created successfully! ID: {claim_id}")
        
        # Display initial scores
        print(f"📊 Initial Scores:")
        print(f"  - Damage Score: {claim_data.get('damage_score', 0):.2f}")
        print(f"  - Fraud Score: {claim_data.get('fraud_score', 0):.2f}")
        print(f"  - Cost Estimate: ${claim_data.get('cost_estimate', 0):,.2f}")
        print(f"  - Status: {claim_data.get('status', 'unknown')}")
        
        # Get detailed scores
        print("🔍 Fetching detailed scores...")
        scores_response = requests.get(f"http://localhost:8000/claims/{claim_id}/scores", headers=headers)
        
        if scores_response.status_code == 200:
            scores_data = scores_response.json()
            print("✅ Detailed scores retrieved!")
            print(json.dumps(scores_data, indent=2))
            
            # Display breakdown
            breakdown = scores_data.get('scores_breakdown', {})
            print(f"\n📈 Scores Breakdown:")
            
            damage = breakdown.get('damage_assessment', {})
            print(f"  🔧 Damage Assessment:")
            print(f"    - Score: {damage.get('score', 0):.2f}")
            print(f"    - Confidence: {damage.get('confidence', 0):.2f}")
            print(f"    - Severity: {damage.get('severity', 'unknown')}")
            
            fraud = breakdown.get('fraud_detection', {})
            print(f"  🚨 Fraud Detection:")
            print(f"    - Score: {fraud.get('score', 0):.2f}")
            print(f"    - Risk Level: {fraud.get('risk_level', 'unknown')}")
            print(f"    - Suspicious: {fraud.get('is_suspicious', False)}")
            
            car_verify = breakdown.get('car_verification', {})
            print(f"  🚗 Car Verification:")
            print(f"    - Verified: {car_verify.get('verified', False)}")
            print(f"    - Score: {car_verify.get('score', 0):.2f}")
            print(f"    - Message: {car_verify.get('message', 'N/A')}")
            
        else:
            print(f"❌ Failed to get detailed scores: {scores_response.status_code}")
            print(scores_response.text)
            
    else:
        print("❌ Claim creation failed!")
        print(claim_response.text)

if __name__ == "__main__":
    test_claim_with_scoring()
