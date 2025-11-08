import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, Clock, Calendar, Plus, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { analyticsApi, profileApi } from '@/lib/api';
import { toast } from 'sonner';

export default function HRDashboard() {
  const [kpis, setKpis] = useState({ totalEmployees: 0, presentToday: 0, onLeaveToday: 0, pendingLeaveRequests: 0, avgAttendance: 0 });
  const [loading, setLoading] = useState(false);
  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);
  const [departmentData, setDepartmentData] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await analyticsApi.overview();
      setKpis(data);
      
      // Load attendance trend for last 6 months
      const now = new Date();
      const trend = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        try {
          const monthData = await analyticsApi.attendance(monthStr);
          const totalDays = monthData.reduce((sum: number, day: any) => sum + day.present + day.absent, 0) || 1;
          const presentDays = monthData.reduce((sum: number, day: any) => sum + day.present, 0) || 0;
          const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
          trend.push({
            month: d.toLocaleString('default', { month: 'short' }),
            percentage,
          });
        } catch {
          trend.push({
            month: d.toLocaleString('default', { month: 'short' }),
            percentage: 0,
          });
        }
      }
      setAttendanceTrend(trend);
      
      // Load department-wise headcount
      try {
        const profiles = await profileApi.list({ page: 1, limit: 1000 });
        const deptMap = new Map<string, number>();
        profiles.items?.forEach((p: any) => {
          const dept = p.department || 'Unassigned';
          deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
        });
        const deptData = Array.from(deptMap.entries())
          .map(([department, count]) => ({ department, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setDepartmentData(deptData);
      } catch {
        setDepartmentData([]);
      }
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
          <h1 className="text-3xl font-bold text-foreground">HR Dashboard</h1>
          <p className="text-muted-foreground">Employee management overview</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Employees" value={loading ? '...' : kpis.totalEmployees} icon={Users} />
          <StatCard title="On Leave Today" value={loading ? '...' : kpis.onLeaveToday} icon={Calendar} />
          <StatCard title="Pending Leave Requests" value={loading ? '...' : kpis.pendingLeaveRequests} icon={Clock} />
          <StatCard
            title="Avg Attendance"
            value={loading ? '...' : `${kpis.avgAttendance}%`}
            icon={UserCheck}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[250px]">Loading...</div>
              ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={attendanceTrend}>
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
              <CardTitle>Department-wise Headcount</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[250px]">Loading...</div>
              ) : departmentData.length === 0 ? (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">No department data</div>
              ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="hsl(var(--primary))" name="Employees" />
                </BarChart>
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
              <Link to="/hr/employees">
                <Plus className="mb-2 h-8 w-8 text-primary" />
                <span className="font-semibold">Add New Employee</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col py-6">
              <Link to="/hr/leaves">
                <CheckCircle className="mb-2 h-8 w-8 text-primary" />
                <span className="font-semibold">Approve Leaves</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col py-6">
              <Link to="/hr/attendance">
                <Clock className="mb-2 h-8 w-8 text-primary" />
                <span className="font-semibold">Attendance Summary</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
