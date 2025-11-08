# Audit Logs - Human-Readable Descriptions ✅

## Problem
Audit logs were showing raw database query-like actions (e.g., "USER_CREATE", "LEAVE_APPLY") instead of human-readable English descriptions.

## Solution
Created an audit formatter utility that converts technical action codes into natural language descriptions with context.

---

## What Changed

### 1. ✅ Created Audit Formatter Utility
**File**: `backend/src/utils/audit-formatter.ts`

**Functions**:
- `formatAuditAction()` - Converts action codes to readable descriptions
- `formatAuditTime()` - Converts timestamps to relative time (e.g., "5 minutes ago")
- `getAuditIcon()` - Returns emoji icons for different action types

### 2. ✅ Updated Audit Repository
**File**: `backend/src/repositories/audit.repository.ts`

**Changes**:
- Import formatter utilities
- Map each audit log item to include `description` and `timeAgo` fields
- Return formatted data to API

---

## Transformation Examples

### Before (Raw Actions)
```json
{
  "action": "USER_CREATE",
  "entity": "User",
  "meta": { "email": "john@example.com", "role": "employee" }
}
```

### After (Human-Readable)
```json
{
  "action": "USER_CREATE",
  "entity": "User",
  "meta": { "email": "john@example.com", "role": "employee" },
  "description": "Admin created a new user account for john@example.com with employee role",
  "timeAgo": "5 minutes ago"
}
```

---

## Supported Action Formats

### User Actions

#### USER_CREATE
**Raw**: `USER_CREATE`  
**Formatted**: `Admin created a new user account for john@example.com with employee role`

#### USER_UPDATE
**Raw**: `USER_UPDATE`  
**Formatted**: `Admin updated user: role to manager, activated account`

#### USER_DELETE / DELETE
**Raw**: `USER_DELETE`  
**Formatted**: `Admin deleted user (soft delete)`

---

### Leave Actions

#### LEAVE_APPLY
**Raw**: `LEAVE_APPLY`  
**Formatted**: `John Doe applied for 3 day(s) leave`

#### LEAVE_APPROVE
**Raw**: `LEAVE_APPROVE`  
**Formatted**: `HR Manager approved a leave request for 3 day(s)`

#### LEAVE_REJECT
**Raw**: `LEAVE_REJECT`  
**Formatted**: `HR Manager rejected a leave request: Insufficient balance`

#### LEAVE_CANCEL
**Raw**: `LEAVE_CANCEL`  
**Formatted**: `John Doe cancelled their leave request`

---

### Attendance Actions

#### ATTENDANCE_CHECKIN / CHECK_IN
**Raw**: `CHECK_IN`  
**Formatted**: `John Doe checked in at 09:15 AM`

#### ATTENDANCE_CHECKOUT / CHECK_OUT
**Raw**: `CHECK_OUT`  
**Formatted**: `John Doe checked out at 06:30 PM`

#### ATTENDANCE_MARK
**Raw**: `ATTENDANCE_MARK`  
**Formatted**: `Admin marked attendance as present`

---

### Payroll Actions

#### PAYROLL_RUN
**Raw**: `PAYROLL_RUN`  
**Formatted**: `Payroll Manager ran payroll for November 2025 (150 employees)`

#### PAYROLL_APPROVE
**Raw**: `PAYROLL_APPROVE`  
**Formatted**: `Admin approved payroll`

#### PAYSLIP_GENERATE
**Raw**: `PAYSLIP_GENERATE`  
**Formatted**: `System generated payslip for November 2025`

---

### Settings Actions

#### SETTINGS_UPDATE
**Raw**: `SETTINGS_UPDATE`  
**Formatted**: `Admin updated company settings`

---

### Profile Actions

#### PROFILE_UPDATE
**Raw**: `PROFILE_UPDATE`  
**Formatted**: `John Doe updated their profile`

#### PROFILE_PHOTO_UPDATE
**Raw**: `PROFILE_PHOTO_UPDATE`  
**Formatted**: `John Doe updated profile photo`

---

### Authentication Actions

#### LOGIN / USER_LOGIN
**Raw**: `LOGIN`  
**Formatted**: `John Doe logged in from 192.168.1.100`

#### LOGOUT / USER_LOGOUT
**Raw**: `LOGOUT`  
**Formatted**: `John Doe logged out`

#### PASSWORD_CHANGE
**Raw**: `PASSWORD_CHANGE`  
**Formatted**: `John Doe changed their password`

#### PASSWORD_RESET
**Raw**: `PASSWORD_RESET`  
**Formatted**: `John Doe reset their password`

---

### Generic CRUD Actions

#### CREATE
**Raw**: `CREATE`  
**Formatted**: `Admin created department`

#### UPDATE
**Raw**: `UPDATE`  
**Formatted**: `Admin updated department`

#### READ / VIEW
**Raw**: `VIEW`  
**Formatted**: `User viewed report`

---

## Time Formatting

### Relative Time Examples

| Actual Time | Formatted Output |
|-------------|------------------|
| 30 seconds ago | Just now |
| 5 minutes ago | 5 minutes ago |
| 1 hour ago | 1 hour ago |
| 3 hours ago | 3 hours ago |
| 1 day ago | 1 day ago |
| 5 days ago | 5 days ago |
| 10 days ago | Nov 1 |
| Last year | Nov 1, 2024 |

---

## Icon Mapping

| Action Type | Icon | Example Actions |
|-------------|------|-----------------|
| Create | ➕ | USER_CREATE, LEAVE_APPLY |
| Update | ✏️ | USER_UPDATE, PROFILE_UPDATE |
| Delete | 🗑️ | USER_DELETE, LEAVE_CANCEL |
| Login | 🔐 | LOGIN, USER_LOGIN |
| Logout | 🚪 | LOGOUT, USER_LOGOUT |
| Approve | ✅ | LEAVE_APPROVE, PAYROLL_APPROVE |
| Reject | ❌ | LEAVE_REJECT |
| Leave | 🏖️ | LEAVE_APPLY, LEAVE_CANCEL |
| Attendance | ⏰ | CHECK_IN, CHECK_OUT |
| Payroll | 💰 | PAYROLL_RUN, PAYSLIP_GENERATE |
| Settings | ⚙️ | SETTINGS_UPDATE |
| Profile | 👤 | PROFILE_UPDATE |
| Default | 📝 | Any other action |

---

## API Response Format

### GET /v1/admin/audit

**Before**:
```json
{
  "items": [
    {
      "id": "clxxx123",
      "action": "USER_CREATE",
      "entity": "User",
      "entityId": "user123",
      "userId": "admin123",
      "meta": { "email": "john@example.com", "role": "employee" },
      "createdAt": "2025-11-09T01:30:00Z",
      "user": {
        "name": "Admin",
        "email": "admin@workzen.test"
      }
    }
  ]
}
```

**After**:
```json
{
  "items": [
    {
      "id": "clxxx123",
      "action": "USER_CREATE",
      "entity": "User",
      "entityId": "user123",
      "userId": "admin123",
      "meta": { "email": "john@example.com", "role": "employee" },
      "createdAt": "2025-11-09T01:30:00Z",
      "user": {
        "name": "Admin",
        "email": "admin@workzen.test"
      },
      "description": "Admin created a new user account for john@example.com with employee role",
      "timeAgo": "5 minutes ago"
    }
  ]
}
```

---

## Frontend Integration

The frontend AdminDashboard already uses the `description` field for recent activity:

```typescript
// src/pages/admin/AdminDashboard.tsx
const recentActivity = recentAuditLogs.items.map((log: any) => ({
  id: log.id,
  action: log.description || formatActivityDescription(log), // Uses description
  user: log.user?.name || 'System',
  time: log.timeAgo || formatRelativeTime(log.createdAt), // Uses timeAgo
  type: getActivityType(log.action),
}));
```

**Display Example**:
```
Recent Activity
---------------
👤 Admin created a new user account for john@example.com with employee role
   5 minutes ago

✅ HR Manager approved a leave request for 3 day(s)
   15 minutes ago

⏰ John Doe checked in at 09:15 AM
   1 hour ago
```

---

## How It Works

### Data Flow

```
Database Query
   ↓
Raw Audit Logs
   ↓
AuditRepository.list()
   ↓
formatAuditAction() - Converts action to description
formatAuditTime() - Converts timestamp to relative time
   ↓
Enhanced Audit Logs
   ↓
API Response
   ↓
Frontend Display
```

### Formatter Logic

```typescript
// Example: USER_CREATE action
{
  action: "USER_CREATE",
  meta: { email: "john@example.com", role: "employee" },
  user: { name: "Admin" }
}

↓ formatAuditAction() ↓

"Admin created a new user account for john@example.com with employee role"
```

---

## Customization

### Adding New Action Types

Edit `backend/src/utils/audit-formatter.ts`:

```typescript
export function formatAuditAction(log: AuditLog): string {
  // ... existing code ...
  
  // Add new action
  case 'CUSTOM_ACTION':
    return `${userName} performed custom action${meta.details ? `: ${meta.details}` : ''}`;
  
  // ... rest of code ...
}
```

### Customizing Time Format

Edit the `formatAuditTime()` function:

```typescript
export function formatAuditTime(date: Date | string): string {
  // Customize thresholds and formats
  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`; // Shortened format
  // ... etc
}
```

---

## Testing

### Test Audit Log Creation

```bash
# Create a test audit log
curl -X POST http://localhost:4000/v1/users \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "role": "employee"
  }'
```

### View Formatted Audit Logs

```bash
# Get audit logs
curl http://localhost:4000/v1/admin/audit \
  -H "Authorization: Bearer <admin_token>"
```

**Expected Response**:
```json
{
  "items": [
    {
      "action": "USER_CREATE",
      "description": "Admin created a new user account for test@example.com with employee role",
      "timeAgo": "Just now"
    }
  ]
}
```

---

## Benefits

### ✅ User-Friendly
- No technical jargon
- Clear, natural language
- Context-aware descriptions

### ✅ Informative
- Includes relevant metadata
- Shows who did what
- Provides timing information

### ✅ Maintainable
- Centralized formatting logic
- Easy to add new action types
- Consistent across application

### ✅ Flexible
- Supports all CRUD operations
- Handles custom metadata
- Fallback for unknown actions

---

## Files Modified

1. **backend/src/utils/audit-formatter.ts** (NEW)
   - `formatAuditAction()` - Main formatter
   - `formatAuditTime()` - Time formatter
   - `getAuditIcon()` - Icon mapper

2. **backend/src/repositories/audit.repository.ts** (MODIFIED)
   - Import formatter utilities
   - Add `description` and `timeAgo` to response

---

## Summary

**Problem**: Audit logs showed raw action codes like "USER_CREATE"  
**Solution**: Created formatter to convert to "Admin created a new user account"  
**Result**: ✅ **Human-readable audit logs throughout the application!**

**What Users See Now**:
- ✅ Natural language descriptions
- ✅ Relative timestamps ("5 minutes ago")
- ✅ Contextual information from metadata
- ✅ User-friendly activity feed

**Status**: 🟢 **Audit Logs Humanized!**

---

**Last Updated**: 2025-11-09  
**Feature**: Human-Readable Audit Logs  
**Status**: ✅ Complete
