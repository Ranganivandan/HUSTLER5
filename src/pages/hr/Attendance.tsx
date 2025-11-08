import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

const mockAttendanceData = [
  { employeeId: 'WZ-1001', name: 'Asha Patel', department: 'Product', present: 18, absent: 2, leaves: 2, percentage: 81.8 },
  { employeeId: 'WZ-1002', name: 'Rohan Mehta', department: 'Sales', present: 20, absent: 0, leaves: 2, percentage: 90.9 },
  { employeeId: 'WZ-1003', name: 'Priya Singh', department: 'Marketing', present: 19, absent: 1, leaves: 2, percentage: 86.4 },
];

export default function Attendance() {
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const handleExport = () => {
    toast.success('Attendance report exported as CSV');
  };

  const filteredData = selectedDepartment === 'all' 
    ? mockAttendanceData 
    : mockAttendanceData.filter(emp => emp.department === selectedDepartment);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Attendance Monitoring</h1>
            <p className="text-muted-foreground">Monitor employee attendance across departments</p>
          </div>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Monthly Attendance Summary</CardTitle>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Product">Product</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Leaves</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((record) => (
                  <TableRow key={record.employeeId}>
                    <TableCell className="font-medium">{record.employeeId}</TableCell>
                    <TableCell>{record.name}</TableCell>
                    <TableCell>{record.department}</TableCell>
                    <TableCell className="text-success">{record.present}</TableCell>
                    <TableCell className="text-destructive">{record.absent}</TableCell>
                    <TableCell className="text-warning">{record.leaves}</TableCell>
                    <TableCell className="font-semibold">{record.percentage}%</TableCell>
                    <TableCell>
                      <Badge 
                        variant={record.percentage >= 90 ? 'default' : record.percentage >= 75 ? 'secondary' : 'destructive'}
                        className={record.percentage >= 90 ? 'bg-success' : ''}
                      >
                        {record.percentage >= 90 ? 'Excellent' : record.percentage >= 75 ? 'Good' : 'Low'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
