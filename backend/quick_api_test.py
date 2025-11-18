#!/usr/bin/env python
"""Quick API test - checks if endpoints are accessible"""
import requests

def test_endpoints():
    base_url = 'http://localhost:8000'
    endpoints = [
        ('/admin/', 'GET', 'Django Admin'),
        ('/api/auth/token/', 'POST', 'Login Endpoint'),
        ('/api/auth/register/', 'POST', 'Register Endpoint'),
    ]
    
    print('Quick API Endpoint Test')
    print('=' * 60)
    
    for endpoint, method, name in endpoints:
        try:
            if method == 'GET':
                response = requests.get(f'{base_url}{endpoint}', timeout=5)
            else:
                # For POST, just check if endpoint exists (will get 400/405 if exists, 404 if not)
                response = requests.post(f'{base_url}{endpoint}', json={}, timeout=5)
            
            if response.status_code == 404:
                print(f'[FAIL] {name}: Not found (404)')
            elif response.status_code in [200, 400, 405]:
                print(f'[OK]   {name}: Accessible (Status: {response.status_code})')
            else:
                print(f'[INFO] {name}: Status {response.status_code}')
        except requests.exceptions.ConnectionError:
            print(f'[FAIL] {name}: Cannot connect - Is Django server running?')
        except Exception as e:
            print(f'[ERROR] {name}: {e}')
    
    print('=' * 60)
    print('\nNote: If endpoints return 404, make sure Django server is running')
    print('      from the HireScan backend directory, not another project.')

if __name__ == '__main__':
    test_endpoints()





















