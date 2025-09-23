#!/usr/bin/env python3
import requests
import json
from PIL import Image
import io

def create_test_image(color='blue', size=(300, 200)):
    """Create a test image with specified color"""
    img = Image.new('RGB', size, color=color)
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    return img_bytes

def test_verification_flow():
    # Login
    login_data = {"email": "admin@example.com", "password": "admin123"}
    
    print("🔐 Logging in...")
    login_response = requests.post("http://localhost:8000/auth/login", json=login_data)
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        return
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Login successful!")
    
    claim_id = 2  # Using existing claim
    
    # Test individual image uploads with immediate verification
    angles = ['front', 'back', 'left', 'right']
    colors = ['red', 'blue', 'green', 'yellow']
    
    print(f"\n📤 Testing individual image uploads for claim {claim_id}...")
    
    for angle, color in zip(angles, colors):
        print(f"\n🖼️ Uploading {angle} view ({color} image)...")
        
        test_image = create_test_image(color)
        files = {"file": (f"{angle}.jpg", test_image, "image/jpeg")}
        params = {"angle": angle}
        
        upload_response = requests.post(
            f"http://localhost:8000/api/car-verification/upload/{claim_id}",
            headers=headers,
            files=files,
            params=params
        )
        
        if upload_response.status_code == 200:
            result = upload_response.json()
            print(f"✅ {angle} uploaded successfully!")
            print(f"   - Verification Score: {result['scores']['confidence']:.1f}%")
            print(f"   - Status: {result['scores']['status']}")
            print(f"   - Message: {result['verification_result']['message']}")
        else:
            print(f"❌ {angle} upload failed: {upload_response.status_code}")
            print(upload_response.text)
    
    # Test verification status
    print(f"\n📊 Checking verification status...")
    status_response = requests.get(f"http://localhost:8000/api/car-verification/status/{claim_id}", headers=headers)
    
    if status_response.status_code == 200:
        status = status_response.json()
        print("✅ Status retrieved!")
        print(f"   - Overall Score: {status['overall_score']:.2f}")
        print(f"   - Verified Angles: {status['verified_angles']}/{status['total_angles']}")
        print(f"   - Completion: {status['verification_summary']['completion_percentage']:.1f}%")
    
    # Test submit verification
    print(f"\n🚀 Submitting verification...")
    submit_response = requests.post(f"http://localhost:8000/api/car-verification/submit/{claim_id}", headers=headers)
    
    if submit_response.status_code == 200:
        final_result = submit_response.json()
        print("✅ Verification submitted successfully!")
        print(f"   - Message: {final_result['message']}")
        print(f"   - Next Steps: {final_result['next_steps']}")
        
        verification_status = final_result['verification_status']
        print(f"\n📈 Final Results:")
        print(f"   - Total Images: {verification_status['total_images']}")
        print(f"   - Verified Images: {verification_status['verified_images']}")
        print(f"   - Average Score: {verification_status['average_score']:.2f}")
        print(f"   - All Verified: {verification_status['all_verified']}")
        print(f"   - Recommendation: {verification_status['recommendation']}")
        
        print(f"\n🔍 Individual Results:")
        for result in verification_status['individual_results']:
            print(f"   - {result['angle']}: {result['score']:.2f} ({'✓' if result['verified'] else '✗'})")
            
    else:
        print(f"❌ Submit failed: {submit_response.status_code}")
        print(submit_response.text)

if __name__ == "__main__":
    test_verification_flow()
