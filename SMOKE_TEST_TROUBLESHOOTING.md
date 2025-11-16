# راهنمای عیب‌یابی Smoke Test - Sign Up

## مشکل: بخش Sign Up کار نمی‌کند

### علت رایج: Backend در حال اجرا نیست

اگر پیام خطای زیر را می‌بینید:
```
[FAIL] Sign Up - Exception during signup: HTTPConnectionPool(host='localhost', port=8000): Max retries exceeded...
```

این به این معنی است که **backend Django در حال اجرا نیست**.

## راه حل

### مرحله 1: راه‌اندازی Backend

1. ترمینال جدید باز کنید
2. به پوشه backend بروید:
```bash
cd backend
```

3. سرور Django را اجرا کنید:
```bash
python manage.py runserver
```

4. باید پیامی شبیه به این ببینید:
```
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

### مرحله 2: اجرای تست

پس از راه‌اندازی backend، در یک ترمینال دیگر تست را اجرا کنید:

```bash
python smoke_test.py --api-url http://localhost:8000/api
```

## بررسی مشکلات دیگر

### مشکل 1: پورت 8000 در حال استفاده است

اگر خطای زیر را می‌بینید:
```
Error: That port is already in use.
```

**راه حل:**
1. ببینید چه پروسه‌ای از پورت استفاده می‌کند:
```bash
netstat -ano | findstr :8000
```

2. یا از پورت دیگری استفاده کنید:
```bash
python manage.py runserver 8001
```

3. و در تست URL را تغییر دهید:
```bash
python smoke_test.py --api-url http://localhost:8001/api
```

### مشکل 2: Database Migrations انجام نشده

اگر خطای زیر را می‌بینید:
```
django.db.utils.OperationalError: no such table: ...
```

**راه حل:**
```bash
cd backend
python manage.py migrate
```

### مشکل 3: Environment Variables تنظیم نشده

اگر خطای مربوط به OpenRouter API می‌بینید:

**راه حل:**
1. فایل `.env` را در پوشه `backend` ایجاد کنید:
```env
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_PARSE_MODEL=your_model_here
```

2. یا export کنید (Linux/Mac):
```bash
export OPENROUTER_API_KEY=your_api_key_here
export OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
export OPENROUTER_PARSE_MODEL=your_model_here
```

### مشکل 4: CORS Error

اگر خطای CORS می‌بینید:

**راه حل:**
فایل `backend/hirescan/settings.py` را بررسی کنید و مطمئن شوید که:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# یا در development:
CORS_ALLOW_ALL_ORIGINS = True  # فقط برای development
```

### مشکل 5: Email تکراری

اگر خطای زیر را می‌بینید:
```
[FAIL] Sign Up - Signup failed with status 400: {'email': ['user with this email already exists.']}
```

**راه حل:**
این طبیعی است اگر قبلاً تست را اجرا کرده‌اید. تست خودکار یک ایمیل یکتا برای هر اجرا ایجاد می‌کند، اما اگر چند بار پشت سر هم اجرا کنید ممکن است این خطا رخ دهد.

برای پاک کردن کاربران تستی:
```bash
cd backend
python manage.py shell
```

```python
from core.models import User
User.objects.filter(email__startswith='test_user_').delete()
```

## بررسی دستی Sign Up

اگر می‌خواهید دستی تست کنید:

### با curl:
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "password2": "TestPassword123!",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### با Python:
```python
import requests

response = requests.post(
    'http://localhost:8000/api/auth/register/',
    json={
        'email': 'test@example.com',
        'password': 'TestPassword123!',
        'password2': 'TestPassword123!',
        'first_name': 'Test',
        'last_name': 'User'
    }
)

print(response.status_code)
print(response.json())
```

## بررسی لاگ‌های Backend

برای دیدن لاگ‌های دقیق‌تر، مطمئن شوید که DEBUG=True در settings.py است:

```python
DEBUG = True
```

و در console سرور Django، خطاهای کامل را خواهید دید.

## چک لیست پیش از اجرای تست

قبل از اجرای smoke test، مطمئن شوید:

- [ ] Backend Django در حال اجرا است (`python manage.py runserver`)
- [ ] Database migrations انجام شده (`python manage.py migrate`)
- [ ] Port 8000 آزاد است
- [ ] Environment variables تنظیم شده (برای OpenRouter)
- [ ] CORS settings صحیح است
- [ ] Dependencies نصب شده (`pip install -r requirements.txt`)

## دریافت کمک بیشتر

اگر مشکل همچنان وجود دارد:

1. لاگ‌های backend را بررسی کنید
2. فایل `smoke_test_results.json` را بررسی کنید
3. کد پاسخ HTTP را بررسی کنید (مثلاً 400, 500, etc.)
4. مطمئن شوید که همه requirements نصب شده‌اند

