# گزارش بررسی اتصال API و انتقال توکن‌ها

## خلاصه وضعیت

### ✅ تنظیمات فرانت‌اند (Frontend)

#### 1. API Client (`frontend/src/api/client.ts`)
- ✅ **توکن از localStorage خوانده می‌شود**: `localStorage.getItem('access_token')`
- ✅ **توکن در Header ارسال می‌شود**: `Authorization: Bearer ${token}`
- ✅ **Token Refresh Mechanism**: در صورت 401، توکن به صورت خودکار refresh می‌شود
- ✅ **Error Handling**: مدیریت خطاهای شبکه و timeout
- ✅ **FormData Support**: پشتیبانی از آپلود فایل

```typescript
// کد ارسال توکن:
config.headers.Authorization = `Bearer ${token}`;
```

#### 2. Vite Proxy Configuration (`frontend/vite.config.ts`)
- ✅ **Proxy تنظیم شده**: `/api` به `http://localhost:8000` پروکسی می‌شود
- ✅ **Port**: Frontend روی پورت 5173 اجرا می‌شود

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  },
}
```

#### 3. Auth Store (`frontend/src/store/auth.ts`)
- ✅ **ذخیره توکن‌ها**: `access_token` و `refresh_token` در localStorage ذخیره می‌شوند
- ✅ **Login Flow**: بعد از لاگین، توکن‌ها ذخیره می‌شوند
- ✅ **Check Auth**: بررسی اعتبار توکن با `/api/auth/me/`

### ✅ تنظیمات بک‌اند (Backend)

#### 1. REST Framework Settings (`backend/hirescan/settings.py`)
- ✅ **JWT Authentication فعال**: `rest_framework_simplejwt.authentication.JWTAuthentication`
- ✅ **Permission Classes**: `IsAuthenticated` به صورت پیش‌فرض
- ✅ **Token Lifetime**: 
  - Access Token: 1 ساعت
  - Refresh Token: 7 روز

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

#### 2. CORS Settings
- ✅ **CORS فعال**: `corsheaders` نصب و تنظیم شده
- ✅ **Allowed Origins**: `http://localhost:5173` (پیش‌فرض)
- ✅ **Credentials**: `CORS_ALLOW_CREDENTIALS = True`

```python
CORS_ALLOWED_ORIGINS = os.getenv('DJANGO_CORS_ORIGINS', 'http://localhost:5173').split(',')
CORS_ALLOW_CREDENTIALS = True
```

#### 3. URL Configuration (`backend/hirescan/urls.py`)
- ✅ **Auth Endpoints**: `/api/auth/` شامل:
  - `/api/auth/token/` - دریافت توکن (Login)
  - `/api/auth/token/refresh/` - Refresh توکن
  - `/api/auth/token/verify/` - بررسی اعتبار توکن
  - `/api/auth/register/` - ثبت‌نام
  - `/api/auth/me/` - اطلاعات کاربر فعلی
  - `/api/auth/dashboard/` - داشبورد

### ⚠️ مشکلات احتمالی

#### 1. سرور Django
- ⚠️ **مشکل**: ممکن است سرور Django از پروژه دیگری در حال اجرا باشد
- ✅ **راه حل**: مطمئن شوید که سرور HireScan در حال اجرا است:
  ```bash
  cd backend
  python manage.py runserver
  ```

#### 2. Environment Variables
- ⚠️ **بررسی**: مطمئن شوید که `VITE_API_BASE_URL` در `.env` تنظیم نشده (یا به `/api` تنظیم شده)
- ✅ **پیش‌فرض**: اگر تنظیم نشده باشد، از `/api` استفاده می‌شود که درست است

#### 3. CORS
- ⚠️ **بررسی**: اگر از پورت دیگری استفاده می‌کنید، باید در `CORS_ALLOWED_ORIGINS` اضافه شود

## تست اتصال

برای تست اتصال API، از اسکریپت زیر استفاده کنید:

```bash
cd backend
python test_api_connection.py
```

این اسکریپت موارد زیر را بررسی می‌کند:
1. ✅ آیا سرور Django در حال اجرا است
2. ✅ آیا Login endpoint کار می‌کند
3. ✅ آیا توکن درست دریافت می‌شود
4. ✅ آیا Authenticated requests کار می‌کنند
5. ✅ آیا Token refresh کار می‌کند
6. ✅ آیا Security (rejecting invalid tokens) کار می‌کند

## جریان کامل Authentication

### 1. Login Flow
```
Frontend → POST /api/auth/token/ {email, password}
         ← {access, refresh, user}
Frontend → localStorage.setItem('access_token', access)
Frontend → localStorage.setItem('refresh_token', refresh)
```

### 2. Authenticated Request Flow
```
Frontend → GET /api/auth/me/
         → Header: Authorization: Bearer {access_token}
Backend  → Validate Token
         ← {email, first_name, last_name}
```

### 3. Token Refresh Flow
```
Frontend → GET /api/... (with expired token)
Backend  → 401 Unauthorized
Frontend → POST /api/auth/token/refresh/ {refresh: refresh_token}
Backend  → {access: new_access_token}
Frontend → Update localStorage
Frontend → Retry original request with new token
```

## توصیه‌ها

1. ✅ **همه چیز درست تنظیم شده است** - کد فرانت‌اند و بک‌اند درست است
2. ⚠️ **مطمئن شوید سرور Django در حال اجرا است** - از پروژه HireScan
3. ✅ **Token transmission درست کار می‌کند** - توکن‌ها در Header به صورت `Bearer {token}` ارسال می‌شوند
4. ✅ **Error handling کامل است** - شامل refresh token و redirect به login

## نتیجه‌گیری

✅ **API ها درست تنظیم شده‌اند**
✅ **توکن‌ها از فرانت‌اند به بک‌اند درست منتقل می‌شوند**
⚠️ **فقط مطمئن شوید که سرور Django HireScan در حال اجرا است**










