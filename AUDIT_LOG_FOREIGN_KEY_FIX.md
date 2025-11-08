# Audit Log Foreign Key Error - Fixed ✅

## Problem
```
PrismaClientKnownRequestError: Foreign key constraint violated: `AuditLog_userId_fkey (index)`
```

The audit log creation was failing because it was trying to use a role string ("admin") as a user ID instead of the actual user's database ID.

---

## Root Cause

### In `admin.service.ts`
```typescript
// WRONG - passing role string as userId
async deleteUser(requestorRole: string, userId: string) {
  await AuditRepository.create({
    userId: requestorRole,  // ❌ "admin" is not a valid user ID!
    action: 'DELETE',
    entity: 'User',
    entityId: userId,
    meta: { soft: true },
  });
}
```

### In `admin.controller.ts`
```typescript
// WRONG - passing role instead of user ID
export async function deleteUser(req: AuthRequest, res: Response) {
  const role = req.user!.role;  // ❌ This is "admin", not a user ID
  const userId = req.params.id;
  const user = await AdminService.deleteUser(role, userId);
}
```

**Problem**: The `userId` field in `AuditLog` table has a foreign key constraint to the `User` table. When we tried to insert "admin" (a role string) as the `userId`, it violated this constraint because "admin" is not a valid user ID in the database.

---

## Solution Applied

### 1. ✅ Fixed Controller
**File**: `backend/src/controllers/admin.controller.ts`

```typescript
// CORRECT - extract user ID from JWT token
export async function deleteUser(req: AuthRequest, res: Response) {
  const requestorId = req.user!.sub;  // ✅ Actual user ID from JWT
  const role = req.user!.role;        // Role for authorization check
  const userId = req.params.id;
  const user = await AdminService.deleteUser(requestorId, role, userId);
  return res.json({ success: true, user });
}
```

**What Changed**:
- Added `requestorId = req.user!.sub` to get actual user ID
- Pass both `requestorId` and `role` to service
- `sub` field in JWT contains the user's database ID

### 2. ✅ Fixed Service
**File**: `backend/src/services/admin.service.ts`

```typescript
// CORRECT - accept and use actual user ID
async deleteUser(requestorId: string, requestorRole: string, userId: string) {
  if (requestorRole !== 'admin') {
    const err: any = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  // Log audit with actual user ID
  await AuditRepository.create({
    userId: requestorId,  // ✅ Valid user ID from database
    action: 'DELETE',
    entity: 'User',
    entityId: userId,
    meta: { soft: true },
  });

  return user;
}
```

**What Changed**:
- Function signature now accepts `requestorId` as first parameter
- Use `requestorId` for audit log instead of `requestorRole`
- Keep `requestorRole` for authorization check

---

## JWT Token Structure

The JWT token contains:
```json
{
  "sub": "clxxx123...",  // ✅ User's database ID
  "role": "admin"        // User's role (for authorization)
}
```

**Available in `req.user`**:
- `req.user.sub` - User's database ID (use for audit logs)
- `req.user.role` - User's role string (use for authorization)

---

## Database Schema

### AuditLog Table
```sql
CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT,  -- Foreign key to User.id
  "action" TEXT NOT NULL,
  "entity" TEXT,
  "entityId" TEXT,
  "ip" TEXT,
  "userAgent" TEXT,
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") 
    REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
```

**Foreign Key Constraint**:
- `userId` must reference a valid `User.id`
- Cannot be a random string like "admin"
- Can be NULL (for system actions)

---

## How It Works Now

### Request Flow
```
DELETE /v1/admin/users/:id
   ↓
authenticate middleware
   ├─ Validates JWT token
   ├─ Sets req.user.sub = "clxxx123..." (user ID)
   └─ Sets req.user.role = "admin"
   ↓
admin.controller.deleteUser()
   ├─ Extract requestorId = req.user.sub
   ├─ Extract role = req.user.role
   └─ Call AdminService.deleteUser(requestorId, role, userId)
   ↓
admin.service.deleteUser()
   ├─ Check if role === 'admin'
   ├─ Soft delete user
   └─ Create audit log with requestorId ✅
   ↓
AuditRepository.create()
   ├─ Insert into AuditLog table
   └─ userId = "clxxx123..." (valid foreign key) ✅
```

---

## Similar Patterns in Codebase

### ✅ Correct Usage (users.service.ts)
```typescript
// Already correct - uses actor.id
await AuditService.create({ 
  userId: actor.id,  // ✅ Actual user ID
  action: 'USER_DELETE', 
  entity: 'User', 
  entityId: id 
});
```

### ✅ Correct Usage (leaves.service.ts)
```typescript
// Already correct - uses data.userId
await AuditService.create({ 
  userId: data.userId,  // ✅ Actual user ID
  action: 'LEAVE_APPLY', 
  entity: 'LeaveRequest', 
  entityId: created.id 
});
```

---

## Testing

### Test Delete User
```bash
# Login as admin
POST http://localhost:4000/v1/auth/login
{
  "email": "admin@workzen.test",
  "password": "AdminPass123!"
}

# Get token from response
# Then delete a user
DELETE http://localhost:4000/v1/admin/users/<user_id>
Authorization: Bearer <admin_token>
```

**Expected**:
- ✅ User soft deleted
- ✅ Audit log created successfully
- ✅ No foreign key error

### Verify Audit Log
```bash
# Get audit logs
GET http://localhost:4000/v1/admin/audit
Authorization: Bearer <admin_token>
```

**Expected Response**:
```json
{
  "items": [
    {
      "action": "DELETE",
      "entity": "User",
      "userId": "clxxx123...",  // ✅ Valid user ID
      "description": "Admin deleted user (soft delete)",
      "timeAgo": "Just now"
    }
  ]
}
```

---

## Key Takeaways

### ❌ Don't Do This
```typescript
// Wrong - using role string as user ID
await AuditRepository.create({
  userId: "admin",  // ❌ Not a valid user ID
  action: 'DELETE'
});
```

### ✅ Do This Instead
```typescript
// Correct - using actual user ID from JWT
const requestorId = req.user!.sub;
await AuditRepository.create({
  userId: requestorId,  // ✅ Valid user ID
  action: 'DELETE'
});
```

### Remember
- **`req.user.sub`** = User's database ID (for audit logs, queries)
- **`req.user.role`** = User's role string (for authorization checks)
- Always use `sub` when you need to reference the user in the database

---

## Files Modified

1. **backend/src/controllers/admin.controller.ts**
   - Extract `requestorId` from `req.user.sub`
   - Pass `requestorId` to service

2. **backend/src/services/admin.service.ts**
   - Accept `requestorId` as parameter
   - Use `requestorId` for audit log

---

## Summary

**Problem**: Foreign key constraint error when creating audit logs  
**Cause**: Using role string ("admin") instead of user ID  
**Solution**: Extract user ID from JWT token (`req.user.sub`)  
**Result**: ✅ **Audit logs now created successfully!**

**Status**: 🟢 **Fixed - Audit logs working correctly**

---

**Last Updated**: 2025-11-09  
**Issue**: Audit Log Foreign Key Violation  
**Status**: ✅ Resolved
