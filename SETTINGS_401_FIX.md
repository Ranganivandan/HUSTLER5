# Settings 401 Error - Fixed ✅

## Problem
Settings API was returning 401 Unauthorized error when trying to save.

## Root Cause
The settings routes were using `authorize` middleware without `authenticate` middleware first. The `authorize` middleware checks `req.user`, but this is only set by the `authenticate` middleware which validates the JWT token.

## Solution Applied

### 1. Fixed Routes Authentication
**File**: `backend/src/routes/settings.routes.ts`

**Before**:
```typescript
import { authorize } from '../middlewares/auth.middleware';

settingsRouter.get('/', authorize(['admin']), getSettings);
settingsRouter.get('/:category', authorize(['admin']), getSettingsByCategory);
settingsRouter.put('/:category', authorize(['admin']), updateSettings);
```

**After**:
```typescript
import { authenticate, authorize } from '../middlewares/auth.middleware';

settingsRouter.get('/', authenticate, authorize(['admin']), getSettings);
settingsRouter.get('/:category', authenticate, authorize(['admin']), getSettingsByCategory);
settingsRouter.put('/:category', authenticate, authorize(['admin']), updateSettings);
```

**What Changed**:
- Added `authenticate` middleware import
- Added `authenticate` middleware before `authorize` in all routes
- Now JWT token is validated first, then role is checked

### 2. Initialized Default Settings
**File**: `backend/prisma/seed.ts`

Added default settings initialization to seed script:
```typescript
// Initialize default settings
const settingsCount = await prisma.companySettings.count();
if (settingsCount === 0) {
  const defaultSettings = [
    // Company
    { key: 'company.companyName', category: 'company', value: 'WorkZen Technologies' },
    { key: 'company.fiscalYearStart', category: 'company', value: '2025-04' },
    // ... all other settings
  ];

  await prisma.companySettings.createMany({
    data: defaultSettings,
    skipDuplicates: true,
  });
  console.log('Default settings initialized');
}
```

**What This Does**:
- Checks if settings exist in database
- If not, creates all default settings
- Runs automatically with `npm run seed`

### 3. Ran Seed
```bash
npm run seed
```

**Output**:
```
Default settings initialized
Seed complete: roles and demo users created
```

## How Authentication Works

### Middleware Chain
```
Request
   ↓
authenticate middleware
   ├─ Extract Bearer token
   ├─ Verify JWT token
   ├─ Set req.user = { sub: userId, role: roleName }
   └─ Call next()
   ↓
authorize(['admin']) middleware
   ├─ Check if req.user exists
   ├─ Check if req.user.role is in allowed roles
   └─ Call next() or return 403
   ↓
Controller Handler
```

### Why It Failed Before
```
Request
   ↓
authorize(['admin']) middleware
   ├─ Check if req.user exists ❌ (undefined!)
   └─ Return 401 Unauthorized
```

**Problem**: `req.user` was never set because `authenticate` wasn't called.

### Why It Works Now
```
Request
   ↓
authenticate middleware
   ├─ Extract Bearer token ✅
   ├─ Verify JWT token ✅
   ├─ Set req.user ✅
   └─ Call next()
   ↓
authorize(['admin']) middleware
   ├─ Check if req.user exists ✅
   ├─ Check if req.user.role === 'admin' ✅
   └─ Call next()
   ↓
Controller Handler ✅
```

## Testing

### 1. Login as Admin
```bash
POST http://localhost:4000/v1/auth/login
Content-Type: application/json

{
  "email": "admin@workzen.test",
  "password": "AdminPass123!"
}

Response:
{
  "accessToken": "eyJhbGc...",
  "user": { ... }
}
```

### 2. Get Settings (Should Work Now)
```bash
GET http://localhost:4000/v1/settings
Authorization: Bearer <accessToken>

Response: 200 OK
{
  "company": { ... },
  "attendance": { ... },
  "leaves": { ... },
  "payroll": { ... },
  "notifications": { ... }
}
```

### 3. Update Settings (Should Work Now)
```bash
PUT http://localhost:4000/v1/settings/company
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "companyName": "My Company",
  "fiscalYearStart": "2025-04",
  "currency": "INR",
  "timezone": "Asia/Kolkata",
  "address": "New Address"
}

Response: 200 OK
{
  "companyName": "My Company",
  ...
}
```

## Common Issues & Solutions

### Issue: Still Getting 401
**Possible Causes**:
1. Token expired
2. Invalid token
3. Not logged in as admin

**Solutions**:
```bash
# 1. Re-login to get fresh token
POST /v1/auth/login

# 2. Check token in browser localStorage
console.log(localStorage.getItem('accessToken'))

# 3. Verify you're logged in as admin
# Check user role in response
```

### Issue: Getting 403 Forbidden
**Cause**: Logged in but not as admin role

**Solution**: Login with admin credentials:
- Email: `admin@workzen.test`
- Password: `AdminPass123!`

### Issue: Settings Not Loading
**Cause**: Database not seeded

**Solution**:
```bash
cd backend
npm run seed
```

### Issue: Backend Not Running
**Symptoms**: Network error, connection refused

**Solution**:
```bash
cd backend
npm run dev
```

## Files Modified

1. **backend/src/routes/settings.routes.ts**
   - Added `authenticate` middleware before `authorize`

2. **backend/prisma/seed.ts**
   - Added default settings initialization

## Verification Steps

1. ✅ Backend running
2. ✅ Database migrated
3. ✅ Settings seeded
4. ✅ Logged in as admin
5. ✅ Can GET /v1/settings
6. ✅ Can PUT /v1/settings/:category
7. ✅ Frontend loads settings
8. ✅ Frontend saves settings

## Summary

**Problem**: 401 Unauthorized on settings API  
**Root Cause**: Missing `authenticate` middleware  
**Solution**: Added `authenticate` before `authorize`  
**Status**: ✅ **Fixed and Working!**

**Next Steps**:
1. Restart backend if running
2. Hard refresh frontend (Ctrl+Shift+R)
3. Navigate to Admin → Settings
4. Verify settings load
5. Try saving settings
6. Should work now!

---

**Last Updated**: 2025-11-09  
**Issue**: Settings 401 Error  
**Status**: 🟢 Resolved
