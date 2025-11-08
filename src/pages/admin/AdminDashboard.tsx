import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AnalyticsCard } from '@/components/admin/AnalyticsCard';
import { LineChartCard } from '@/components/admin/LineChartCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Building2, DollarSign, TrendingUp, Clock, Calendar, Plus, FileText, UserPlus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import { analyticsApi, usersApi, adminApi } from '@/lib/api';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState({ totalEmployees: 0, presentToday: 0, onLeaveToday: 0, pendingLeaveRequests: 0, avgAttendance: 0 });
  const [totalUsers, setTotalUsers] = useState(0);
  const [recentAuditLogs, setRecentAuditLogs] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [analyticsData, usersData, auditData] = await Promise.all([
        analyticsApi.overview().catch(() => ({ totalEmployees: 0, presentToday: 0, onLeaveToday: 0, pendingLeaveRequests: 0, avgAttendance: 0 })),
        usersApi.list({ page: 1, limit: 1 }).catch(() => ({ items: [], total: 0 })),
        adminApi.auditLogs({ page: 1, limit: 5 }).catch(() => ({ items: [], total: 0 })),
      ]);
      setKpis(analyticsData);
      setTotalUsers(usersData.total);
      setRecentAuditLogs(auditData.items);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const sparklineData = [
    { value: 140 },
    { value: 142 },
    { value: 145 },
    { value: 148 },
    { value: 150 },
    { value: 152 },
  ];

  const employeeGrowthData = [
    { month: 'May', employees: 120 },
    { month: 'Jun', employees: 128 },
    { month: 'Jul', employees: 135 },
    { month: 'Aug', employees: 140 },
    { month: 'Sep', employees: 145 },
    { month: 'Oct', employees: 152 },
  ];

  const payrollTrendData = [
    { month: 'May', gross: 8500000, net: 7200000 },
    { month: 'Jun', gross: 8800000, net: 7450000 },
    { month: 'Jul', gross: 9200000, net: 7800000 },
    { month: 'Aug', gross: 9500000, net: 8050000 },
    { month: 'Sep', gross: 9800000, net: 8300000 },
    { month: 'Oct', gross: 10200000, net: 8650000 },
  ];

  const departmentPerformanceData = [
    { department: 'Engineering', performance: 8.9 },
    { department: 'Sales', performance: 8.5 },
    { department: 'Marketing', performance: 8.7 },
    { department: 'Operations', performance: 8.3 },
    { department: 'Finance', performance: 8.6 },
  ];

  const attendanceData = [
    { status: 'Present', value: 85, color: 'hsl(var(--chart-1))' },
    { status: 'Leave', value: 10, color: 'hsl(var(--chart-2))' },
    { status: 'Absent', value: 5, color: 'hsl(var(--chart-3))' },
  ];

  const topPerformers = [
    { name: 'Asha Patel', score: 9.5, department: 'Engineering' },
    { name: 'Rajesh Kumar', score: 9.3, department: 'Sales' },
    { name: 'Priya Sharma', score: 9.1, department: 'Marketing' },
    { name: 'Amit Singh', score: 9.0, department: 'Operations' },
    { name: 'Neha Gupta', score: 8.9, department: 'Engineering' },
  ];

  const recentActivities = recentAuditLogs.map((log) => {
    const timeAgo = new Date(log.createdAt).toLocaleString();
    return {
      time: timeAgo,
      user: log.user?.name || 'System',
      action: `${log.action} ${log.entity || ''} ${log.entityId || ''}`.trim(),
    };
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome, Admin 👋</h1>
            <p className="text-muted-foreground">Company overview and analytics</p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/users">
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnalyticsCard
            title="Total Employees"
            value={loading ? '...' : kpis.totalEmployees}
            icon={Users}
            sparklineData={sparklineData}
          />
          <AnalyticsCard
            title="Total Users"
            value={loading ? '...' : totalUsers}
            icon={Building2}
          />
          <AnalyticsCard
            title="Present Today"
            value={loading ? '...' : kpis.presentToday}
            icon={UserPlus}
          />
          <AnalyticsCard
            title="On Leave Today"
            value={loading ? '...' : kpis.onLeaveToday}
            icon={Calendar}
          />
          <AnalyticsCard
            title="Avg Attendance"
            value={loading ? '...' : `${kpis.avgAttendance}%`}
            icon={Clock}
          />
          <AnalyticsCard
            title="Pending Leave Requests"
            value={loading ? '...' : kpis.pendingLeaveRequests}
            icon={Calendar}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <LineChartCard
            title="Employee Growth Trend"
            data={employeeGrowthData}
            dataKeys={[{ key: 'employees', color: 'hsl(var(--primary))', name: 'Employees' }]}
            xAxisKey="month"
          />

          <LineChartCard
            title="Payroll Cost Trend"
            data={payrollTrendData}
            dataKeys={[
              { key: 'gross', color: 'hsl(var(--chart-1))', name: 'Gross Pay' },
              { key: 'net', color: 'hsl(var(--chart-2))', name: 'Net Pay' },
            ]}
            xAxisKey="month"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Department Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="department" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 10]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="performance" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attendance Distribution (Current Month)</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, value }) => `${status}: ${value}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPerformers.map((performer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{performer.name}</p>
                        <p className="text-sm text-muted-foreground">{performer.department}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{performer.score}/10</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : recentActivities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                ) : recentActivities.map((activity, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.user} • {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Company Performance Summary</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Overall company performance has improved by 12% this quarter due to higher attendance and lower attrition.
                </p>
                <div className="flex gap-6 mt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Attrition Rate</p>
                    <p className="text-xl font-bold">2.3%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">New Joinees</p>
                    <p className="text-xl font-bold">8</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Leaves Utilized</p>
                    <p className="text-xl font-bold">67%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Bonus</p>
                    <p className="text-xl font-bold">8.5%</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link to="/admin/users">
            <Button variant="outline" className="w-full h-20 flex-col gap-2">
              <Plus className="h-5 w-5" />
              <span>Add New User</span>
            </Button>
          </Link>
          <Link to="/hr/employees">
            <Button variant="outline" className="w-full h-20 flex-col gap-2">
              <Users className="h-5 w-5" />
              <span>View All Departments</span>
            </Button>
          </Link>
          <Link to="/admin/reports">
            <Button variant="outline" className="w-full h-20 flex-col gap-2">
              <FileText className="h-5 w-5" />
              <span>Generate Report</span>
            </Button>
          </Link>
          <Link to="/payroll/dashboard">
            <Button variant="outline" className="w-full h-20 flex-col gap-2">
              <DollarSign className="h-5 w-5" />
              <span>Payroll Summary</span>
            </Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
