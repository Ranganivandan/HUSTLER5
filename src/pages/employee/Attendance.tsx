import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Clock, TrendingUp } from 'lucide-react';
import { attendanceApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AttendanceCalendar } from '@/components/employee/AttendanceCalendar';

type ViewAttendance = { date: string; status: 'present'|'absent'|'leave'|'holiday'; inTime?: string; outTime?: string; hours?: number };

export default function Attendance() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<ViewAttendance[]>([]);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [hasMarkedToday, setHasMarkedToday] = useState(false);
  const { toast } = useToast();

  const monthStr = new Date().toISOString().slice(0, 7); // YYYY-MM

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const [list, stat] = await Promise.all([
          attendanceApi.list({ month: monthStr }),
          attendanceApi.stats({ month: monthStr }),
        ]);
        if (ignore) return;
        const mapped: ViewAttendance[] = list.map((r) => {
          const inTime = r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined;
          const outTime = r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined;
          let hrs: number | undefined;
          if (r.checkIn && r.checkOut) {
            const ms = new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime();
            hrs = Number((ms / (1000 * 60 * 60)).toFixed(2));
          }
          return { date: r.date.slice(0, 10), status: 'present', inTime, outTime, hours: hrs };
        });
        setRecords(mapped);
        setDays(stat.days);
        setHours(stat.hours);
        const today = new Date().toISOString().slice(0, 10);
        setHasMarkedToday(mapped.some((m) => m.date === today && !!m.inTime));
      } catch (e) {
        toast({ title: 'Failed to load attendance', description: e instanceof Error ? e.message : 'Error', variant: 'destructive' });
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [monthStr, toast]);

  const handleCheckin = async () => {
    try {
      await attendanceApi.checkin({ method: 'manual' });
      toast({ title: 'Checked in' });
      // Refresh
      const list = await attendanceApi.list({ month: monthStr });
      const mapped: ViewAttendance[] = list.map((r) => {
        const inTime = r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined;
        const outTime = r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined;
        let hrs: number | undefined;
        if (r.checkIn && r.checkOut) {
          const ms = new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime();
          hrs = Number((ms / (1000 * 60 * 60)).toFixed(2));
        }
        return { date: r.date.slice(0, 10), status: 'present', inTime, outTime, hours: hrs };
      });
      setRecords(mapped);
      const today = new Date().toISOString().slice(0, 10);
      setHasMarkedToday(mapped.some((m) => m.date === today && !!m.inTime));
    } catch (e) {
      toast({ title: 'Check-in failed', description: e instanceof Error ? e.message : 'Error', variant: 'destructive' });
    }
  };

  const handleCheckout = async () => {
    try {
      await attendanceApi.checkout();
      toast({ title: 'Checked out' });
      // Refresh
      const list = await attendanceApi.list({ month: monthStr });
      const mapped: ViewAttendance[] = list.map((r) => {
        const inTime = r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined;
        const outTime = r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined;
        let hrs: number | undefined;
        if (r.checkIn && r.checkOut) {
          const ms = new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime();
          hrs = Number((ms / (1000 * 60 * 60)).toFixed(2));
        }
        return { date: r.date.slice(0, 10), status: 'present', inTime, outTime, hours: hrs };
      });
      setRecords(mapped);
    } catch (e) {
      toast({ title: 'Checkout failed', description: e instanceof Error ? e.message : 'Error', variant: 'destructive' });
    }
  };

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
              <div className="text-2xl font-bold">{records.length}</div>
              <p className="text-xs text-muted-foreground">Recorded days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present Days</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{days}</div>
              <p className="text-xs text-muted-foreground">Days attended (from stats)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent/Leave</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">-</div>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance %</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{records.length ? Math.min(100, Math.round((days / records.length) * 100)) : 0}%</div>
              <p className="text-xs text-muted-foreground">Approximation</p>
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
              <Button onClick={handleCheckin} disabled={loading}>
                <Clock className="mr-2 h-4 w-4" />
                Punch In
              </Button>
            </CardContent>
          </Card>
        )}
        {hasMarkedToday && (
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <h3 className="font-semibold">You're checked in</h3>
                <p className="text-sm text-muted-foreground">Remember to punch out at end of day</p>
              </div>
              <Button variant="outline" onClick={handleCheckout} disabled={loading}>
                <Clock className="mr-2 h-4 w-4" />
                Punch Out
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Calendar */}
        <AttendanceCalendar attendance={records} />
      </div>
    </DashboardLayout>
  );
}
