# Attendance Check-In/Check-Out Testing Guide

## Quick Test Steps

### 1. Login as Employee
- URL: http://localhost:8080
- Email: `employee@workzen.com`
- Password: `password`

### 2. Navigate to Attendance Page
- Click "Attendance" in the sidebar
- You should see the attendance page with calendar

### 3. Test Check-In Flow

#### Initial State
- [ ] Gray square indicator visible on left
- [ ] Card shows "Mark Today's Attendance"
- [ ] "Punch In" button visible
- [ ] Card has primary/blue border

#### Click "Punch In"
- [ ] Browser asks for location permission (if geofencing enabled)
- [ ] Button shows "Getting Location..." with spinner
- [ ] Success toast appears: "Checked in successfully"
- [ ] UI updates automatically

#### After Check-In State
- [ ] Green square indicator visible
- [ ] Card shows "You're checked in"
- [ ] "Punch Out" button visible (outline variant)
- [ ] Card has green border

### 4. Test Check-Out Flow

#### Click "Punch Out"
- [ ] Browser asks for location permission (if geofencing enabled)
- [ ] Button shows "Getting Location..." with spinner
- [ ] Success toast appears: "Checked out successfully"
- [ ] UI updates automatically

#### After Check-Out State
- [ ] Red square indicator visible
- [ ] Card shows "You're checked out"
- [ ] Message: "See you tomorrow!"
- [ ] No button visible (checkout complete)
- [ ] Card has red border

### 5. Test Page Refresh
- [ ] Refresh the page (F5)
- [ ] State persists correctly
- [ ] Correct indicator color shows
- [ ] Correct button state (or no button if checked out)

### 6. Test Error Scenarios

#### Location Permission Denied
- [ ] Deny location permission when prompted
- [ ] Error toast shows: "Location Required"
- [ ] Descriptive message about enabling location

#### Already Checked In (Idempotent)
- [ ] Try to check in twice
- [ ] Should succeed without error
- [ ] Returns existing record

#### Already Checked Out (Idempotent)
- [ ] Try to check out twice
- [ ] Should succeed without error
- [ ] Returns existing record

#### Check-Out Without Check-In
- [ ] Start fresh day (no check-in)
- [ ] Try to check out directly
- [ ] Should show error: "No check-in found for today"

### 7. Test Geofencing (If Enabled)

#### Setup (Admin)
1. Login as admin: `admin@workzen.com` / `password`
2. Go to "Office Location" in admin menu
3. Click "Use Current Location" or enter manually
4. Set radius (e.g., 100 meters)
5. Save location

#### Test as Employee
- [ ] Try check-in from office location
- [ ] Success with distance message: "You are 5m from office"
- [ ] Try check-in from far away
- [ ] Error: "You are 500m away. Must be within 100m"

### 8. Test Without Geofencing

#### Setup (Admin)
1. Login as admin
2. Go to "Office Location"
3. Click "Delete Location" to disable geofencing

#### Test as Employee
- [ ] Check-in works without location
- [ ] No location permission requested
- [ ] Success toast: "Checked in"
- [ ] Check-out works without location

---

## API Testing (Optional)

### Using curl or Postman

#### 1. Login to Get Token
```bash
curl -X POST http://localhost:4000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employee@workzen.com","password":"password"}'
```

Save the `accessToken` from response.

#### 2. Check-In
```bash
curl -X POST http://localhost:4000/v1/attendance/checkin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"method":"manual","location":{"lat":12.9716,"lng":77.5946}}'
```

Expected Response:
```json
{
  "record": {
    "id": "...",
    "userId": "...",
    "date": "2025-11-09T00:00:00.000Z",
    "checkIn": "2025-11-09T06:30:00.000Z",
    "checkInLocation": {"lat":12.9716,"lng":77.5946}
  },
  "distance": 5
}
```

#### 3. Check-Out
```bash
curl -X POST http://localhost:4000/v1/attendance/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"location":{"lat":12.9716,"lng":77.5946}}'
```

Expected Response:
```json
{
  "record": {
    "id": "...",
    "checkOut": "2025-11-09T15:30:00.000Z",
    "checkOutLocation": {"lat":12.9716,"lng":77.5946}
  }
}
```

#### 4. List Attendance
```bash
curl -X GET "http://localhost:4000/v1/attendance?month=2025-11" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Browser Console Testing

### Check for Errors
1. Open DevTools (F12)
2. Go to Console tab
3. Perform check-in/check-out
4. Verify no errors appear
5. Check Network tab for API calls

### Expected Console Output
```
✓ Location permission granted
✓ Location captured: {lat: 12.9716, lng: 77.5946}
✓ Check-in successful
✓ State updated
```

---

## Known Issues to Verify Fixed

- [x] Checkout API returns proper typed response
- [x] Location validation works correctly
- [x] State updates after both check-in and check-out
- [x] Visual indicators show correct colors
- [x] Button toggles between Punch In/Out
- [x] Button disappears after checkout
- [x] Error messages display properly
- [x] Idempotent operations work
- [x] Geofencing validation works
- [x] Controllers use asyncHandler

---

## Performance Checks

- [ ] Check-in completes in < 2 seconds
- [ ] Check-out completes in < 2 seconds
- [ ] Location capture completes in < 5 seconds
- [ ] Page loads in < 1 second
- [ ] No memory leaks on repeated operations
- [ ] UI remains responsive during operations

---

## Accessibility Checks

- [ ] Buttons have proper labels
- [ ] Loading states announced
- [ ] Error messages readable
- [ ] Color contrast sufficient
- [ ] Keyboard navigation works
- [ ] Screen reader compatible

---

## Mobile Testing (Optional)

- [ ] Test on mobile browser
- [ ] Location permission works on mobile
- [ ] Touch interactions work
- [ ] Responsive layout looks good
- [ ] Performance acceptable on mobile

---

## Regression Testing

- [ ] Calendar view still works
- [ ] Stats cards show correct data
- [ ] Other attendance features unaffected
- [ ] Navigation works correctly
- [ ] Logout works
- [ ] Other pages unaffected

---

## Success Criteria

✅ All test cases pass
✅ No console errors
✅ No network errors
✅ Visual indicators work correctly
✅ State management works properly
✅ Error handling works as expected
✅ Performance is acceptable
✅ User experience is smooth

---

## Reporting Issues

If you find any issues:

1. **Note the exact steps** to reproduce
2. **Check browser console** for errors
3. **Check network tab** for failed requests
4. **Note the error message** displayed to user
5. **Check backend logs** for server errors
6. **Document expected vs actual** behavior
