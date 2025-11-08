import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AttendanceCalendar } from '@/components/employee/AttendanceCalendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, TrendingUp, Calendar as CalendarIcon } from 'lucide-react';

// Mock data
const mockAttendance = [
  { date: '2025-11-01', status: 'present' as const, inTime: '09:15 AM', outTime: '06:30 PM', hours: 9.25 },
  { date: '2025-11-02', status: 'present' as const, inTime: '09:00 AM', outTime: '06:15 PM', hours: 9.25 },
  { date: '2025-11-03', status: 'present' as const, inTime: '09:30 AM', outTime: '06:45 PM', hours: 9.25 },
  { date: '2025-11-04', status: 'leave' as const },
  { date: '2025-11-05', status: 'leave' as const },
  { date: '2025-11-06', status: 'present' as const, inTime: '09:10 AM', outTime: '06:20 PM', hours: 9.17 },
  { date: '2025-11-07', status: 'present' as const, inTime: '09:05 AM', outTime: '06:25 PM', hours: 9.33 },
  { date: '2025-11-08', status: 'holiday' as const },
];

export default function Attendance() {
  const [hasMarkedToday] = useState(false);

  const totalWorkingDays = 22;
  const presentDays = mockAttendance.filter(a => a.status === 'present').length;
  const absentDays = 0; // No absent days in mock data
  const leaveDays = mockAttendance.filter(a => a.status === 'leave').length;
  const attendancePercentage = ((presentDays / totalWorkingDays) * 100).toFixed(1);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Attendance</h1>
          <p className="text-muted-foreground">Track your daily attendance and hours</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Working Days</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWorkingDays}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present Days</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{presentDays}</div>
              <p className="text-xs text-muted-foreground">Days attended</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent/Leave</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{absentDays + leaveDays}</div>
              <p className="text-xs text-muted-foreground">{absentDays} absent, {leaveDays} leave</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance %</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{attendancePercentage}%</div>
              <p className="text-xs text-muted-foreground">Monthly average</p>
            </CardContent>
          </Card>
        </div>

        {/* Mark Attendance */}
        {!hasMarkedToday && (
          <Card className="border-primary/50">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <h3 className="font-semibold">Mark Today's Attendance</h3>
                <p className="text-sm text-muted-foreground">Don't forget to punch in!</p>
              </div>
              <Button>
                <Clock className="mr-2 h-4 w-4" />
                Punch In
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Calendar */}
        <AttendanceCalendar attendance={mockAttendance} />
      </div>
    </DashboardLayout>
  );
}
