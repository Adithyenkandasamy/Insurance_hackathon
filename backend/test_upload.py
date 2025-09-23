#!/usr/bin/env python3
import requests
import json
from PIL import Image
import io

# Create a test image
def create_test_image():
    img = Image.new('RGB', (300, 200), color='blue')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    return img_bytes

def test_upload_api():
    # First login to get token
    login_data = {
        "email": "admin@example.com",
        "password": "admin123"
    }
    
    print("🔐 Logging in as admin...")
    login_response = requests.post("http://localhost:8000/auth/login", json=login_data)
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        return
    
    token = login_response.json()["access_token"]
    print("✅ Login successful!")
    
    # Test image upload
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create test image
    test_image = create_test_image()
    
    print("📤 Testing image upload...")
    files = {"file": ("test_car.jpg", test_image, "image/jpeg")}
    params = {"angle": "front"}
    
    upload_response = requests.post(
        "http://localhost:8000/api/car-verification/upload/2",
        headers=headers,
        files=files,
        params=params
    )
    
    print(f"Upload response status: {upload_response.status_code}")
    if upload_response.status_code == 200:
        print("✅ Upload successful!")
        print(json.dumps(upload_response.json(), indent=2))
    else:
        print("❌ Upload failed!")
        print(upload_response.text)
    
    # Test admin images endpoint
    print("🖼️ Testing admin images endpoint...")
    admin_response = requests.get("http://localhost:8000/admin/images", headers=headers)
    
    print(f"Admin images response status: {admin_response.status_code}")
    if admin_response.status_code == 200:
        images = admin_response.json()
        print(f"✅ Found {len(images)} images in admin panel")
        for img in images:
            print(f"  - Image ID: {img['id']}, Path: {img['image_path']}, Angle: {img['angle']}")
    else:
        print("❌ Admin images failed!")
        print(admin_response.text)

if __name__ == "__main__":
    test_upload_api()
