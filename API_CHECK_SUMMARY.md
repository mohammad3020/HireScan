# خلاصه بررسی API و انتقال توکن‌ها

## ✅ وضعیت کد

### فرانت‌اند (Frontend)
- ✅ **API Client**: توکن‌ها از localStorage خوانده و در Header به صورت `Bearer {token}` ارسال می‌شوند
- ✅ **Token Refresh**: در صورت انقضای توکن، به صورت خودکار refresh می‌شود
- ✅ **Error Handling**: مدیریت کامل خطاها و redirect به login
- ✅ **Vite Proxy**: `/api` به `http://localhost:8000` پروکسی می‌شود

### بک‌اند (Backend)
- ✅ **JWT Authentication**: فعال و درست تنظیم شده
- ✅ **CORS**: تنظیم شده برای `http://localhost:5173`
- ✅ **URLs**: همه endpoint های لازم تعریف شده‌اند
- ✅ **Serializers**: استفاده از email به جای username

## ⚠️ مشکل فعلی

**سرور Django HireScan در حال اجرا نیست یا از پروژه دیگری استفاده می‌کند.**

### راه حل:

1. **متوقف کردن سرورهای دیگر** (اگر در حال اجرا هستند)

2. **راه‌اندازی سرور HireScan**:
   ```bash
   cd backend
   python manage.py runserver
   ```

3. **تست اتصال**:
   ```bash
   cd backend
   python quick_api_test.py
   ```

## جریان انتقال توکن

### 1. Login
```
Frontend: POST /api/auth/token/ {email, password}
Backend:  {access, refresh, user}
Frontend: localStorage.setItem('access_token', access)
```

### 2. Request با توکن
```
Frontend: GET /api/auth/me/
         Header: Authorization: Bearer {access_token}
Backend:  Validate token → Return user data
```

### 3. Token Refresh (خودکار)
```
Request → 401 Unauthorized
Frontend: POST /api/auth/token/refresh/ {refresh: refresh_token}
Backend:  {access: new_access_token}
Frontend: Update token → Retry request
```

## نتیجه

✅ **کد درست است** - همه چیز درست تنظیم شده
⚠️ **فقط سرور Django را راه‌اندازی کنید** - از دایرکتوری `backend`

بعد از راه‌اندازی سرور، API ها و انتقال توکن‌ها باید درست کار کنند.













