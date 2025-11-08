import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { reportsApi } from '@/lib/api';
import { toast as sonnerToast } from 'sonner';

export default function Reports() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState('current-month');
  const [department, setDepartment] = useState('all');
  const [format, setFormat] = useState('pdf');
  const [loading, setLoading] = useState<string | null>(null);

  const generatePDF = async (title: string, data: any) => {
    try {
      console.log('Generating PDF for:', title);
      console.log('Data received:', data);
      
      // Dynamic import to avoid build issues
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default;
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF() as any;
      
      // Add title
      doc.setFontSize(18);
      doc.text(title, 14, 20);
      
      // Add date
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
      doc.text(`Period: ${dateRange.replace('-', ' ')}`, 14, 34);
      if (department !== 'all') {
        doc.text(`Department: ${department}`, 14, 40);
      }
      
      let yPos = department !== 'all' ? 48 : 42;
      
      // Add data based on report type
      doc.setFontSize(12);
    
    if (data.employees) {
      // Company Overview
      doc.text('Employee Statistics:', 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.text(`Total Employees: ${data.employees.total}`, 20, yPos);
      yPos += 6;
      doc.text(`Active: ${data.employees.active}`, 20, yPos);
      yPos += 6;
      doc.text(`Inactive: ${data.employees.inactive}`, 20, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      doc.text('Attendance:', 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.text(`Average Attendance: ${data.attendance.avgAttendance}%`, 20, yPos);
      yPos += 6;
      doc.text(`Present Days: ${data.attendance.presentDays}`, 20, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      doc.text('Payroll:', 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.text(`Total Gross: ₹${data.payroll.totalGross.toLocaleString()}`, 20, yPos);
      yPos += 6;
      doc.text(`Total Net: ₹${data.payroll.totalNet.toLocaleString()}`, 20, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      doc.text('Leaves:', 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.text(`Total Requests: ${data.leaves.total}`, 20, yPos);
      yPos += 6;
      doc.text(`Approved: ${data.leaves.approved}`, 20, yPos);
      yPos += 6;
      doc.text(`Pending: ${data.leaves.pending}`, 20, yPos);
    } else if (data.departments) {
      // Department Performance
      const tableData = data.departments.map((d: any) => [
        d.department,
        d.employeeCount,
        `${d.attendanceRate}%`,
        `₹${d.totalPayroll.toLocaleString()}`,
        d.performanceScore,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Department', 'Employees', 'Attendance', 'Payroll', 'Score']],
        body: tableData,
      });
    } else if (data.breakdown) {
      // Payroll Summary
      doc.text(`Total Employees: ${data.totalEmployees}`, 14, yPos);
      yPos += 6;
      doc.text(`Total Gross: ₹${data.totalGross.toLocaleString()}`, 14, yPos);
      yPos += 6;
      doc.text(`Total Net: ₹${data.totalNet.toLocaleString()}`, 14, yPos);
      yPos += 6;
      doc.text(`Total Deductions: ₹${data.totalDeductions.toLocaleString()}`, 14, yPos);
      yPos += 10;
      
      const tableData = data.breakdown.slice(0, 20).map((p: any) => [
        p.employeeName,
        p.department,
        `₹${p.gross.toLocaleString()}`,
        `₹${p.net.toLocaleString()}`,
        `₹${p.deductions.toLocaleString()}`,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Employee', 'Department', 'Gross', 'Net', 'Deductions']],
        body: tableData,
      });
    } else if (data.byType) {
      // Leave Utilization
      doc.text(`Total Requests: ${data.totalRequests}`, 14, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      doc.text('By Type:', 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      Object.entries(data.byType).forEach(([type, info]: [string, any]) => {
        doc.text(`${type}: ${info.count} requests (${info.days} days)`, 20, yPos);
        yPos += 6;
      });
    } else if (data.summary) {
      // Attendance Analytics
      doc.text(`Total Records: ${data.summary.totalRecords}`, 14, yPos);
      yPos += 6;
      doc.text(`Present: ${data.summary.present}`, 14, yPos);
      yPos += 6;
      doc.text(`Absent: ${data.summary.absent}`, 14, yPos);
      yPos += 6;
      doc.text(`Attendance Rate: ${data.summary.attendanceRate}%`, 14, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      doc.text('Patterns:', 14, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.text(`Late Check-ins: ${data.patterns.lateCheckIns}`, 20, yPos);
      yPos += 6;
      doc.text(`Early Checkouts: ${data.patterns.earlyCheckouts}`, 20, yPos);
    } else if (data.monthlyGrowth) {
      // Employee Growth
      doc.text(`Current Total: ${data.currentTotal}`, 14, yPos);
      yPos += 6;
      doc.text(`Total Joined: ${data.totalJoined}`, 14, yPos);
      yPos += 6;
      doc.text(`Total Left: ${data.totalLeft}`, 14, yPos);
      yPos += 6;
      doc.text(`Attrition Rate: ${data.attritionRate}%`, 14, yPos);
      yPos += 10;
      
      const tableData = data.monthlyGrowth.map((m: any) => [
        m.month,
        m.joined,
        m.left,
        m.total,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Month', 'Joined', 'Left', 'Total']],
        body: tableData,
      });
    }
    
      // Save PDF
      console.log('Saving PDF...');
      doc.save(`${title.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      console.log('PDF saved successfully');
    } catch (error) {
      console.error('PDF Generation Error:', error);
      throw error;
    }
  };

  const handleGenerateReport = async (reportType: string, apiMethod: string) => {
    setLoading(reportType);
    try {
      let data;
      const params = { range: dateRange, department };
      
      switch (apiMethod) {
        case 'companyOverview':
          data = await reportsApi.companyOverview(params);
          break;
        case 'departmentPerformance':
          data = await reportsApi.departmentPerformance({ range: dateRange });
          break;
        case 'payrollSummary':
          data = await reportsApi.payrollSummary(params);
          break;
        case 'leaveUtilization':
          data = await reportsApi.leaveUtilization(params);
          break;
        case 'attendanceAnalytics':
          data = await reportsApi.attendanceAnalytics(params);
          break;
        case 'employeeGrowth':
          data = await reportsApi.employeeGrowth({ range: dateRange });
          break;
        default:
          throw new Error('Unknown report type');
      }
      
      if (format === 'pdf') {
        await generatePDF(reportType, data);
      } else {
        // For CSV/Excel, convert to JSON and download
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      sonnerToast.success('Report generated successfully');
      toast({
        title: 'Report generated',
        description: `${reportType} report has been generated and downloaded.`,
      });
    } catch (error: any) {
      console.error('Report generation error:', error);
      const errorMessage = error?.message || 'Failed to generate report';
      sonnerToast.error(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const reports = [
    {
      title: 'Company Overview Report',
      description: 'Comprehensive report including attendance, payroll, and performance summary',
      icon: FileText,
      apiMethod: 'companyOverview',
    },
    {
      title: 'Department Performance Report',
      description: 'Detailed performance metrics for each department',
      icon: FileText,
      apiMethod: 'departmentPerformance',
    },
    {
      title: 'Payroll Summary Report',
      description: 'Complete payroll breakdown with taxes and deductions',
      icon: FileText,
      apiMethod: 'payrollSummary',
    },
    {
      title: 'Leave Utilization Report',
      description: 'Analysis of leave patterns and utilization across the organization',
      icon: FileText,
      apiMethod: 'leaveUtilization',
    },
    {
      title: 'Attendance Analytics Report',
      description: 'Detailed attendance trends and patterns',
      icon: FileText,
      apiMethod: 'attendanceAnalytics',
    },
    {
      title: 'Employee Growth Report',
      description: 'Historical employee count and attrition analysis',
      icon: FileText,
      apiMethod: 'employeeGrowth',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">Generate and export company reports</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Report Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="date-range">Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger id="date-range">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current-month">Current Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger id="department">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="hr">Human Resources</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="format">Export Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger id="format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xlsx">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <report.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <CardTitle className="mt-4">{report.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleGenerateReport(report.title, report.apiMethod)}
                  disabled={loading === report.title}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {loading === report.title ? 'Generating...' : 'Generate Report'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Schedule Reports</h3>
                <p className="text-sm text-muted-foreground">
                  Set up automated report generation and delivery via email
                </p>
              </div>
              <Button variant="outline">Configure</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
