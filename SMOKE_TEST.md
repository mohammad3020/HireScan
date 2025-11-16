# Smoke Test برای HireScan ATS

این smoke test تمام روند کار را از ثبت‌نام تا نمایش کاندیدها بررسی می‌کند.

## روند تست شده

این تست تمام مراحل زیر را بررسی می‌کند:

1. ✅ **Sign Up**: کاربر می‌تواند ثبت‌نام کند
2. ✅ **Create Job**: کاربر می‌تواند یک job بسازد و job به درستی و کامل در backend ذخیره می‌شود
3. ✅ **Upload Resumes**: کاربر می‌تواند چندین رزومه را با هم آپلود کند
4. ✅ **OpenRouter Integration**: رزومه‌ها آپلود می‌شوند و به OpenRouter API ارسال می‌شوند و JSON response در بخش candidates ذخیره می‌شود
5. ✅ **Display to Super User**: کاندیدها به super user به صورت درست و کامل نمایش داده می‌شوند
6. ✅ **API Endpoints**: از API های درست در مراحل انتقال اطلاعات بین frontend و backend استفاده شده است
7. ✅ **CRUD Operations**: تمام عملیات CRUD در جای درست خودش اتفاق می‌افتد

## نحوه اجرا

### پیش‌نیازها

1. مطمئن شوید که backend Django در حال اجرا است:
```bash
cd backend
python manage.py runserver
```

2. نصب dependencies (در صورت نیاز):
```bash
pip install requests
```

3. تنظیمات OpenRouter API (در فایل `.env` یا متغیرهای محیطی):
```
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_PARSE_MODEL=your_model_here
```

### اجرای تست

```bash
python smoke_test.py
```

### اجرا با URL سفارشی

```bash
python smoke_test.py --api-url http://localhost:8000/api
```

## خروجی تست

تست نتایج زیر را تولید می‌کند:

1. **Console Output**: نتایج تست‌ها به صورت real-time در کنسول نمایش داده می‌شوند
2. **JSON Report**: فایل `smoke_test_results.json` با جزئیات کامل نتایج

## بررسی‌های انجام شده

### 1. Sign Up
- ✅ کاربر می‌تواند ثبت‌نام کند
- ✅ Token دریافت می‌شود
- ✅ کاربر در backend ذخیره می‌شود

### 2. Create Job
- ✅ Job ایجاد می‌شود
- ✅ تمام فیلدها به درستی ذخیره می‌شوند
- ✅ Job به کاربر مرتبط می‌شود

### 3. Upload Resumes
- ✅ چندین رزومه به صورت batch آپلود می‌شوند
- ✅ Batch ایجاد می‌شود
- ✅ فایل‌ها به backend ارسال می‌شوند

### 4. OpenRouter Integration
- ✅ رزومه‌ها به OpenRouter API ارسال می‌شوند
- ✅ JSON response دریافت می‌شود
- ✅ داده‌های parse شده در database ذخیره می‌شوند

### 5. Candidates Storage
- ✅ کاندیدها در بخش candidates ذخیره می‌شوند
- ✅ رزومه‌ها به کاندیدها مرتبط می‌شوند
- ✅ Parsed data به درستی ذخیره می‌شود

### 6. Display to Super User
- ✅ Review Dashboard در دسترس است
- ✅ کاندیدها با تمام اطلاعات نمایش داده می‌شوند
- ✅ KPIs به درستی محاسبه می‌شوند

### 7. API Endpoints
- ✅ از endpoints صحیح استفاده شده:
  - `/api/auth/register/` برای signup
  - `/api/jobs/jobs/new/` برای ایجاد job
  - `/api/candidates/upload-cv/` برای آپلود رزومه
  - `/api/review/review/?jobId={id}` برای نمایش کاندیدها

### 8. CRUD Operations
- ✅ **CREATE**: User, Job, Candidates ایجاد می‌شوند
- ✅ **READ**: Job, Candidates, Review Dashboard خوانده می‌شوند
- ✅ **UPDATE**: Job به‌روزرسانی می‌شود
- ✅ **DELETE**: برای smoke test انجام نمی‌شود (تا داده‌ها باقی بمانند)

## نمونه خروجی

```
============================================================
  HireScan ATS - Smoke Test
============================================================

API Base URL: http://localhost:8000/api
Start Time: 2024-01-15 10:30:00

============================================================
  Step 1: User Sign Up
============================================================

✅ PASS: Sign Up - User created successfully. Email: test_user_1234567890@smoketest.com
✅ PASS: Sign Up - User Data Verification - User data correctly returned from backend

============================================================
  Step 2: Create Job
============================================================

✅ PASS: Create Job - Job created successfully with ID: 1
✅ PASS: Create Job - Field Verification (title) - title correctly stored: Senior Software Engineer - Smoke Test
✅ PASS: Create Job - Created By Verification - Job correctly associated with user

============================================================
  Step 3: Upload Multiple Resumes
============================================================

✅ PASS: Upload Resumes - Successfully uploaded 3 out of 3 resumes
✅ PASS: Upload Resumes - Batch ID - Batch created with ID: 1

============================================================
  Step 4: Verify OpenRouter API Integration
============================================================

✅ PASS: OpenRouter Integration - Candidate 1 - Resume parsed successfully via OpenRouter API
✅ PASS: OpenRouter Integration - Data Structure (Candidate 1) - Parsed data contains expected fields: personal_info, experiences, education, skills

============================================================
  Step 5: Verify Candidates Storage in Backend
============================================================

✅ PASS: Candidates Storage - CRUD Read - All 3 candidates found in candidates list
✅ PASS: Candidates Storage - Job Association (Candidate 1) - Candidate associated with job 1

============================================================
  Step 6: Verify Display to Super User (Review Dashboard)
============================================================

✅ PASS: Display to Super User - API Response Structure - All required keys present: job, kpis, all_candidates
✅ PASS: Display to Super User - Candidates List - 3 candidates available for display
✅ PASS: Display to Super User - Candidate Data Completeness - 3 candidates have complete data for display

============================================================
  Step 7: Verify CRUD Operations
============================================================

✅ PASS: CRUD - CREATE - CREATE operations verified: User, Job, Candidates created successfully
✅ PASS: CRUD - READ (Job) - Job READ operation successful
✅ PASS: CRUD - UPDATE (Job) - Job UPDATE operation successful

============================================================
  Step 8: Verify Correct API Endpoints
============================================================

✅ PASS: API Endpoint - Sign Up - Correct endpoint: auth/register/
✅ PASS: API Endpoint - Job Create - Correct endpoint: jobs/jobs/new/
✅ PASS: API Endpoint - Upload CV - Correct endpoint: candidates/upload-cv/

============================================================
  Test Summary
============================================================

✅ Passed: 25
❌ Failed: 0
⚠️  Warnings: 2
📊 Total: 27

🎉 All critical tests passed!

📄 Detailed results saved to: smoke_test_results.json
```

## عیب‌یابی

### مشکل: Sign Up failed
**راه حل:**
- مطمئن شوید که backend در حال اجرا است
- بررسی کنید که database به درستی تنظیم شده باشد

### مشکل: Job creation failed
**راه حل:**
- بررسی کنید که token معتبر است
- بررسی کنید که department وجود دارد (یا department_id را null بگذارید)

### مشکل: Resume upload failed
**راه حل:**
- بررسی کنید که OpenRouter API key تنظیم شده باشد
- بررسی کنید که job ID معتبر است

### مشکل: OpenRouter Integration failed
**راه حل:**
- بررسی کنید که API key معتبر است
- بررسی کنید که model صحیح تنظیم شده باشد
- بررسی لاگ‌های backend برای جزئیات بیشتر

## پاکسازی داده‌های تست

بعد از اجرای تست، می‌توانید داده‌های تستی را پاک کنید:

```bash
cd backend
python manage.py shell
```

```python
from core.models import User
from jobs.models import Job
from candidates.models import Candidate

# حذف کاربران تستی
User.objects.filter(email__startswith='test_user_').delete()

# حذف job های تستی
Job.objects.filter(title__contains='Smoke Test').delete()

# حذف کاندیدهای تستی
Candidate.objects.filter(email__contains='example.com').delete()
```

## نکات مهم

1. **پردازش Async**: رزومه‌ها ممکن است به صورت async پردازش شوند. تست 10 ثانیه صبر می‌کند اما ممکن است نیاز به زمان بیشتری باشد.

2. **Rate Limiting**: OpenRouter ممکن است rate limit داشته باشد. اگر چندین تست را متوالی اجرا می‌کنید، بین آنها فاصله بگذارید.

3. **Database**: تست داده‌های تستی ایجاد می‌کند. بعد از تست، می‌توانید آنها را پاک کنید.

## جزئیات بیشتر

برای جزئیات بیشتر در مورد نحوه اجرا و عیب‌یابی، به فایل `SMOKE_TEST_GUIDE.md` مراجعه کنید.
