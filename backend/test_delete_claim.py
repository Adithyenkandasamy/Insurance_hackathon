#!/usr/bin/env python3
"""
Test script for claim deletion functionality
"""
import requests
import json
import os

BASE_URL = "http://localhost:8000"

def test_delete_claim():
    """Test the complete delete claim flow"""
    
    # Step 1: Login as admin
    print("1. Logging in as admin...")
    login_data = {
        "email": "admin@example.com",
        "password": "admin123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"Login failed: {response.status_code} - {response.text}")
        return False
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ Login successful")
    
    # Step 2: Create a test claim
    print("2. Creating a test claim...")
    claim_data = {
        "policy_number": "TEST-DELETE-001",
        "accident_date": "2024-01-15",
        "location": "Test Location for Deletion",
        "description": "Test claim for deletion functionality",
        "cost_estimate": 5000
    }
    
    response = requests.post(f"{BASE_URL}/claims/", json=claim_data, headers=headers)
    if response.status_code != 200:
        print(f"Claim creation failed: {response.status_code} - {response.text}")
        return False
    
    claim_id = response.json()["id"]
    print(f"✓ Test claim created with ID: {claim_id}")
    
    # Step 3: Verify claim exists
    print("3. Verifying claim exists...")
    response = requests.get(f"{BASE_URL}/claims/{claim_id}", headers=headers)
    if response.status_code != 200:
        print(f"Claim verification failed: {response.status_code}")
        return False
    print("✓ Claim exists and is accessible")
    
    # Step 4: Delete the claim
    print("4. Deleting the claim...")
    response = requests.delete(f"{BASE_URL}/claims/{claim_id}", headers=headers)
    if response.status_code != 200:
        print(f"Claim deletion failed: {response.status_code} - {response.text}")
        return False
    
    delete_result = response.json()
    print(f"✓ Claim deleted: {delete_result['message']}")
    
    # Step 5: Verify claim is deleted
    print("5. Verifying claim is deleted...")
    response = requests.get(f"{BASE_URL}/claims/{claim_id}", headers=headers)
    if response.status_code == 404:
        print("✓ Claim successfully deleted - returns 404 as expected")
        return True
    else:
        print(f"✗ Claim still exists: {response.status_code}")
        return False

def test_unauthorized_delete():
    """Test that non-owners cannot delete claims"""
    print("\n6. Testing unauthorized deletion...")
    
    # Login as admin and create a claim
    login_data = {"email": "admin@example.com", "password": "admin123"}
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    admin_token = response.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create claim as admin
    claim_data = {
        "policy_number": "TEST-UNAUTH-001",
        "accident_date": "2024-01-15",
        "location": "Test Location",
        "description": "Test unauthorized deletion",
        "cost_estimate": 3000
    }
    
    response = requests.post(f"{BASE_URL}/claims/", json=claim_data, headers=admin_headers)
    claim_id = response.json()["id"]
    
    # Try to delete without authentication
    response = requests.delete(f"{BASE_URL}/claims/{claim_id}")
    if response.status_code == 401:
        print("✓ Unauthorized deletion properly blocked")
        
        # Clean up - delete as admin
        requests.delete(f"{BASE_URL}/claims/{claim_id}", headers=admin_headers)
        return True
    else:
        print(f"✗ Unauthorized deletion not blocked: {response.status_code}")
        return False

if __name__ == "__main__":
    print("Testing Claim Deletion Functionality")
    print("=" * 50)
    
    try:
        success1 = test_delete_claim()
        success2 = test_unauthorized_delete()
        
        if success1 and success2:
            print("\n🎉 All deletion tests passed!")
        else:
            print("\n❌ Some tests failed")
            
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
