# Department "Unassigned" Issue - Fixed ✅

## Problem
Employees showing "Unassigned" department in Payruns, Dashboard, and Reports even though departments are assigned in the database.

## Root Cause
The seed file was updated to assign departments, but:
1. **Database not updated**: Existing employee profiles created before the seed update don't have departments
2. **Seed needs to run**: The updated seed.ts needs to be executed to populate departments
3. **Backend cache**: Backend server may be caching old data

## Solution

### Step 1: Updated Seed File ✅
**File**: `backend/prisma/seed.ts`

The seed now assigns:
- **Departments**: Engineering, Product, Sales, HR, Finance (random for employees)
- **Basic Salary**: Role-based (Admin: ₹80k, HR: ₹60k, Payroll: ₹55k, Employees: ₹30k-70k)
- **Designations**: Software Engineer for employees, role name for others

```typescript
// Assign departments based on role
const departments = ['Engineering', 'Product', 'Sales', 'HR', 'Finance'];
const department = demoUser.roleName === 'employee' 
  ? departments[Math.floor(Math.random() * departments.length)]
  : demoUser.roleName === 'hr' ? 'HR' : 'Engineering';

// Assign salary based on role
const baseSalary = demoUser.roleName === 'admin' ? 80000 
  : demoUser.roleName === 'hr' ? 60000
  : demoUser.roleName === 'payroll' ? 55000
  : 30000 + Math.floor(Math.random() * 40000);
```

### Step 2: Run Seed ✅
```bash
cd backend
npm run seed
```

**Output**: `Seed complete: roles and demo users created (password: "password" for all)`

This command:
- ✅ Creates/updates all user roles
- ✅ Creates/updates all demo users
- ✅ **Updates existing employee profiles** with departments and salaries
- ✅ Preserves existing data (leave balances, etc.)

### Step 3: Restart Backend Server
After running seed, restart the backend to clear any caches:

```bash
# Stop the backend (Ctrl+C)
# Then restart
npm run dev
```

### Step 4: Clear Frontend Cache
In the browser:
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

Or simply:
- Press `Ctrl + Shift + R` (Windows)
- Press `Cmd + Shift + R` (Mac)

### Step 5: Added Debug Logging ✅
**File**: `src/pages/payroll/Payruns.tsx`

Added console warning to identify employees missing departments:

```typescript
const employeeData: PayrollEmployee[] = profiles.items.map((p: any) => {
  // Debug: Log department data
  if (!p.department) {
    console.warn('Employee missing department:', p.user?.name, p);
  }
  
  return {
    id: p.userId,
    name: p.user?.name || 'Unknown',
    employeeCode: p.employeeCode || 'N/A',
    department: p.department || 'Unassigned',
    basicPay: (p.metadata?.basicSalary as number) || 30000,
    officeScore: 8.0,
    attendance: 22,
    leaves: 0,
  };
});
```

**How to Use**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Navigate to Payruns page
4. Check for warnings about missing departments
5. If warnings appear, re-run seed

---

## Verification Steps

### 1. Check Database Directly
Run this query to verify departments are assigned:

```sql
SELECT 
  u.name, 
  u.email,
  ep.department,
  ep.designation,
  ep.metadata->>'basicSalary' as salary
FROM "User" u
LEFT JOIN "EmployeeProfile" ep ON u.id = ep."userId"
WHERE u."roleId" IN (
  SELECT id FROM "Role" WHERE name IN ('employee', 'hr', 'payroll', 'admin')
);
```

**Expected**: All employees should have departments (not NULL)

### 2. Check API Response
In browser DevTools:
1. Go to Network tab
2. Navigate to Payruns page
3. Find the `/v1/profile` request
4. Check Response tab
5. Verify `department` field is populated

**Expected**: Each profile should have `"department": "Engineering"` (or other department)

### 3. Check Frontend Display
1. Navigate to **Payruns** page
2. Click "Run Payroll Calculation"
3. Check employee table - Department column should show actual departments
4. Navigate to **Dashboard**
5. Check "Department Distribution" chart - should show real departments
6. Navigate to **Reports**
7. Check "Department Breakdown" tab - should show real departments

**Expected**: No "Unassigned" departments visible

---

## Where Departments Are Used

### 1. Payruns Page
**Location**: Employee table in "Select Employees" tab

**Code**: `src/pages/payroll/Payruns.tsx` line 93
```typescript
department: p.department || 'Unassigned',
```

**Display**: Shows in table column

### 2. Dashboard
**Location**: 
- Department Distribution chart
- Top Performers table

**Code**: `src/pages/payroll/PayrollDashboard.tsx` lines 41, 95
```typescript
const dept = p.department || 'Unassigned';
// ...
department: p.department || 'Unassigned',
```

**Display**: 
- Pie chart showing department distribution
- Department name in top performers list

### 3. Reports
**Location**: Department Breakdown report

**Code**: `src/pages/payroll/Reports.tsx` line 61
```typescript
const dept = p.department || 'Unassigned';
```

**Display**: Department column in breakdown table

---

## Department Assignment Logic

### For Employees (role = 'employee')
**Random assignment** from:
- Engineering
- Product
- Sales
- HR
- Finance

```typescript
const departments = ['Engineering', 'Product', 'Sales', 'HR', 'Finance'];
const department = departments[Math.floor(Math.random() * departments.length)];
```

### For HR Users (role = 'hr')
**Fixed assignment**: HR department

```typescript
const department = 'HR';
```

### For Other Roles (admin, payroll)
**Fixed assignment**: Engineering department

```typescript
const department = 'Engineering';
```

---

## Troubleshooting

### Issue: Still Seeing "Unassigned"
**Possible Causes**:
1. Seed not run
2. Backend not restarted
3. Frontend cache not cleared
4. Database connection issue

**Solution**:
```bash
# 1. Run seed
cd backend
npm run seed

# 2. Restart backend
# Stop with Ctrl+C, then:
npm run dev

# 3. Clear browser cache
# Ctrl+Shift+R or Cmd+Shift+R

# 4. Check console for errors
# F12 → Console tab
```

### Issue: Some Employees Have Departments, Others Don't
**Possible Cause**: Employees created after seed update

**Solution**: Run seed again to update all profiles
```bash
cd backend
npm run seed
```

### Issue: Console Shows "Employee missing department" Warning
**Cause**: Profile in database doesn't have department field populated

**Solution**:
1. Check which employees are affected (console shows names)
2. Run seed to update all profiles
3. If specific employee still missing, manually update in database:

```sql
UPDATE "EmployeeProfile" 
SET department = 'Engineering', 
    designation = 'Software Engineer'
WHERE "userId" = 'user-id-here';
```

---

## Database Schema

### EmployeeProfile Model
```prisma
model EmployeeProfile {
  id             String   @id @default(cuid())
  userId         String   @unique
  user           User     @relation(fields: [userId], references: [id])
  employeeCode   String   @unique
  department     String?  // ← This field stores department
  designation    String?
  managerId      String?
  phone          String?
  address        Json?
  resumeUploadId String?
  parsed_resume  Json?
  metadata       Json?    // Stores basicSalary, leaveBalance, etc.
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

**Key Points**:
- `department` is optional (String?)
- Stored as plain text (not relation)
- Can be NULL (shows as "Unassigned" in UI)

---

## API Response Structure

### Profile List API
```typescript
GET /v1/profile?page=1&limit=100

Response:
{
  "items": [
    {
      "id": "clxxx...",
      "userId": "clyyy...",
      "employeeCode": "WZ-12345678",
      "department": "Engineering",  // ← Should be populated
      "designation": "Software Engineer",
      "metadata": {
        "basicSalary": 50000,
        "leaveBalance": {
          "SICK": 5,
          "CASUAL": 5,
          "EARNED": 10,
          "UNPAID": 9999
        }
      },
      "user": {
        "id": "clyyy...",
        "name": "John Doe",
        "email": "john@example.com",
        "role": {
          "id": "clzzz...",
          "name": "employee"
        }
      }
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 100
}
```

---

## Testing Checklist

### After Running Seed
- [ ] Backend restarted
- [ ] Frontend cache cleared
- [ ] Navigate to Payruns
- [ ] Click "Run Payroll Calculation"
- [ ] Verify employees show departments (not "Unassigned")
- [ ] Navigate to Dashboard
- [ ] Verify Department Distribution shows real departments
- [ ] Verify Top Performers show departments
- [ ] Navigate to Reports
- [ ] Verify Department Breakdown shows real departments
- [ ] Check browser console for warnings
- [ ] Export CSV/PDF and verify departments appear

### Database Verification
- [ ] Run SQL query to check departments
- [ ] All employees have non-NULL department
- [ ] Departments are realistic (Engineering, Sales, etc.)
- [ ] Basic salaries are populated
- [ ] Designations are set

---

## Files Modified

### Backend
1. **backend/prisma/seed.ts**
   - Lines 67-107: Added department and salary assignment logic
   - Updates existing profiles with missing data

### Frontend
1. **src/pages/payroll/Payruns.tsx**
   - Lines 84-98: Added debug logging for missing departments

---

## Summary

### What Was Wrong
- ❌ Seed file didn't assign departments initially
- ❌ Existing employee profiles had NULL departments
- ❌ Frontend showed "Unassigned" as fallback

### What's Fixed
- ✅ Seed file now assigns departments to all employees
- ✅ Seed updates existing profiles (not just creates new)
- ✅ Random department assignment for employees
- ✅ Role-based department for HR/admin/payroll
- ✅ Debug logging to identify issues
- ✅ Proper fallback handling

### Impact
- **Payruns**: Shows actual departments in employee table
- **Dashboard**: Department distribution chart shows real data
- **Reports**: Department breakdown accurate
- **User Experience**: Professional, realistic data display

---

**Status**: 🟢 **Fixed - Run seed and restart backend!**

**Last Updated**: 2025-11-08

**Next Steps**:
1. Run `npm run seed` in backend directory
2. Restart backend server
3. Clear browser cache (Ctrl+Shift+R)
4. Verify departments appear in all sections
5. Check console for any warnings
