import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, FileText, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { attendanceApi, leavesApi, profileApi } from '@/lib/api';
import { toast } from 'sonner';

export default function EmployeeDashboard() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ daysPresent: 0, leavesTaken: 0, pendingRequests: 0 });
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [leaveData, setLeaveData] = useState<any[]>([]);
  const [latestPayslip, setLatestPayslip] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      // Load attendance stats for current month
      const attendanceStats = await attendanceApi.stats({ month: currentMonth }).catch(() => ({ days: 0, hours: 0 }));
      
      // Load leaves for current month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      const leaves = await leavesApi.list({ start: startOfMonth, end: endOfMonth }).catch(() => ({ items: [] }));
      
      // Count leaves taken and pending
      const leavesTaken = leaves.items?.filter((l: any) => l.status === 'APPROVED').length || 0;
      const pendingRequests = leaves.items?.filter((l: any) => l.status === 'PENDING').length || 0;
      
      // Load leave balances from backend endpoint (remaining balances)
      const balancesResp = await leavesApi.getMyBalances().catch(() => ({ balances: { CASUAL: 0, SICK: 0, EARNED: 0 }, policy: { casualLeavesYearly: 0, sickLeavesYearly: 0, privilegeLeavesYearly: 0 } } as any));
      const leaveBalances = balancesResp.balances || { CASUAL: 0, SICK: 0, EARNED: 0 };
      const policy = balancesResp.policy || { casualLeavesYearly: 0, sickLeavesYearly: 0, privilegeLeavesYearly: 0 };
      
      setStats({
        daysPresent: attendanceStats.days,
        leavesTaken,
        pendingRequests,
      });
      
      // Generate attendance trend for last 6 months
      const attendanceTrend = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthStats = await attendanceApi.stats({ month: monthStr }).catch(() => ({ days: 0 }));
        const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        const percentage = daysInMonth > 0 ? Math.round((monthStats.days / daysInMonth) * 100) : 0;
        attendanceTrend.push({
          month: d.toLocaleString('default', { month: 'short' }),
          percentage,
        });
      }
      setAttendanceData(attendanceTrend);
      
      // Generate leave distribution (remaining balances)
      const leaveTypes = [
        { name: 'Casual', value: leaveBalances.CASUAL || 0, total: policy.casualLeavesYearly || 0, color: 'hsl(var(--primary))' },
        { name: 'Sick', value: leaveBalances.SICK || 0, total: policy.sickLeavesYearly || 0, color: 'hsl(var(--chart-2))' },
        { name: 'Earned', value: leaveBalances.EARNED || 0, total: policy.privilegeLeavesYearly || 0, color: 'hsl(var(--chart-3))' },
      ];
      setLeaveData(leaveTypes);
      
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
          <p className="text-muted-foreground">Your personal overview</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Days Present" value={loading ? '...' : stats.daysPresent} icon={Clock} subtitle="This month" />
          <StatCard title="Leaves Taken" value={loading ? '...' : stats.leavesTaken} icon={Calendar} subtitle="This month" />
          <StatCard title="Pending Requests" value={loading ? '...' : stats.pendingRequests} icon={FileText} />
          <StatCard
            title="Net Pay"
            value={loading ? '...' : latestPayslip ? `₹${latestPayslip.net}` : 'N/A'}
            icon={DollarSign}
            subtitle="Last month"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Trend (6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[250px]">Loading...</div>
              ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="percentage" stroke="hsl(var(--primary))" strokeWidth={2} name="Attendance %" />
                </LineChart>
              </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Leave Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[250px]">Loading...</div>
              ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={leaveData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.name}: ${entry.value}/${entry.total || 0}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {leaveData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Button asChild variant="outline" className="h-auto flex-col py-6">
              <Link to="/employee/attendance">
                <Clock className="mb-2 h-8 w-8 text-primary" />
                <span className="font-semibold">Mark Attendance</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col py-6">
              <Link to="/employee/leaves">
                <Calendar className="mb-2 h-8 w-8 text-primary" />
                <span className="font-semibold">Apply Leave</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col py-6">
              <Link to="/employee/payslips">
                <FileText className="mb-2 h-8 w-8 text-primary" />
                <span className="font-semibold">View Payslip</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
