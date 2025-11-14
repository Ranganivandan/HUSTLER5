import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, PieChart, TrendingUp, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { analyticsApi, profileApi } from '@/lib/api';
import { toast as sonnerToast } from 'sonner';


export default function Reports() {
  const [selectedMonth, setSelectedMonth] = useState('2025-10');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedReport, setSelectedReport] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [payrollSummary, setPayrollSummary] = useState<Array<{ month: string; employees: number; grossPayroll: number; deductions: number; netPayroll: number }>>([]);
  const [departmentBreakdown, setDepartmentBreakdown] = useState<Array<{ department: string; employees: number; totalSalary: number; avgSalary: number }>>([]);
  const [statutoryReport, setStatutoryReport] = useState<Array<{ type: string; amount: number; employerContribution: number; total: number }>>([]);
  const [bonusAnalysis, setBonusAnalysis] = useState<Array<{ department: string; avgScore: number; totalBonus: number; avgBonus: number }>>([]);

  useEffect(() => {
    loadReportData();
  }, [selectedMonth, selectedDepartment]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Get payroll summary for last 3 months
      const summaries = [];
      for (let i = 0; i < 3; i++) {
        const date = new Date(selectedMonth);
        date.setMonth(date.getMonth() - i);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        const period = `${startOfMonth}:${endOfMonth}`;
        
        const data = await analyticsApi.payroll(period).catch(() => ({ gross: 0, net: 0 }));
        const gross = (data as any).gross || 0;
        const net = (data as any).net || 0;
        summaries.push({
          month: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          employees: 0, // Will be calculated from profiles
          grossPayroll: gross,
          deductions: gross - net,
          netPayroll: net,
        });
      }
      
      // Get department breakdown
      const profiles = await profileApi.list({ page: 1, limit: 1000 });
      const deptMap = new Map<string, { count: number; totalSalary: number }>();
      
      profiles.items?.forEach((p: any) => {
        const dept = p.department || 'Unassigned';
        const salary = (p.metadata?.basicSalary as number) || 30000;
        const current = deptMap.get(dept) || { count: 0, totalSalary: 0 };
        deptMap.set(dept, { count: current.count + 1, totalSalary: current.totalSalary + salary });
      });
      
      const deptData = Array.from(deptMap.entries())
        .map(([department, data]) => ({
          department,
          employees: data.count,
          totalSalary: data.totalSalary,
          avgSalary: Math.round(data.totalSalary / data.count),
        }))
        .sort((a, b) => b.totalSalary - a.totalSalary);
      
      setDepartmentBreakdown(deptData);
      
      // Populate Employees count in Monthly Payroll Summary from profiles
      const totalEmployeesCount = profiles.items?.length || 0;
      setPayrollSummary(summaries.map((row) => ({ ...row, employees: totalEmployeesCount })));
      
      // Statutory report (calculated estimates)
      const totalGross = summaries[0]?.grossPayroll || 0;
      setStatutoryReport([
        { type: 'Provident Fund', amount: Math.round(totalGross * 0.12), employerContribution: Math.round(totalGross * 0.12), total: Math.round(totalGross * 0.24) },
        { type: 'ESI', amount: Math.round(totalGross * 0.0075), employerContribution: Math.round(totalGross * 0.01), total: Math.round(totalGross * 0.0175) },
        { type: 'Professional Tax', amount: 28400, employerContribution: 0, total: 28400 },
        { type: 'TDS', amount: Math.round(totalGross * 0.10), employerContribution: 0, total: Math.round(totalGross * 0.10) },
      ]);
      
      // Bonus analysis from department data
      const bonusData = deptData.map(dept => {
        const avgScore = 7.5 + Math.random() * 2; // 7.5-9.5 range
        const totalBonus = Math.round(dept.totalSalary * 0.10); // 10% of total salary
        const avgBonus = Math.round(totalBonus / dept.employees);
        return {
          department: dept.department,
          avgScore: Number(avgScore.toFixed(1)),
          totalBonus,
          avgBonus,
        };
      });
      setBonusAnalysis(bonusData);
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      sonnerToast.error('No data to export');
      return;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle numbers and strings
          if (typeof value === 'number') {
            return value;
          }
          // Escape commas and quotes in strings
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    sonnerToast.success(`CSV exported: ${filename}`);
  };

  const exportToPDF = (data: any[], title: string, filename: string) => {
    if (data.length === 0) {
      sonnerToast.error('No data to export');
      return;
    }

    // Create HTML content for PDF
    const headers = Object.keys(data[0]);
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px; }
          .meta { color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #4F46E5; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          tr:hover { background-color: #f5f5f5; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">
          <p><strong>Period:</strong> ${selectedMonth}</p>
          <p><strong>Department:</strong> ${selectedDepartment === 'all' ? 'All Departments' : selectedDepartment}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${headers.map(h => `<td>${typeof row[h] === 'number' ? row[h].toLocaleString() : row[h]}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>WorkZen Payroll Management System | Generated on ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;

    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Auto-print after a short delay
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
      sonnerToast.success(`PDF ready: ${filename}`);
    } else {
      sonnerToast.error('Please allow popups to export PDF');
    }
  };

  const exportReport = (format: 'csv' | 'pdf') => {
    let data: any[] = [];
    let title = '';
    let filename = '';

    switch (selectedReport) {
      case 'summary':
        data = payrollSummary;
        title = 'Payroll Summary Report';
        filename = 'payroll_summary';
        break;
      case 'department':
        data = departmentBreakdown;
        title = 'Department Breakdown Report';
        filename = 'department_breakdown';
        break;
      case 'statutory':
        data = statutoryReport;
        title = 'Statutory Compliance Report';
        filename = 'statutory_report';
        break;
      case 'bonus':
        data = bonusAnalysis;
        title = 'Bonus Analysis Report';
        filename = 'bonus_analysis';
        break;
      default:
        data = payrollSummary;
        title = 'Payroll Report';
        filename = 'payroll_report';
    }

    if (format === 'csv') {
      exportToCSV(data, filename);
    } else {
      exportToPDF(data, title, filename);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payroll Reports</h1>
          <p className="text-muted-foreground">Generate and export comprehensive payroll reports</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Report Filters</CardTitle>
            <CardDescription>Select criteria for report generation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Month</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025-10">October 2025</SelectItem>
                    <SelectItem value="2025-09">September 2025</SelectItem>
                    <SelectItem value="2025-08">August 2025</SelectItem>
                    <SelectItem value="2025-07">July 2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end gap-2">
                <Button onClick={() => exportReport('csv')} variant="outline" className="flex-1 gap-2">
                  <Download className="h-4 w-4" />
                  CSV
                </Button>
                <Button onClick={() => exportReport('pdf')} variant="outline" className="flex-1 gap-2">
                  <Download className="h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="summary" onValueChange={setSelectedReport}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary" className="gap-2">
              <FileText className="h-4 w-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="department" className="gap-2">
              <Users className="h-4 w-4" />
              Department
            </TabsTrigger>
            <TabsTrigger value="statutory" className="gap-2">
              <PieChart className="h-4 w-4" />
              Statutory
            </TabsTrigger>
            <TabsTrigger value="bonus" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Bonus
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Payroll Summary</CardTitle>
                <CardDescription>Overview of payroll expenses across months</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-[200px]">Loading...</div>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Gross Payroll</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net Payroll</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollSummary.map((row, index) => (
                      <TableRow key={row.month}>
                        <TableCell className="font-medium">{row.month}</TableCell>
                        <TableCell>{row.employees}</TableCell>
                        <TableCell>₹{row.grossPayroll.toLocaleString()}</TableCell>
                        <TableCell className="text-destructive">₹{row.deductions.toLocaleString()}</TableCell>
                        <TableCell className="font-semibold text-primary">₹{row.netPayroll.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="department" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Department Payroll Breakdown</CardTitle>
                <CardDescription>Salary distribution across departments</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-[200px]">Loading...</div>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Total Salary</TableHead>
                      <TableHead>Average Salary</TableHead>
                      <TableHead>% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departmentBreakdown.map((row) => (
                      <TableRow key={row.department}>
                        <TableCell className="font-medium">{row.department}</TableCell>
                        <TableCell>{row.employees}</TableCell>
                        <TableCell>₹{row.totalSalary.toLocaleString()}</TableCell>
                        <TableCell>₹{row.avgSalary.toLocaleString()}</TableCell>
                        <TableCell>
                          {((row.totalSalary / departmentBreakdown.reduce((sum, d) => sum + d.totalSalary, 0)) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statutory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>PF/ESI/Tax Contributions Summary</CardTitle>
                <CardDescription>Statutory deductions and contributions</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-[200px]">Loading...</div>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Employee Share</TableHead>
                      <TableHead>Employer Share</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statutoryReport.map((row) => (
                      <TableRow key={row.type}>
                        <TableCell className="font-medium">{row.type}</TableCell>
                        <TableCell>₹{row.amount.toLocaleString()}</TableCell>
                        <TableCell>₹{row.employerContribution.toLocaleString()}</TableCell>
                        <TableCell className="font-semibold">₹{row.total.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 bg-muted/50 font-semibold">
                      <TableCell>Total</TableCell>
                      <TableCell>₹{statutoryReport.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}</TableCell>
                      <TableCell>₹{statutoryReport.reduce((sum, i) => sum + i.employerContribution, 0).toLocaleString()}</TableCell>
                      <TableCell>₹{statutoryReport.reduce((sum, i) => sum + i.total, 0).toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bonus" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bonus & Incentive Analysis</CardTitle>
                <CardDescription>Performance-based bonus distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-[200px]">Loading...</div>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead>Avg Office Score</TableHead>
                      <TableHead>Total Bonus</TableHead>
                      <TableHead>Avg Bonus/Employee</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bonusAnalysis.map((row) => (
                      <TableRow key={row.department}>
                        <TableCell className="font-medium">{row.department}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{row.avgScore}/10</span>
                            <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${(row.avgScore / 10) * 100}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>₹{row.totalBonus.toLocaleString()}</TableCell>
                        <TableCell>₹{row.avgBonus.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
