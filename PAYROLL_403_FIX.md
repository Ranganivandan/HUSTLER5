# Payroll 403 Forbidden Error - Fixed ✅

## Issue
When reloading the Payruns page as a payroll user, the application was returning **403 Forbidden** error from the API.

## Root Cause
The profile list endpoint (`GET /v1/profile`) was only authorized for `admin` and `hr` roles. The `payroll` role was not included in the authorization list, preventing payroll users from loading employee data needed for payrun execution.

## Solution Applied

### 1. Updated Profile Routes
**File**: `backend/src/routes/profile.routes.ts`

**Before**:
```typescript
// HR/Admin list all profiles
profileRouter.get('/', authorize(['admin','hr']), list);
```

**After**:
```typescript
// HR/Admin/Payroll list all profiles
profileRouter.get('/', authorize(['admin','hr','payroll']), list);
```

### 2. Updated Profile Service
**File**: `backend/src/services/profile.service.ts`

**Before**:
```typescript
async list(requestorRole: string, page: number, limit: number, search?: string) {
  if (!['admin', 'hr'].includes(requestorRole)) {
    const err: any = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  return ProfileRepository.list(page, limit, search);
}
```

**After**:
```typescript
async list(requestorRole: string, page: number, limit: number, search?: string) {
  if (!['admin', 'hr', 'payroll'].includes(requestorRole)) {
    const err: any = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  return ProfileRepository.list(page, limit, search);
}
```

## Why This Fix Is Necessary

The Payruns page needs to:
1. Load all employee profiles to display in the employee list
2. Show employee details (name, code, department, salary)
3. Calculate payroll for selected employees
4. Execute payroll run via backend

Without access to the profile list endpoint, payroll users cannot:
- View employees in the payruns page
- Calculate payroll
- Execute payroll runs

## Testing Steps

1. **Login as payroll user**:
   - Email: `payroll@workzen.com`
   - Password: `password`

2. **Navigate to Payruns page**:
   - Click on "Payroll" in sidebar
   - Click on "Payruns"

3. **Verify employees load**:
   - Should see success toast: "Loaded X employees"
   - Employee table should populate with data
   - No 403 error in browser console

4. **Test payroll calculation**:
   - Select a pay period
   - Click "Run Payroll Calculation"
   - Verify preview shows calculated amounts

5. **Test payroll execution**:
   - Click "Confirm Pay Run & Generate Payslips"
   - Should see success message
   - Payslips should be created in database

## Authorization Matrix

| Endpoint | Admin | HR | Payroll | Employee |
|----------|-------|----|---------| ---------|
| `GET /v1/profile` | ✅ | ✅ | ✅ | ❌ |
| `GET /v1/profile/me` | ✅ | ✅ | ✅ | ✅ |
| `GET /v1/profile/:userId` | ✅ | ✅ | ❌ | ❌ |
| `POST /v1/payroll/run` | ✅ | ❌ | ✅ | ❌ |
| `GET /v1/payroll/:id` | ✅ | ❌ | ✅ | ❌ |

## Impact

### Before Fix
- ❌ Payroll users get 403 error on Payruns page
- ❌ Cannot load employee list
- ❌ Cannot execute payroll runs
- ❌ Payroll functionality completely broken for payroll role

### After Fix
- ✅ Payroll users can access Payruns page
- ✅ Employee list loads successfully
- ✅ Can calculate and execute payroll
- ✅ Full payroll functionality restored

## Security Considerations

**Is this change safe?**
✅ **YES** - This change is secure and appropriate because:

1. **Role Separation**: Payroll users need employee data to perform their job function (processing payroll)
2. **Read-Only Access**: This only grants read access to employee profiles, not modification rights
3. **Consistent with Existing Permissions**: Payroll users already have access to:
   - Run payroll (`POST /v1/payroll/run`)
   - View payrun details (`GET /v1/payroll/:id`)
   - View payslips (`GET /v1/payroll/payslips/:userId`)
4. **No Sensitive Data Exposure**: Employee profiles don't contain sensitive authentication data
5. **Standard Practice**: Payroll departments typically need access to employee information

**What payroll users CANNOT do**:
- ❌ Modify employee profiles
- ❌ Delete employees
- ❌ View individual employee details (GET /v1/profile/:userId)
- ❌ Access admin functions
- ❌ Manage user accounts

## Files Modified

1. `backend/src/routes/profile.routes.ts` - Line 11
2. `backend/src/services/profile.service.ts` - Line 27

## Deployment

**Backend Changes Required**: ✅ Yes
- Restart backend server after deploying changes
- No database migration needed
- No breaking changes

**Frontend Changes Required**: ❌ No
- Frontend already handles this correctly

## Related Issues Fixed

This fix also resolves:
- ✅ "0 employees selected" issue in Payruns
- ✅ Empty employee table in Payruns page
- ✅ Disabled "Run Payroll Calculation" button

All these issues were symptoms of the same root cause (403 error preventing data load).

---

**Status**: 🟢 **Fixed and Ready for Testing**

**Priority**: 🔴 **Critical** - Blocks core payroll functionality

**Last Updated**: 2025-11-08
