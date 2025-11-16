# راهنمای تغییر نسخه Python برای Django

## مشکل
شما از Python 3.14.0 استفاده می‌کنید، اما Django 4.2 از Python 3.10 تا 3.13 پشتیبانی می‌کند. این باعث خطای `'super' object has no attribute 'dicts'` در Django admin می‌شود.

## راه‌حل: نصب Python 3.13 یا 3.12

### مرحله 1: دانلود و نصب Python 3.13

1. به سایت https://www.python.org/downloads/ بروید
2. Python 3.13.x (آخرین نسخه) را دانلود کنید
3. نصب کنید و حتماً گزینه "Add Python to PATH" را انتخاب کنید

### مرحله 2: ساخت Virtual Environment جدید

در PowerShell یا Command Prompt:

```powershell
# رفتن به پوشه پروژه
cd "C:\Users\Amirali\Desktop\ATS RAHNEMA\HireScan\backend"

# حذف virtual environment قدیمی (اختیاری)
Remove-Item -Recurse -Force venv -ErrorAction SilentlyContinue

# ساخت virtual environment جدید با Python 3.13
python3.13 -m venv venv
# یا اگر python3.13 در PATH نیست:
py -3.13 -m venv venv
```

### مرحله 3: فعال‌سازی Virtual Environment

```powershell
# Windows PowerShell
.\venv\Scripts\Activate.ps1

# یا Windows Command Prompt
venv\Scripts\activate.bat
```

### مرحله 4: نصب Dependencies

```powershell
# ارتقای pip
python -m pip install --upgrade pip

# نصب dependencies
pip install -r requirements.txt
```

### مرحله 5: بررسی نسخه Python

```powershell
python --version
# باید Python 3.13.x را نشان دهد
```

### مرحله 6: تست Django Admin

```powershell
python manage.py runserver
```

حالا باید Django admin بدون خطا کار کند!

## نکات مهم

- اگر `python3.13` کار نکرد، از `py -3.13` استفاده کنید
- اگر virtual environment را حذف کردید، باید دوباره dependencies را نصب کنید
- بعد از تغییر Python، ممکن است نیاز به rebuild کردن database نباشد، اما اگر مشکلی داشتید:
  ```powershell
  python manage.py migrate
  ```

## اگر نمی‌توانید Python را تغییر دهید

کد `UserAdmin` را اصلاح کردم تا با Python 3.14 سازگارتر باشد. اما توصیه می‌شود که Python 3.13 را نصب کنید برای سازگاری کامل با Django 4.2.

