# راهنمای اجرای Smoke Test برای HireScan ATS

این سند نحوه اجرای smoke test کامل برای سیستم HireScan را توضیح می‌دهد.

## مراحل تست شده

این smoke test تمام روند زیر را بررسی می‌کند:

1. **Sign Up**: ثبت‌نام کاربر جدید
2. **Create Job**: ایجاد یک job و ذخیره کامل آن در backend
3. **Upload Resumes**: آپلود چندین رزومه برای job
4. **OpenRouter Integration**: پردازش رزومه‌ها با OpenRouter API و ذخیره JSON response
5. **Candidates Storage**: ذخیره کاندیدها در بخش candidates
6. **Display to Super User**: نمایش کاندیدها به super user در Review Dashboard
7. **CRUD Operations**: بررسی عملیات CRUD در جای درست
8. **API Endpoints**: بررسی استفاده از API endpoints صحیح

## پیش‌نیازها

### 1. نصب dependencies

```bash
pip install requests
```

### 2. راه‌اندازی Backend

مطمئن شوید که backend Django در حال اجرا است:

```bash
cd backend
python manage.py runserver
```

### 3. راه‌اندازی Frontend (اختیاری)

برای تست کامل، frontend هم باید در حال اجرا باشد:

```bash
cd frontend
npm run dev
```

### 4. تنظیمات OpenRouter API

مطمئن شوید که متغیرهای محیطی OpenRouter تنظیم شده‌اند:

```bash
export OPENROUTER_API_KEY=your_api_key_here
export OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
export OPENROUTER_PARSE_MODEL=your_model_here
```

یا در فایل `.env` در پوشه `backend`:

```
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_PARSE_MODEL=your_model_here
```

## اجرای تست

### اجرای ساده

```bash
python smoke_test.py
```

### اجرا با URL سفارشی

```bash
python smoke_test.py --api-url http://localhost:8000/api
```

### اجرا در محیط production

```bash
python smoke_test.py --api-url https://your-production-api.com/api
```

## خروجی تست

تست نتایج زیر را تولید می‌کند:

1. **Console Output**: نتایج تست‌ها به صورت real-time در کنسول نمایش داده می‌شوند
2. **JSON Report**: فایل `smoke_test_results.json` با جزئیات کامل نتایج

### نمونه خروجی Console

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
...

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

## تفسیر نتایج

### ✅ Passed Tests
تست‌هایی که با موفقیت گذرانده شده‌اند. این تست‌ها نشان می‌دهند که:
- API endpoint صحیح صدا زده شده
- داده‌ها به درستی ذخیره شده‌اند
- عملیات CRUD درست کار می‌کند

### ❌ Failed Tests
تست‌هایی که ناموفق بوده‌اند. در صورت وجود، باید:
1. خطاها را در console بررسی کنید
2. لاگ‌های backend را بررسی کنید
3. تنظیمات OpenRouter API را بررسی کنید
4. اتصال به database را بررسی کنید

### ⚠️ Warnings
هشدارهایی که نیاز به توجه دارند اما مانع اجرای سیستم نمی‌شوند:
- داده‌هایی که هنوز در حال پردازش هستند
- endpoint هایی که در context تست فعلی استفاده نمی‌شوند

## بررسی API Endpoints

تست استفاده از API endpoints زیر را بررسی می‌کند:

### Authentication
- `POST /api/auth/register/` - ثبت‌نام
- `POST /api/auth/token/` - دریافت token

### Jobs
- `GET /api/jobs/jobs/` - لیست job ها
- `POST /api/jobs/jobs/new/` - ایجاد job جدید
- `GET /api/jobs/jobs/{id}/` - جزئیات job
- `PATCH /api/jobs/jobs/{id}/` - به‌روزرسانی job

### Candidates
- `POST /api/candidates/upload-cv/` - آپلود رزومه
- `GET /api/candidates/candidates/` - لیست کاندیدها
- `GET /api/candidates/candidates/{id}/detail/` - جزئیات کاندید

### Review
- `GET /api/review/review/?jobId={id}` - Review dashboard

## بررسی CRUD Operations

### CREATE ✅
- ایجاد User (signup)
- ایجاد Job
- ایجاد Candidates (از طریق upload resume)

### READ ✅
- خواندن Job details
- خواندن Candidate details
- خواندن Review dashboard

### UPDATE ✅
- به‌روزرسانی Job

### DELETE ⏸️
- برای smoke test، DELETE انجام نمی‌شود تا داده‌ها باقی بمانند

## عیب‌یابی

### مشکل: Sign Up failed
**علت احتمالی:**
- Backend در حال اجرا نیست
- Database مشکل دارد
- Email تکراری است

**راه حل:**
```bash
# بررسی اجرای backend
curl http://localhost:8000/api/auth/register/

# بررسی database
cd backend
python manage.py shell
from core.models import User
User.objects.all()
```

### مشکل: Job creation failed
**علت احتمالی:**
- Token منقضی شده
- داده‌های نامعتبر ارسال شده
- Department وجود ندارد

**راه حل:**
- بررسی token در headers
- بررسی لاگ‌های backend
- ایجاد department در admin panel

### مشکل: Resume upload failed
**علت احتمالی:**
- فایل نامعتبر
- OpenRouter API مشکل دارد
- Job ID موجود نیست

**راه حل:**
- بررسی لاگ‌های backend
- بررسی تنظیمات OpenRouter
- اطمینان از وجود job قبل از upload

### مشکل: OpenRouter Integration failed
**علت احتمالی:**
- API key نامعتبر
- Rate limit
- Model نامعتبر

**راه حل:**
- بررسی API key در settings
- بررسی response از OpenRouter
- بررسی لاگ‌های `backend/processing/services.py`

### مشکل: Candidates not displayed
**علت احتمالی:**
- JobScore ایجاد نشده
- Ranking انجام نشده
- Job ID نامعتبر

**راه حل:**
```bash
cd backend
python manage.py shell
from candidates.models import Candidate, JobScore
from jobs.models import Job

# بررسی candidates
Candidate.objects.all()

# بررسی job scores
JobScore.objects.all()
```

## نکات مهم

1. **پردازش Async**: رزومه‌ها ممکن است به صورت async پردازش شوند. تست 10 ثانیه صبر می‌کند اما ممکن است نیاز به زمان بیشتری باشد.

2. **Rate Limiting**: OpenRouter ممکن است rate limit داشته باشد. اگر چندین تست را متوالی اجرا می‌کنید، بین آنها فاصله بگذارید.

3. **Database Cleanup**: تست‌ها داده‌های تستی ایجاد می‌کنند. می‌توانید آنها را بعداً پاک کنید:

```bash
cd backend
python manage.py shell
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

## بهبود تست

برای بهبود تست‌ها، می‌توانید:

1. **افزودن تست‌های بیشتر**: تست‌های edge cases و error handling
2. **Performance Testing**: اندازه‌گیری زمان پاسخ API ها
3. **Load Testing**: تست با تعداد زیاد رزومه
4. **Integration Tests**: تست کامل frontend + backend

## پشتیبانی

در صورت بروز مشکل، بررسی کنید:
- لاگ‌های backend در `backend/`
- لاگ‌های frontend در browser console
- لاگ‌های OpenRouter API
- فایل `smoke_test_results.json` برای جزئیات بیشتر

