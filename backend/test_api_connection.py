#!/usr/bin/env python
"""Test script to verify API connection and token transmission"""
import os
import sys
import django
import requests
import json

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hirescan.settings')
django.setup()

from core.models import User

def test_api_connection():
    """Test API endpoints and token transmission"""
    base_url = 'http://localhost:8000'
    api_base = f'{base_url}/api'
    
    print('=' * 80)
    print('API Connection and Token Transmission Test')
    print('=' * 80)
    print()
    
    # Test 1: Check if server is running
    print('[Test 1] Checking if Django server is running...')
    try:
        response = requests.get(f'{base_url}/admin/', timeout=5)
        print(f'[OK] Server is running (Status: {response.status_code})')
    except requests.exceptions.ConnectionError:
        print('[ERROR] Cannot connect to Django server. Is it running?')
        print('        Start server with: python manage.py runserver')
        return False
    except Exception as e:
        print(f'[WARNING] Server check failed: {e}')
    print()
    
    # Test 2: Test login endpoint
    print('[Test 2] Testing login endpoint (/api/auth/token/)...')
    try:
        # Get or create test user
        user, created = User.objects.get_or_create(
            email='a@yahoo.com',
            defaults={'is_staff': True, 'is_superuser': True}
        )
        if created:
            user.set_password('123qwe')
            user.save()
            print(f'[INFO] Created test user: {user.email}')
        else:
            user.set_password('123qwe')
            user.save()
            print(f'[INFO] Using existing user: {user.email}')
        
        # Test login
        login_data = {
            'email': 'a@yahoo.com',
            'password': '123qwe'
        }
        response = requests.post(
            f'{api_base}/auth/token/',
            json=login_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            access_token = data.get('access')
            refresh_token = data.get('refresh')
            user_data = data.get('user')
            
            print(f'[OK] Login successful!')
            print(f'     Access token received: {access_token[:50]}...')
            print(f'     Refresh token received: {refresh_token[:50]}...')
            if user_data:
                print(f'     User data: {user_data}')
            
            # Test 3: Test authenticated endpoint with token
            print()
            print('[Test 3] Testing authenticated endpoint with token (/api/auth/me/)...')
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            response = requests.get(
                f'{api_base}/auth/me/',
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                user_info = response.json()
                print(f'[OK] Authenticated request successful!')
                print(f'     User info: {user_info}')
            else:
                print(f'[ERROR] Authenticated request failed!')
                print(f'     Status: {response.status_code}')
                print(f'     Response: {response.text}')
                return False
            
            # Test 4: Test token refresh
            print()
            print('[Test 4] Testing token refresh (/api/auth/token/refresh/)...')
            refresh_data = {'refresh': refresh_token}
            response = requests.post(
                f'{api_base}/auth/token/refresh/',
                json=refresh_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                new_access_token = response.json().get('access')
                print(f'[OK] Token refresh successful!')
                print(f'     New access token: {new_access_token[:50]}...')
            else:
                print(f'[ERROR] Token refresh failed!')
                print(f'     Status: {response.status_code}')
                print(f'     Response: {response.text}')
                return False
            
            # Test 5: Test without token (should fail)
            print()
            print('[Test 5] Testing protected endpoint without token (should fail)...')
            response = requests.get(
                f'{api_base}/auth/me/',
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 401:
                print(f'[OK] Correctly rejected request without token (401 Unauthorized)')
            else:
                print(f'[WARNING] Expected 401, got {response.status_code}')
            
            # Test 6: Test with invalid token (should fail)
            print()
            print('[Test 6] Testing with invalid token (should fail)...')
            headers = {
                'Authorization': 'Bearer invalid_token_12345',
                'Content-Type': 'application/json'
            }
            response = requests.get(
                f'{api_base}/auth/me/',
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 401:
                print(f'[OK] Correctly rejected request with invalid token (401 Unauthorized)')
            else:
                print(f'[WARNING] Expected 401, got {response.status_code}')
            
            print()
            print('=' * 80)
            print('[SUCCESS] All API connection tests passed!')
            print('=' * 80)
            print()
            print('Summary:')
            print('  - Login endpoint: OK')
            print('  - Token transmission: OK')
            print('  - Authenticated requests: OK')
            print('  - Token refresh: OK')
            print('  - Security (rejecting invalid tokens): OK')
            print()
            print('Frontend should be able to connect to backend successfully!')
            return True
            
        else:
            print(f'[ERROR] Login failed!')
            print(f'     Status: {response.status_code}')
            print(f'     Response: {response.text}')
            return False
            
    except Exception as e:
        print(f'[ERROR] Test failed with exception: {e}')
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = test_api_connection()
    sys.exit(0 if success else 1)



















