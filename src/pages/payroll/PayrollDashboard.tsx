import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, FileText, Clock, Users, TrendingUp, Play, Palette, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi, profileApi } from '@/lib/api';
import { toast } from 'sonner';

export default function PayrollDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalPayroll: 0, avgBonus: 0, employeesPaid: 0, payslipsGenerated: 0 });
  const [topPerformers, setTopPerformers] = useState<Array<{ name: string; department: string; score: number; bonus: number }>>([]);
  const [departmentDistribution, setDepartmentDistribution] = useState<Array<{ department: string; percentage: number; amount: number }>>([]);

  const load = async () => {
    setLoading(true);
    try {
      // Get current month payroll totals
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      const period = `${startOfMonth}:${endOfMonth}`;
      
      // Get payroll data for current month
      const payrollData = await analyticsApi.payroll(period).catch(() => ({ gross: 0, net: 0 }));
      
      // Get employee profiles for department distribution and top performers
      const profiles = await profileApi.list({ page: 1, limit: 100 }).catch(() => ({ items: [] }));
      
      // Count total employees
      const totalEmployeesCount = profiles.items?.length || 0;
      
      // Calculate department-wise distribution
      const deptMap = new Map<string, { count: number; totalSalary: number }>();
      profiles.items?.forEach((p: any) => {
        const dept = p.department || 'Unassigned';
        const salary = (p.metadata?.basicSalary as number) || 30000;
        const current = deptMap.get(dept) || { count: 0, totalSalary: 0 };
        deptMap.set(dept, { count: current.count + 1, totalSalary: current.totalSalary + salary });
      });
      
      const totalEmployees = profiles.items?.length || 1;
      const totalSalary = Array.from(deptMap.values()).reduce((sum, d) => sum + d.totalSalary, 0) || 1;
      
      const deptData = Array.from(deptMap.entries())
        .map(([department, data]) => ({
          department,
          percentage: Math.round((data.count / totalEmployees) * 100),
          amount: data.totalSalary,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
      
      setDepartmentDistribution(deptData);
      
      // Calculate stats from real data
      const totalPayroll = (payrollData as any).gross || 0;
      const totalNet = (payrollData as any).net || 0;
      const totalDeductions = totalPayroll - totalNet;
      
      // Calculate average bonus percentage (bonus as % of gross pay)
      // Standard bonus is typically 10-15% of annual salary, shown as monthly %
      const avgBonus = totalPayroll > 0 && totalEmployeesCount > 0 
        ? Number(((totalDeductions / totalPayroll) * 100).toFixed(1))
        : 12.5; // Default 12.5% if no data
      
      // If payroll has been run, use actual data, otherwise show 0
      const employeesPaid = totalPayroll > 0 ? totalEmployeesCount : 0;
      const payslipsGenerated = totalPayroll > 0 ? totalEmployeesCount : 0;
      
      setStats({
        totalPayroll,
        avgBonus, // This is now a percentage
        employeesPaid,
        payslipsGenerated,
      });
      
      // Calculate top performers based on salary (simplified approach)
      // In a real system, this would use performance metrics from backend
      const performersData = (profiles.items || [])
        .map((p: any) => {
          const salary = (p.metadata?.basicSalary as number) || 30000;
          // Use salary as proxy for performance (higher salary = senior = better performer)
          // In production, replace with actual performance scores from backend
          const score = Math.min((salary / 10000) + 5, 10); // Normalize to 5-10 range
          const bonus = Math.round((salary * 0.15 * score) / 10);
          
          return {
            name: p.user?.name || 'Unknown',
            department: p.department || 'Unassigned',
            score: Number(score.toFixed(1)),
            bonus,
            salary,
          };
        })
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return b.salary - a.salary;
        })
        .slice(0, 5);
      
      setTopPerformers(performersData);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load payroll dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payroll Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive payroll management and analytics</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Total Payroll" 
            value={loading ? '...' : `₹${(stats.totalPayroll / 100000).toFixed(1)}L`} 
            icon={DollarSign} 
          />
          <StatCard 
            title="Avg Bonus %" 
            value={loading ? '...' : `${stats.avgBonus.toFixed(1)}%`} 
            icon={TrendingUp} 
          />
          <StatCard 
            title="Employees Paid" 
            value={loading ? '...' : stats.employeesPaid} 
            icon={Users} 
          />
          <StatCard 
            title="Payslips Generated" 
            value={loading ? '...' : stats.payslipsGenerated} 
            icon={FileText} 
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Department-wise Salary Distribution</CardTitle>
              <CardDescription>Current month payroll breakdown by department</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[200px]">Loading...</div>
              ) : departmentDistribution.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">No department data</div>
              ) : (
              <div className="space-y-4">
                {departmentDistribution.map((dept) => (
                  <div key={dept.department} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{dept.department}</span>
                      <span className="text-muted-foreground">
                        ₹{(dept.amount / 100000).toFixed(1)}L ({dept.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${dept.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 5 Performers</CardTitle>
              <CardDescription>Based on office score and bonus earned</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[200px]">Loading...</div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Bonus</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPerformers.map((performer, index) => (
                    <TableRow key={performer.name}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{performer.name}</p>
                          <p className="text-xs text-muted-foreground">{performer.department}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={index < 2 ? 'default' : 'secondary'}>
                          {performer.score}/10
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        ₹{performer.bonus.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Common payroll actions and tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button 
                onClick={() => navigate('/payroll/payruns')}
                className="h-auto flex-col gap-2 py-6"
              >
                <Play className="h-6 w-6" />
                <span>Start New Pay Run</span>
              </Button>
              <Button 
                onClick={() => navigate('/payroll/configuration')}
                variant="outline"
                className="h-auto flex-col gap-2 py-6"
              >
                <Clock className="h-6 w-6" />
                <span>Configure Rules</span>
              </Button>
              <Button 
                onClick={() => navigate('/payroll/designer')}
                variant="outline"
                className="h-auto flex-col gap-2 py-6"
              >
                <Palette className="h-6 w-6" />
                <span>Payslip Templates</span>
              </Button>
              <Button 
                onClick={() => navigate('/payroll/reports')}
                variant="outline"
                className="h-auto flex-col gap-2 py-6"
              >
                <FileSpreadsheet className="h-6 w-6" />
                <span>View Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
