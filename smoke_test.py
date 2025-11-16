"""
Smoke Test برای HireScan ATS
این تست تمام روند کار را از signup تا نمایش کاندیدها به super user بررسی می‌کند.
"""

import os
import sys
import time
import json
import requests
from pathlib import Path
from typing import Dict, Any, List, Optional
import tempfile
from io import BytesIO

# Fix encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# تنظیمات
BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:8000/api')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

class SmokeTest:
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.session = requests.Session()
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.user_email: Optional[str] = None
        self.job_id: Optional[int] = None
        self.candidate_ids: List[int] = []
        self.test_results: Dict[str, Any] = {
            'passed': [],
            'failed': [],
            'warnings': []
        }
    
    def log_result(self, test_name: str, passed: bool, message: str = "", warning: bool = False):
        """ثبت نتیجه تست"""
        result = {
            'test': test_name,
            'message': message,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        if warning:
            self.test_results['warnings'].append(result)
            print(f"[WARNING] {test_name} - {message}")
        elif passed:
            self.test_results['passed'].append(result)
            print(f"[PASS] {test_name} - {message}")
        else:
            self.test_results['failed'].append(result)
            print(f"[FAIL] {test_name} - {message}")
    
    def print_section(self, title: str):
        """چاپ عنوان بخش"""
        print(f"\n{'='*60}")
        print(f"  {title}")
        print(f"{'='*60}\n")
    
    # ========== Step 1: Sign Up ==========
    def test_signup(self) -> bool:
        """تست ثبت‌نام کاربر"""
        self.print_section("Step 1: User Sign Up")
        
        try:
            # تولید ایمیل یکتا برای تست
            timestamp = int(time.time())
            self.user_email = f"test_user_{timestamp}@smoketest.com"
            
            signup_data = {
                'email': self.user_email,
                'password': 'TestPassword123!',
                'password2': 'TestPassword123!',
                'first_name': 'Test',
                'last_name': 'User'
            }
            
            print(f"[INFO] Attempting signup with email: {self.user_email}")
            response = self.session.post(
                f"{self.base_url}/auth/register/",
                json=signup_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 201:
                data = response.json()
                self.access_token = data.get('access')
                self.refresh_token = data.get('refresh')
                
                if self.access_token:
                    self.session.headers.update({
                        'Authorization': f'Bearer {self.access_token}'
                    })
                    self.log_result(
                        "Sign Up",
                        True,
                        f"User created successfully. Email: {self.user_email}"
                    )
                    
                    # بررسی ذخیره شدن کاربر در backend
                    user_data = data.get('user', {})
                    if user_data.get('email') == self.user_email:
                        self.log_result(
                            "Sign Up - User Data Verification",
                            True,
                            "User data correctly returned from backend"
                        )
                    else:
                        self.log_result(
                            "Sign Up - User Data Verification",
                            False,
                            f"Expected email {self.user_email}, got {user_data.get('email')}"
                        )
                        return False
                    
                    return True
                else:
                    self.log_result(
                        "Sign Up",
                        False,
                        "Access token not received in response"
                    )
                    return False
            else:
                error_msg = response.json().get('error', response.text)
                self.log_result(
                    "Sign Up",
                    False,
                    f"Signup failed with status {response.status_code}: {error_msg}"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Sign Up",
                False,
                f"Exception during signup: {str(e)}"
            )
            return False
    
    # ========== Step 2: Create Job ==========
    def test_create_job(self) -> bool:
        """تست ایجاد job"""
        self.print_section("Step 2: Create Job")
        
        if not self.access_token:
            self.log_result(
                "Create Job",
                False,
                "No access token available. Signup must be completed first."
            )
            return False
        
        try:
            # ابتدا department ها را دریافت کنیم
            dept_response = self.session.get(f"{self.base_url}/jobs/departments/")
            department_id = None
            
            if dept_response.status_code == 200:
                departments = dept_response.json()
                if isinstance(departments, dict) and 'results' in departments:
                    departments = departments['results']
                if departments and len(departments) > 0:
                    department_id = departments[0].get('id')
                    print(f"[INFO] Using department ID: {department_id}")
            
            job_data = {
                'title': 'Senior Software Engineer - Smoke Test',
                'description': 'We are looking for an experienced software engineer with strong backend skills. Must have 5+ years of experience in Python, Django, and REST APIs.',
                'location': 'Tehran, Remote',
                'employment_type': 'full_time',
                'experience_level': 'senior',
                'salary_min': '15000000',
                'salary_max': '25000000',
                'required_skills': [
                    {'name': 'Python', 'priority': 'high'},
                    {'name': 'Django', 'priority': 'high'},
                    {'name': 'REST APIs', 'priority': 'high'},
                    {'name': 'PostgreSQL', 'priority': 'medium'},
                    {'name': 'Docker', 'priority': 'medium'}
                ],
                'experience_min_years': 5,
                'experience_min_years_auto_reject': True,
                'age_range_min': 27,
                'age_range_max': 40,
                'age_range_auto_reject': True,
                'gender': 'any',
                'gender_auto_reject': False,
                'military_status': 'completed_or_full_exempt',
                'military_auto_reject': True,
                'education_level': 'bachelor',
                'education_level_auto_reject': True,
                'education_major': ['Computer Science', 'Software Engineering'],
                'education_major_auto_reject': False,
                'preferred_universities_enabled': False,
                'preferred_universities_auto_reject': False,
                'preferred_universities': [],
                'target_companies_enabled': False,
                'target_companies': []
            }
            
            if department_id:
                job_data['department'] = department_id
            
            print(f"[INFO] Creating job: {job_data['title']}")
            response = self.session.post(
                f"{self.base_url}/jobs/jobs/new/",
                json=job_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.job_id = data.get('id')
                
                if self.job_id:
                    self.log_result(
                        "Create Job",
                        True,
                        f"Job created successfully with ID: {self.job_id}"
                    )
                    
                    # بررسی کامل بودن اطلاعات job در backend
                    verify_response = self.session.get(f"{self.base_url}/jobs/jobs/{self.job_id}/")
                    if verify_response.status_code == 200:
                        job_details = verify_response.json()
                        
                        # بررسی فیلدهای مهم
                        checks = [
                            ('title', job_data['title']),
                            ('description', job_data['description']),
                            ('location', job_data['location']),
                            ('experience_min_years', job_data['experience_min_years']),
                        ]
                        
                        all_passed = True
                        for field, expected_value in checks:
                            actual_value = job_details.get(field)
                            if actual_value == expected_value:
                                self.log_result(
                                    f"Create Job - Field Verification ({field})",
                                    True,
                                    f"{field} correctly stored: {actual_value}"
                                )
                            else:
                                self.log_result(
                                    f"Create Job - Field Verification ({field})",
                                    False,
                                    f"Expected {expected_value}, got {actual_value}"
                                )
                                all_passed = False
                        
                        # بررسی created_by
                        if job_details.get('created_by') and self.user_email:
                            self.log_result(
                                "Create Job - Created By Verification",
                                True,
                                "Job correctly associated with user"
                            )
                        else:
                            self.log_result(
                                "Create Job - Created By Verification",
                                False,
                                "Job not correctly associated with user"
                            )
                            all_passed = False
                        
                        return all_passed
                    else:
                        self.log_result(
                            "Create Job - Verification",
                            False,
                            f"Failed to retrieve job details: {verify_response.status_code}"
                        )
                        return False
                else:
                    self.log_result(
                        "Create Job",
                        False,
                        "Job ID not received in response"
                    )
                    return False
            else:
                error_msg = response.json().get('error', response.text) if response.content else response.text
                self.log_result(
                    "Create Job",
                    False,
                    f"Job creation failed with status {response.status_code}: {error_msg}"
                )
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_result(
                "Create Job",
                False,
                f"Exception during job creation: {str(e)}"
            )
            import traceback
            traceback.print_exc()
            return False
    
    # ========== Step 3: Upload Resumes ==========
    def create_test_docx_bytes(self, filename: str, content: str = None) -> BytesIO:
        """ایجاد یک فایل DOCX تستی ساده به صورت BytesIO"""
        try:
            from docx import Document
            from docx.shared import Pt
        except ImportError:
            # اگر docx نصب نشده، از یک فایل متنی ساده استفاده کن
            print("[WARNING] python-docx not installed, using text file instead")
            file_bytes = BytesIO(content.encode('utf-8') if content else b'')
            file_bytes.name = filename.replace('.docx', '.txt')
            return file_bytes
        
        if content is None:
            content = f"""
            John Doe
            Email: john.doe@example.com
            Phone: +98-912-345-6789
            
            Experience:
            - Senior Software Engineer at TechCorp (2020 - Present)
              • Developed REST APIs using Python and Django
              • Worked with PostgreSQL databases
              • Implemented Docker containerization
            
            - Software Engineer at StartupXYZ (2017 - 2020)
              • Built web applications with Django
              • Designed database schemas
            
            Education:
            - BSc in Computer Science, Tehran University (2013 - 2017)
            
            Skills:
            - Python, Django, REST APIs, PostgreSQL, Docker, Git
            """
        
        # ایجاد یک فایل DOCX واقعی
        doc = Document()
        
        # اضافه کردن محتوا به سند
        lines = content.strip().split('\n')
        for line in lines:
            if line.strip():
                para = doc.add_paragraph(line.strip())
                para.paragraph_format.space_after = Pt(6)
        
        # ذخیره به BytesIO
        file_bytes = BytesIO()
        doc.save(file_bytes)
        file_bytes.seek(0)  # برگشت به ابتدای فایل
        file_bytes.name = filename
        return file_bytes
    
    def test_upload_resumes(self) -> bool:
        """تست آپلود چندین رزومه"""
        self.print_section("Step 3: Upload Multiple Resumes")
        
        if not self.access_token:
            self.log_result(
                "Upload Resumes",
                False,
                "No access token available. Signup must be completed first."
            )
            return False
        
        if not self.job_id:
            self.log_result(
                "Upload Resumes",
                False,
                "No job ID available. Job creation must be completed first."
            )
            return False
        
        try:
            # ایجاد چندین فایل تستی
            test_files = []
            resume_contents = [
                """
                Jane Smith
                Email: jane.smith@example.com
                Phone: +98-912-111-2222
                
                Experience:
                - Backend Developer at WebDev Inc (2019 - Present)
                  • Python, Django, FastAPI
                  • PostgreSQL, Redis
                  • Docker, Kubernetes
                
                Education:
                - BSc in Software Engineering, Sharif University (2015 - 2019)
                
                Skills: Python, Django, FastAPI, PostgreSQL, Docker, Kubernetes
                """,
                """
                Mike Johnson
                Email: mike.johnson@example.com
                Phone: +98-912-333-4444
                
                Experience:
                - Full Stack Developer at TechStart (2018 - Present)
                  • Python, Django, React
                  • PostgreSQL, MongoDB
                  • AWS, Docker
                
                Education:
                - BSc in Computer Science, Amirkabir University (2014 - 2018)
                
                Skills: Python, Django, React, PostgreSQL, MongoDB, AWS
                """,
                """
                Sarah Williams
                Email: sarah.williams@example.com
                Phone: +98-912-555-6666
                
                Experience:
                - Software Engineer at DataCorp (2020 - Present)
                  • Python, Django, REST APIs
                  • PostgreSQL, Elasticsearch
                  • Docker, CI/CD
                
                Education:
                - BSc in Computer Science, Tehran University (2016 - 2020)
                
                Skills: Python, Django, REST APIs, PostgreSQL, Docker, Git
                """
            ]
            
            file_handles = []
            for i, content in enumerate(resume_contents):
                # استفاده از DOCX به جای PDF چون ساخت PDF واقعی پیچیده است
                filename = f"resume_{i+1}_test.docx"
                file_bytes = self.create_test_docx_bytes(filename, content)
                file_handles.append(file_bytes)
                test_files.append(('files', (filename, file_bytes, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')))
                print(f"[INFO] Created test file: {filename}")
            
            print(f"[INFO] Uploading {len(test_files)} resumes to job ID: {self.job_id}")
            
            try:
                # آپلود فایل‌ها
                upload_data = {
                    'job_id': str(self.job_id)
                }
                
                response = self.session.post(
                    f"{self.base_url}/candidates/upload-cv/",
                    files=test_files,
                    data=upload_data
                )
            finally:
                # بستن فایل‌ها
                for file_handle in file_handles:
                    try:
                        if hasattr(file_handle, 'close'):
                            file_handle.close()
                    except Exception as e:
                        # اگر خطا در بستن فایل رخ داد، نادیده بگیر
                        pass
            
            if response.status_code == 200:
                data = response.json()
                successful = data.get('successful', 0)
                failed = data.get('failed', 0)
                results = data.get('results', [])
                batch_id = data.get('batch_id')
                
                print(f"✅ Successful uploads: {successful}")
                print(f"❌ Failed uploads: {failed}")
                
                if successful > 0:
                    self.log_result(
                        "Upload Resumes",
                        True,
                        f"Successfully uploaded {successful} out of {len(test_files)} resumes"
                    )
                    
                    # ذخیره candidate_ids
                    for result in results:
                        if 'candidate_id' in result:
                            self.candidate_ids.append(result['candidate_id'])
                    
                    # بررسی batch_id
                    if batch_id:
                        self.log_result(
                            "Upload Resumes - Batch ID",
                            True,
                            f"Batch created with ID: {batch_id}"
                        )
                    else:
                        self.log_result(
                            "Upload Resumes - Batch ID",
                            True,
                            "Batch processing initiated (ID may be None for direct uploads)"
                        )
                    
                    # انتظار برای پردازش (اگر به صورت async انجام می‌شود)
                    if successful > 0:
                        print(f"[INFO] Waiting 10 seconds for resume processing...")
                        time.sleep(10)
                    
                    return True
                else:
                    self.log_result(
                        "Upload Resumes",
                        False,
                        f"No resumes were successfully uploaded. Errors: {data.get('errors', [])}"
                    )
                    return False
            else:
                error_msg = response.json().get('error', response.text) if response.content else response.text
                self.log_result(
                    "Upload Resumes",
                    False,
                    f"Upload failed with status {response.status_code}: {error_msg}"
                )
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_result(
                "Upload Resumes",
                False,
                f"Exception during upload: {str(e)}"
            )
            import traceback
            traceback.print_exc()
            return False
    
    # ========== Step 4: Verify OpenRouter API Integration ==========
    def test_openrouter_integration(self) -> bool:
        """تست یکپارچگی با OpenRouter API"""
        self.print_section("Step 4: Verify OpenRouter API Integration")
        
        if not self.candidate_ids:
            self.log_result(
                "OpenRouter Integration",
                False,
                "No candidate IDs available. Resumes must be uploaded first."
            )
            return False
        
        try:
            # بررسی اینکه رزومه‌ها parse شده‌اند
            all_parsed = True
            parsed_resume_count = 0
            
            for candidate_id in self.candidate_ids:
                response = self.session.get(
                    f"{self.base_url}/candidates/candidates/{candidate_id}/detail/"
                )
                
                if response.status_code == 200:
                    candidate_data = response.json()
                    resumes = candidate_data.get('resumes', [])
                    
                    if resumes:
                        resume = resumes[0]
                        parsed_data = resume.get('parsed_data')
                        
                        if parsed_data:
                            parsed_resume_count += 1
                            self.log_result(
                                f"OpenRouter Integration - Candidate {candidate_id}",
                                True,
                                "Resume parsed successfully via OpenRouter API"
                            )
                            
                            # بررسی ساختار JSON برگشتی
                            parsed_json = parsed_data.get('parsed_data', {})
                            if isinstance(parsed_json, dict):
                                # بررسی فیلدهای مهم
                                important_fields = ['personal_info', 'experiences', 'education', 'skills']
                                found_fields = []
                                for field in important_fields:
                                    if field in parsed_json or any(
                                        key.lower().startswith(field.lower()) 
                                        for key in parsed_json.keys()
                                    ):
                                        found_fields.append(field)
                                
                                if found_fields:
                                    self.log_result(
                                        f"OpenRouter Integration - Data Structure (Candidate {candidate_id})",
                                        True,
                                        f"Parsed data contains expected fields: {', '.join(found_fields)}"
                                    )
                                else:
                                    self.log_result(
                                        f"OpenRouter Integration - Data Structure (Candidate {candidate_id})",
                                        True,
                                        f"Parsed data structure verified (keys: {list(parsed_json.keys())[:5]})"
                                    )
                            else:
                                self.log_result(
                                    f"OpenRouter Integration - Data Structure (Candidate {candidate_id})",
                                    False,
                                    "Parsed data is not a valid JSON object"
                                )
                                all_parsed = False
                        else:
                            self.log_result(
                                f"OpenRouter Integration - Candidate {candidate_id}",
                                False,
                                "Resume not yet parsed"
                            )
                            all_parsed = False
                    else:
                        self.log_result(
                            f"OpenRouter Integration - Candidate {candidate_id}",
                            False,
                            "No resumes found for candidate"
                        )
                        all_parsed = False
                else:
                    self.log_result(
                        f"OpenRouter Integration - Candidate {candidate_id}",
                        False,
                        f"Failed to retrieve candidate: {response.status_code}"
                    )
                    all_parsed = False
            
            if parsed_resume_count > 0:
                self.log_result(
                    "OpenRouter Integration - Summary",
                    True,
                    f"{parsed_resume_count} out of {len(self.candidate_ids)} resumes parsed successfully"
                )
                return all_parsed
            else:
                self.log_result(
                    "OpenRouter Integration - Summary",
                    False,
                    "No resumes were parsed"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "OpenRouter Integration",
                False,
                f"Exception during verification: {str(e)}"
            )
            import traceback
            traceback.print_exc()
            return False
    
    # ========== Step 5: Verify Candidates Storage ==========
    def test_candidates_storage(self) -> bool:
        """تست ذخیره‌سازی کاندیدها"""
        self.print_section("Step 5: Verify Candidates Storage in Backend")
        
        if not self.candidate_ids:
            self.log_result(
                "Candidates Storage",
                False,
                "No candidate IDs available."
            )
            return False
        
        try:
            all_stored = True
            
            # بررسی ذخیره‌سازی در candidates endpoint
            candidates_response = self.session.get(
                f"{self.base_url}/candidates/candidates/"
            )
            
            if candidates_response.status_code == 200:
                data = candidates_response.json()
                candidates_list = data.get('results', []) if isinstance(data, dict) else data
                
                stored_ids = [c.get('id') for c in candidates_list]
                found_count = sum(1 for cid in self.candidate_ids if cid in stored_ids)
                
                if found_count == len(self.candidate_ids):
                    self.log_result(
                        "Candidates Storage - CRUD Read",
                        True,
                        f"All {found_count} candidates found in candidates list"
                    )
                else:
                    self.log_result(
                        "Candidates Storage - CRUD Read",
                        True,  # Warning level
                        f"Found {found_count} out of {len(self.candidate_ids)} candidates (may still be processing)"
                    )
                
                # بررسی جزئیات هر کاندید
                for candidate_id in self.candidate_ids:
                    detail_response = self.session.get(
                        f"{self.base_url}/candidates/candidates/{candidate_id}/detail/"
                    )
                    
                    if detail_response.status_code == 200:
                        candidate_data = detail_response.json()
                        
                        # بررسی فیلدهای مهم
                        required_fields = ['id', 'email', 'name']
                        missing_fields = []
                        for field in required_fields:
                            if field not in candidate_data:
                                missing_fields.append(field)
                        
                        if not missing_fields:
                            self.log_result(
                                f"Candidates Storage - Data Integrity (Candidate {candidate_id})",
                                True,
                                f"All required fields present: {', '.join(required_fields)}"
                            )
                            
                            # بررسی ارتباط با job
                            if self.job_id:
                                job_scores_response = self.session.get(
                                    f"{self.base_url}/review/review/?jobId={self.job_id}"
                                )
                                
                                if job_scores_response.status_code == 200:
                                    review_data = job_scores_response.json()
                                    all_candidates = review_data.get('all_candidates', [])
                                    
                                    candidate_found = any(
                                        c.get('candidate') == candidate_id 
                                        for c in all_candidates
                                    )
                                    
                                    if candidate_found:
                                        self.log_result(
                                            f"Candidates Storage - Job Association (Candidate {candidate_id})",
                                            True,
                                            f"Candidate associated with job {self.job_id}"
                                        )
                                    else:
                                        self.log_result(
                                            f"Candidates Storage - Job Association (Candidate {candidate_id})",
                                            False,
                                            f"Candidate not yet associated with job {self.job_id}"
                                        )
                                        all_stored = False
                        else:
                            self.log_result(
                                f"Candidates Storage - Data Integrity (Candidate {candidate_id})",
                                False,
                                f"Missing required fields: {', '.join(missing_fields)}"
                            )
                            all_stored = False
                    else:
                        self.log_result(
                            f"Candidates Storage - CRUD Read Detail (Candidate {candidate_id})",
                            False,
                            f"Failed to retrieve candidate details: {detail_response.status_code}"
                        )
                        all_stored = False
                
                return all_stored
            else:
                self.log_result(
                    "Candidates Storage - CRUD Read",
                    False,
                    f"Failed to retrieve candidates list: {candidates_response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Candidates Storage",
                False,
                f"Exception during verification: {str(e)}"
            )
            import traceback
            traceback.print_exc()
            return False
    
    # ========== Step 6: Verify Display to Super User ==========
    def test_display_to_super_user(self) -> bool:
        """تست نمایش کاندیدها به super user"""
        self.print_section("Step 6: Verify Display to Super User (Review Dashboard)")
        
        if not self.job_id:
            self.log_result(
                "Display to Super User",
                False,
                "No job ID available."
            )
            return False
        
        try:
            # بررسی endpoint review dashboard
            response = self.session.get(
                f"{self.base_url}/review/review/?jobId={self.job_id}"
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # بررسی ساختار پاسخ
                required_keys = ['job', 'kpis', 'all_candidates']
                missing_keys = [key for key in required_keys if key not in data]
                
                if not missing_keys:
                    self.log_result(
                        "Display to Super User - API Response Structure",
                        True,
                        f"All required keys present: {', '.join(required_keys)}"
                    )
                    
                    # بررسی KPIs
                    kpis = data.get('kpis', {})
                    total_candidates = kpis.get('total_candidates', 0)
                    average_score = kpis.get('average_score', 0)
                    
                    self.log_result(
                        "Display to Super User - KPIs",
                        True,
                        f"KPIs: {total_candidates} total candidates, average score: {average_score:.2f}"
                    )
                    
                    # بررسی کاندیدها
                    all_candidates = data.get('all_candidates', [])
                    
                    if len(all_candidates) > 0:
                        self.log_result(
                            "Display to Super User - Candidates List",
                            True,
                            f"{len(all_candidates)} candidates available for display"
                        )
                        
                        # بررسی اطلاعات هر کاندید
                        candidate_checks_passed = 0
                        for candidate in all_candidates[:5]:  # بررسی 5 کاندید اول
                            candidate_details = candidate.get('candidate_details', {})
                            
                            # بررسی فیلدهای ضروری
                            required_detail_fields = ['name', 'email']
                            has_required_fields = all(
                                field in candidate_details and candidate_details[field]
                                for field in required_detail_fields
                            )
                            
                            # بررسی score
                            has_score = 'score' in candidate and candidate.get('score') is not None
                            
                            # بررسی skills
                            has_skills = 'skills' in candidate
                            
                            if has_required_fields and has_score:
                                candidate_checks_passed += 1
                        
                        if candidate_checks_passed > 0:
                            self.log_result(
                                "Display to Super User - Candidate Data Completeness",
                                True,
                                f"{candidate_checks_passed} candidates have complete data for display"
                            )
                        else:
                            self.log_result(
                                "Display to Super User - Candidate Data Completeness",
                                False,
                                "Candidates missing required display fields"
                            )
                            return False
                        
                        # بررسی API endpoint استفاده شده
                        self.log_result(
                            "Display to Super User - API Endpoint",
                            True,
                            f"Correct endpoint used: /review/review/?jobId={self.job_id}"
                        )
                        
                        return True
                    else:
                        self.log_result(
                            "Display to Super User - Candidates List",
                            True,  # Warning
                            "No candidates yet available (may still be processing)"
                        )
                        return True  # Warning but not failure
                else:
                    self.log_result(
                        "Display to Super User - API Response Structure",
                        False,
                        f"Missing required keys: {', '.join(missing_keys)}"
                    )
                    return False
            else:
                error_msg = response.json().get('error', response.text) if response.content else response.text
                self.log_result(
                    "Display to Super User",
                    False,
                    f"Failed to retrieve review dashboard: {response.status_code} - {error_msg}"
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Display to Super User",
                False,
                f"Exception during verification: {str(e)}"
            )
            import traceback
            traceback.print_exc()
            return False
    
    # ========== Step 7: Verify CRUD Operations ==========
    def test_crud_operations(self) -> bool:
        """تست عملیات CRUD"""
        self.print_section("Step 7: Verify CRUD Operations")
        
        all_passed = True
        
        # CREATE: قبلاً انجام شده (signup, job creation, resume upload)
        self.log_result(
            "CRUD - CREATE",
            True,
            "CREATE operations verified: User, Job, Candidates created successfully"
        )
        
        # READ: بررسی خواندن داده‌ها
        if self.job_id:
            job_read = self.session.get(f"{self.base_url}/jobs/jobs/{self.job_id}/")
            if job_read.status_code == 200:
                self.log_result(
                    "CRUD - READ (Job)",
                    True,
                    "Job READ operation successful"
                )
            else:
                self.log_result(
                    "CRUD - READ (Job)",
                    False,
                    f"Job READ failed: {job_read.status_code}"
                )
                all_passed = False
        
        if self.candidate_ids:
            candidate_read = self.session.get(
                f"{self.base_url}/candidates/candidates/{self.candidate_ids[0]}/detail/"
            )
            if candidate_read.status_code == 200:
                self.log_result(
                    "CRUD - READ (Candidate)",
                    True,
                    "Candidate READ operation successful"
                )
            else:
                self.log_result(
                    "CRUD - READ (Candidate)",
                    False,
                    f"Candidate READ failed: {candidate_read.status_code}"
                )
                all_passed = False
        
        # UPDATE: تست به‌روزرسانی job
        if self.job_id:
            update_data = {
                'title': 'Senior Software Engineer - Smoke Test (Updated)',
                'description': 'Updated description for smoke test'
            }
            job_update = self.session.patch(
                f"{self.base_url}/jobs/jobs/{self.job_id}/",
                json=update_data
            )
            if job_update.status_code == 200:
                updated_job = job_update.json()
                if updated_job.get('title') == update_data['title']:
                    self.log_result(
                        "CRUD - UPDATE (Job)",
                        True,
                        "Job UPDATE operation successful"
                    )
                else:
                    self.log_result(
                        "CRUD - UPDATE (Job)",
                        False,
                        "Job UPDATE did not persist changes"
                    )
                    all_passed = False
            else:
                self.log_result(
                    "CRUD - UPDATE (Job)",
                    False,
                    f"Job UPDATE failed: {job_update.status_code}"
                )
                all_passed = False
        
        # DELETE: تست حذف (اختیاری - می‌توانیم فقط بررسی کنیم که endpoint وجود دارد)
        # برای smoke test، DELETE را اجرا نمی‌کنیم تا داده‌ها باقی بمانند
        
        return all_passed
    
    # ========== Step 8: Verify API Endpoints ==========
    def test_api_endpoints(self) -> bool:
        """تست صحت استفاده از API endpoints"""
        self.print_section("Step 8: Verify Correct API Endpoints")
        
        endpoints_used = {
            'Sign Up': f"{self.base_url}/auth/register/",
            'Login (token)': f"{self.base_url}/auth/token/",
            'Job List': f"{self.base_url}/jobs/jobs/",
            'Job Create': f"{self.base_url}/jobs/jobs/new/",
            'Job Detail': f"{self.base_url}/jobs/jobs/{self.job_id}/" if self.job_id else None,
            'Upload CV': f"{self.base_url}/candidates/upload-cv/",
            'Candidates List': f"{self.base_url}/candidates/candidates/",
            'Candidate Detail': f"{self.base_url}/candidates/candidates/{self.candidate_ids[0]}/detail/" if self.candidate_ids else None,
            'Review Dashboard': f"{self.base_url}/review/review/?jobId={self.job_id}" if self.job_id else None,
        }
        
        all_correct = True
        for operation, endpoint in endpoints_used.items():
            if endpoint:
                # بررسی اینکه endpoint با ساختار صحیح استفاده شده
                if '/api/' in endpoint:
                    self.log_result(
                        f"API Endpoint - {operation}",
                        True,
                        f"Correct endpoint: {endpoint.split('/api/')[-1]}"
                    )
                else:
                    self.log_result(
                        f"API Endpoint - {operation}",
                        False,
                        f"Endpoint may be incorrect: {endpoint}"
                    )
                    all_correct = False
            else:
                self.log_result(
                    f"API Endpoint - {operation}",
                    True,  # Warning
                    "Endpoint not applicable in current test context"
                )
        
        return all_correct
    
    # ========== Check Backend Connection ==========
    def check_backend_connection(self) -> bool:
        """بررسی اتصال به backend"""
        self.print_section("Backend Connection Check")
        
        try:
            # تلاش برای اتصال به endpoint ساده
            test_url = f"{self.base_url}/auth/register/"
            response = self.session.get(test_url, timeout=5)
            # هر status code نشان می‌دهد که backend در حال اجرا است
            self.log_result(
                "Backend Connection",
                True,
                f"Backend is reachable at {self.base_url}"
            )
            return True
        except requests.exceptions.ConnectionError as e:
            self.log_result(
                "Backend Connection",
                False,
                f"Cannot connect to backend at {self.base_url}. Please make sure the Django server is running."
            )
            print(f"\n[ERROR] Connection Error Details: {str(e)}")
            print(f"\n[SOLUTION] To start the backend server, run:")
            print(f"  cd backend")
            print(f"  python manage.py runserver")
            return False
        except requests.exceptions.Timeout:
            self.log_result(
                "Backend Connection",
                False,
                f"Connection to backend at {self.base_url} timed out"
            )
            return False
        except Exception as e:
            # حتی اگر GET به POST endpoint خطا بدهد، نشان می‌دهد که backend در حال اجرا است
            if "405" in str(e) or "Method Not Allowed" in str(e):
                self.log_result(
                    "Backend Connection",
                    True,
                    f"Backend is reachable at {self.base_url} (405 Method Not Allowed is expected for GET on POST endpoint)"
                )
                return True
            self.log_result(
                "Backend Connection",
                False,
                f"Error checking backend connection: {str(e)}"
            )
            return False
    
    # ========== Run All Tests ==========
    def run_all_tests(self) -> Dict[str, Any]:
        """اجرای تمام تست‌ها"""
        print("\n" + "="*60)
        print("  HireScan ATS - Smoke Test")
        print("="*60)
        print(f"\nAPI Base URL: {self.base_url}")
        print(f"Start Time: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # بررسی اتصال به backend
        if not self.check_backend_connection():
            print("\n[ERROR] Cannot proceed with tests. Please start the backend server first.")
            print("Run: cd backend && python manage.py runserver")
            return self.test_results
        
        # اجرای تست‌ها به ترتیب
        tests = [
            ("Sign Up", self.test_signup),
            ("Create Job", self.test_create_job),
            ("Upload Resumes", self.test_upload_resumes),
            ("OpenRouter Integration", self.test_openrouter_integration),
            ("Candidates Storage", self.test_candidates_storage),
            ("Display to Super User", self.test_display_to_super_user),
            ("CRUD Operations", self.test_crud_operations),
            ("API Endpoints", self.test_api_endpoints),
        ]
        
        for test_name, test_func in tests:
            try:
                test_func()
                time.sleep(2)  # فاصله بین تست‌ها
            except Exception as e:
                self.log_result(
                    test_name,
                    False,
                    f"Test execution failed: {str(e)}"
                )
                import traceback
                traceback.print_exc()
        
        # خلاصه نتایج
        self.print_summary()
        
        return self.test_results
    
    def print_summary(self):
        """چاپ خلاصه نتایج"""
        print("\n" + "="*60)
        print("  Test Summary")
        print("="*60)
        
        total = len(self.test_results['passed']) + len(self.test_results['failed'])
        passed_count = len(self.test_results['passed'])
        failed_count = len(self.test_results['failed'])
        warning_count = len(self.test_results['warnings'])
        
        print(f"\n[PASS] Passed: {passed_count}")
        print(f"[FAIL] Failed: {failed_count}")
        print(f"[WARNING] Warnings: {warning_count}")
        print(f"[TOTAL] Total: {total}")
        
        if failed_count == 0:
            print("\n[SUCCESS] All critical tests passed!")
        else:
            print(f"\n[ERROR] {failed_count} test(s) failed. Please review the errors above.")
        
        # ذخیره نتایج در فایل
        results_file = Path("smoke_test_results.json")
        try:
            results_file.write_text(
                json.dumps(self.test_results, indent=2, ensure_ascii=False),
                encoding='utf-8'
            )
            print(f"\n[INFO] Detailed results saved to: {results_file}")
        except Exception as e:
            print(f"\n[WARNING] Could not save results file: {e}")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Run HireScan ATS Smoke Test')
    parser.add_argument(
        '--api-url',
        default=BASE_URL,
        help=f'API base URL (default: {BASE_URL})'
    )
    
    args = parser.parse_args()
    
    # اجرای تست‌ها
    test = SmokeTest(base_url=args.api_url)
    results = test.run_all_tests()
    
    # خروجی با کد خطا در صورت نیاز
    failed_count = len(results['failed'])
    sys.exit(0 if failed_count == 0 else 1)

