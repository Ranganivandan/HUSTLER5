import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, FileText, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const attendanceData = [
  { month: 'Jun', percentage: 85 },
  { month: 'Jul', percentage: 90 },
  { month: 'Aug', percentage: 88 },
  { month: 'Sep', percentage: 92 },
  { month: 'Oct', percentage: 89 },
  { month: 'Nov', percentage: 87 },
];

const leaveData = [
  { name: 'Casual', value: 2, color: 'hsl(var(--primary))' },
  { name: 'Sick', value: 1, color: 'hsl(var(--chart-2))' },
  { name: 'Privilege', value: 0, color: 'hsl(var(--chart-3))' },
];

export default function EmployeeDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
          <p className="text-muted-foreground">Your personal overview</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Days Present" value={18} icon={Clock} subtitle="This month" />
          <StatCard title="Leaves Taken" value={2} icon={Calendar} subtitle="This month" />
          <StatCard title="Pending Requests" value={1} icon={FileText} />
          <StatCard
            title="Net Pay"
            value="₹73,500"
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Leave Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={leaveData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
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
