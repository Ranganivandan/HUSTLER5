# Visual Guide - Attendance Status Indicator

## Top Bar Status Indicator (Top-Right Corner)

### State 1: Not Checked In
```
┌─────────────────────────────────────────────────────────────┐
│  Welcome back, John Doe          🔔  ⚪ Not Checked In  👤 │
└─────────────────────────────────────────────────────────────┘
```
- **Indicator**: Gray circle (⚪)
- **Text**: "Not Checked In"
- **When**: Employee hasn't checked in today

---

### State 2: Checked In (Online)
```
┌─────────────────────────────────────────────────────────────┐
│  Welcome back, John Doe          🔔  🟢 Online  👤         │
└─────────────────────────────────────────────────────────────┘
```
- **Indicator**: Green pulsing circle (🟢 with animation)
- **Text**: "Online"
- **When**: Employee is currently checked in and working
- **Animation**: Gentle pulse effect to draw attention

---

### State 3: Checked Out (Offline)
```
┌─────────────────────────────────────────────────────────────┐
│  Welcome back, John Doe          🔔  🔴 Offline  👤        │
└─────────────────────────────────────────────────────────────┘
```
- **Indicator**: Red circle (🔴)
- **Text**: "Offline"
- **When**: Employee has checked out for the day

---

## Attendance Page - Card States

### State 1: Not Checked In
```
┌────────────────────────────────────────────────────────┐
│  ⬜  Mark Today's Attendance                           │
│                                                        │
│     Location will be verified                         │
│                                                        │
│                                    [ 🕐 Punch In ]    │
└────────────────────────────────────────────────────────┘
```
- **Border**: Primary/Blue
- **Square**: Gray (⬜)
- **Button**: "Punch In" (primary variant)
- **Message**: "Mark Today's Attendance"

---

### State 2: Checked In
```
┌────────────────────────────────────────────────────────┐
│  🟩  You're checked in                                 │
│                                                        │
│     Location will be verified on checkout             │
│                                                        │
│                                   [ 🕐 Punch Out ]    │
└────────────────────────────────────────────────────────┘
```
- **Border**: Green
- **Square**: Green (🟩)
- **Button**: "Punch Out" (outline variant)
- **Message**: "You're checked in"

---

### State 3: Checked Out
```
┌────────────────────────────────────────────────────────┐
│  🟥  You're checked out                                │
│                                                        │
│     See you tomorrow!                                 │
│                                                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```
- **Border**: Red
- **Square**: Red (🟥)
- **Button**: None (hidden)
- **Message**: "You're checked out" + "See you tomorrow!"

---

## Complete User Flow Visualization

### Morning Flow
```
1. Login
   ↓
2. Dashboard loads
   Top Bar: ⚪ Not Checked In
   ↓
3. Go to Attendance
   Card: ⬜ + [Punch In]
   ↓
4. Click "Punch In"
   Loading: "Getting Location..."
   ↓
5. Success!
   Top Bar: 🟢 Online (pulsing)
   Card: 🟩 + [Punch Out]
   Toast: "Checked in successfully"
```

### Evening Flow
```
1. On Attendance Page
   Top Bar: 🟢 Online
   Card: 🟩 + [Punch Out]
   ↓
2. Click "Punch Out"
   Loading: "Getting Location..."
   ↓
3. Success!
   Top Bar: 🔴 Offline
   Card: 🟥 + No button
   Toast: "Checked out successfully"
```

---

## Color Coding System

### Green (Success/Active)
- ✅ Checked in status
- ✅ Online indicator
- ✅ Active work session
- ✅ Available for work

### Red (Complete/Inactive)
- 🔴 Checked out status
- 🔴 Offline indicator
- 🔴 Work session ended
- 🔴 Not available

### Gray (Neutral/Pending)
- ⚪ Not checked in
- ⚪ Waiting for action
- ⚪ No status yet

---

## Responsive Design

### Desktop (1920px)
```
┌──────────────────────────────────────────────────────────────────┐
│  ☰  Welcome back, John Doe        🔔  🟢 Online  👤            │
└──────────────────────────────────────────────────────────────────┘
```

### Tablet (768px)
```
┌────────────────────────────────────────────────┐
│  ☰  Welcome back, John    🔔  🟢 Online  👤  │
└────────────────────────────────────────────────┘
```

### Mobile (375px)
```
┌──────────────────────────────────┐
│  ☰  John    🔔  🟢 Online  👤  │
└──────────────────────────────────┘
```

---

## Animation Details

### Pulse Animation (Green Dot)
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```
- **Duration**: 2 seconds
- **Timing**: Ease-in-out
- **Infinite**: Yes
- **Purpose**: Draw attention to online status

### Transition Effects
- **Status change**: 200ms ease
- **Color change**: 300ms ease
- **Button toggle**: Instant (no animation)

---

## Accessibility Features

### Screen Reader Announcements
```
Not Checked In: "Attendance status: Not checked in"
Online: "Attendance status: Online, currently working"
Offline: "Attendance status: Offline, checked out"
```

### Keyboard Navigation
- Tab to status indicator: Focusable
- Tab to Punch In/Out button: Focusable
- Enter/Space: Activate button
- ESC: Close any modals

### Color Contrast
- Green on muted background: 4.5:1 ratio ✅
- Red on muted background: 4.5:1 ratio ✅
- Gray on muted background: 4.5:1 ratio ✅
- Text on background: 7:1 ratio ✅

---

## Toast Notifications

### Check-In Success
```
┌─────────────────────────────────────┐
│  ✓  Checked in successfully        │
│     You are 5m from office         │
└─────────────────────────────────────┘
```

### Check-Out Success
```
┌─────────────────────────────────────┐
│  ✓  Checked out successfully       │
└─────────────────────────────────────┘
```

### Location Error
```
┌─────────────────────────────────────┐
│  ⚠  Location Required               │
│     Please enable location access  │
└─────────────────────────────────────┘
```

### Geofencing Error
```
┌─────────────────────────────────────────────────┐
│  ⚠  Check-in failed                            │
│     You are 150m away. Must be within 100m    │
└─────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
App
├── AuthProvider
│   └── AttendanceStatusProvider ← Global status
│       ├── DashboardLayout
│       │   ├── TopBar ← Status indicator here
│       │   │   ├── Status Badge (🟢/🔴/⚪)
│       │   │   ├── Notifications
│       │   │   └── User Menu
│       │   └── Main Content
│       │       └── Attendance Page
│       │           ├── Status Card (⬜/🟩/🟥)
│       │           ├── Toggle Button
│       │           └── Calendar
│       └── Other Pages
```

---

## State Management Flow

```
User Action (Punch In/Out)
         ↓
API Call (attendanceApi.checkin/checkout)
         ↓
Update Global Context (setStatus)
         ↓
React Re-renders
         ↓
Top Bar Updates (🟢/🔴/⚪)
         ↓
Attendance Card Updates (⬜/🟩/🟥)
         ↓
Toast Notification
```

---

## Testing Visual Checklist

### Top Bar
- [ ] Gray dot visible when not checked in
- [ ] Green dot visible when checked in
- [ ] Green dot has pulse animation
- [ ] Red dot visible when checked out
- [ ] Text matches dot color
- [ ] Badge has rounded background
- [ ] Only visible for employees

### Attendance Card
- [ ] Gray square when not checked in
- [ ] Green square when checked in
- [ ] Red square when checked out
- [ ] Border color matches square color
- [ ] Button text toggles correctly
- [ ] Button disappears after checkout
- [ ] Messages are contextual

### Animations
- [ ] Pulse animation smooth
- [ ] Color transitions smooth
- [ ] No jarring changes
- [ ] Loading states clear

### Responsiveness
- [ ] Works on desktop (1920px)
- [ ] Works on laptop (1366px)
- [ ] Works on tablet (768px)
- [ ] Works on mobile (375px)
- [ ] Text doesn't overflow
- [ ] Buttons remain clickable

---

## Browser DevTools Inspection

### Check Status in React DevTools
```
AttendanceStatusContext
  ├── status: "checked-in"
  ├── setStatus: function
  ├── refreshStatus: function
  └── loading: false
```

### Check DOM Elements
```html
<!-- Top Bar Status -->
<div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
  <div class="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
  <span class="text-xs font-medium">Online</span>
</div>

<!-- Attendance Card Square -->
<div class="w-4 h-4 rounded bg-green-500"></div>
```

---

## Summary

✅ **Clear visual hierarchy** with color-coded states
✅ **Consistent design language** across components
✅ **Smooth animations** for better UX
✅ **Responsive layout** for all devices
✅ **Accessible** with proper contrast and labels
✅ **Intuitive** status indicators
✅ **Real-time updates** across the app

The visual design provides instant feedback and clear status communication to users!
