import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, Clock, Calendar, Plus, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const attendanceTrend = [
  { month: 'Jun', percentage: 88 },
  { month: 'Jul', percentage: 90 },
  { month: 'Aug', percentage: 89 },
  { month: 'Sep', percentage: 92 },
  { month: 'Oct', percentage: 91 },
  { month: 'Nov', percentage: 92 },
];

const departmentData = [
  { department: 'Product', count: 45 },
  { department: 'Sales', count: 38 },
  { department: 'Marketing', count: 28 },
  { department: 'Finance', count: 20 },
  { department: 'HR', count: 14 },
];

export default function HRDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">HR Dashboard</h1>
          <p className="text-muted-foreground">Employee management overview</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Employees" value={145} icon={Users} />
          <StatCard title="On Leave Today" value={8} icon={Calendar} />
          <StatCard title="Pending Leave Requests" value={12} icon={Clock} />
          <StatCard
            title="Avg Attendance"
            value="92%"
            icon={UserCheck}
            trend={{ value: 3, isPositive: true }}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Trend</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Department-wise Headcount</CardTitle>
            </CardHeader>
            <CardContent>
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
