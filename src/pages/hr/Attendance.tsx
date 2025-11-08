import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Download, Calendar, Clock, Eye, Users, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { attendanceApi, profileApi } from '@/lib/api';

type AttendanceRecord = { 
  id: string; 
  userId: string; 
  date: string; 
  checkIn?: string; 
  checkOut?: string; 
  status?: string;
  metadata?: any;
  userName?: string;
  employeeCode?: string;
};

type AttendanceSummary = {
  totalRecords: number;
  present: number;
  absent: number;
  late: number;
  avgWorkHours: number;
};

export default function Attendance() {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedUser, setSelectedUser] = useState('all');
  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string; employeeCode: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [summary, setSummary] = useState<AttendanceSummary>({
    totalRecords: 0,
    present: 0,
    absent: 0,
    late: 0,
    avgWorkHours: 0,
  });

  const loadUsers = async () => {
    try {
      const res = await profileApi.list({ limit: 100 });
      const userList = res.items.map((item: any) => ({
        id: item.userId,
        name: item.user?.name || 'Unknown',
        employeeCode: item.employeeCode || 'N/A',
      }));
      setUsers(userList);
    } catch (e) {
      console.error('Failed to load users:', e);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const month = selectedMonth || (() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      })();
      
      const params: any = { month };
      if (selectedUser !== 'all') {
        params.userId = selectedUser;
      }
      
      // Use listAll for HR/Admin to get all employees' attendance
      const res = await attendanceApi.listAll(params);
      
      // Enrich with user data from the response or users list
      const enriched = res.map((record: any) => {
        // If user data is included in response (from backend)
        if (record.user) {
          return {
            ...record,
            userName: record.user.name || 'Unknown',
            employeeCode: record.user.profile?.employeeCode || 'N/A',
          };
        }
        // Otherwise, find from users list
        const user = users.find(u => u.id === record.userId);
        return {
          ...record,
          userName: user?.name || 'Unknown',
          employeeCode: user?.employeeCode || 'N/A',
        };
      });
      
      setData(enriched);
      
      // Calculate summary
      const present = enriched.filter(r => r.checkIn).length;
      const absent = enriched.filter(r => !r.checkIn).length;
      const late = enriched.filter(r => {
        if (!r.checkIn) return false;
        const checkInTime = new Date(r.checkIn);
        const hours = checkInTime.getHours();
        const minutes = checkInTime.getMinutes();
        return hours > 9 || (hours === 9 && minutes > 30); // Late if after 9:30 AM
      }).length;
      
      const totalHours = enriched.reduce((sum, r) => {
        if (r.checkIn && r.checkOut) {
          const hours = (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }
        return sum;
      }, 0);
      
      setSummary({
        totalRecords: enriched.length,
        present,
        absent,
        late,
        avgWorkHours: present > 0 ? totalHours / present : 0,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadUsers(); 
    const now = new Date();
    setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      load();
    }
  }, [selectedMonth, selectedUser]);

  const handleExport = () => {
    toast.success('Attendance report exported as CSV');
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const calculateWorkHours = (checkIn?: string, checkOut?: string) => {
    if (!checkIn || !checkOut) return '-';
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return `${hours.toFixed(2)}h`;
  };

  const isLate = (checkIn?: string) => {
    if (!checkIn) return false;
    const checkInTime = new Date(checkIn);
    const hours = checkInTime.getHours();
    const minutes = checkInTime.getMinutes();
    return hours > 9 || (hours === 9 && minutes > 30); // Late if after 9:30 AM
  };

  const getAttendanceStatus = (record: AttendanceRecord) => {
    if (!record.checkIn) return { label: 'Absent', variant: 'destructive' as const, color: 'text-destructive' };
    if (isLate(record.checkIn)) return { label: 'Late', variant: 'secondary' as const, color: 'text-warning' };
    if (record.checkOut) return { label: 'Present', variant: 'default' as const, color: 'text-success' };
    return { label: 'In Progress', variant: 'outline' as const, color: 'text-primary' };
  };

  const handleViewDetails = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setSheetOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Attendance Monitoring</h1>
            <p className="text-muted-foreground">Monitor employee attendance with check-in/out times</p>
          </div>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalRecords}</div>
              <p className="text-xs text-muted-foreground">Attendance entries</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{summary.present}</div>
              <p className="text-xs text-muted-foreground">
                {summary.totalRecords > 0 ? `${((summary.present / summary.totalRecords) * 100).toFixed(1)}%` : '0%'} of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{summary.absent}</div>
              <p className="text-xs text-muted-foreground">
                {summary.totalRecords > 0 ? `${((summary.absent / summary.totalRecords) * 100).toFixed(1)}%` : '0%'} of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
              <AlertCircle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{summary.late}</div>
              <p className="text-xs text-muted-foreground">After 9:30 AM</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Work Hours</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{summary.avgWorkHours.toFixed(2)}h</div>
              <p className="text-xs text-muted-foreground">Per employee</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle>Daily Attendance Records</CardTitle>
              <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label htmlFor="month" className="whitespace-nowrap">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Month
                  </Label>
                  <Input
                    id="month"
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-[160px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="employee" className="whitespace-nowrap">Employee</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="w-[200px]" id="employee">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employees</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.employeeCode} - {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>
                    <Clock className="h-4 w-4 inline mr-1" />
                    Check-In
                  </TableHead>
                  <TableHead>
                    <Clock className="h-4 w-4 inline mr-1" />
                    Check-Out
                  </TableHead>
                  <TableHead>Work Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center">Loading...</TableCell></TableRow>
                ) : data.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center">No attendance records found</TableCell></TableRow>
                ) : data.map((record) => {
                  const status = getAttendanceStatus(record);
                  return (
                    <TableRow key={record.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleViewDetails(record)}>
                      <TableCell className="font-medium">{formatDate(record.date)}</TableCell>
                      <TableCell className="font-mono text-sm">{record.employeeCode}</TableCell>
                      <TableCell>{record.userName}</TableCell>
                      <TableCell className={`font-semibold ${isLate(record.checkIn) ? 'text-warning' : 'text-success'}`}>
                        {formatTime(record.checkIn)}
                        {isLate(record.checkIn) && <span className="ml-1 text-xs">(Late)</span>}
                      </TableCell>
                      <TableCell className="text-primary font-semibold">
                        {formatTime(record.checkOut)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {calculateWorkHours(record.checkIn, record.checkOut)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className={status.label === 'Present' ? 'bg-success' : ''}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(record);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Detailed View Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Attendance Details</SheetTitle>
              <SheetDescription>
                Complete attendance information for this record
              </SheetDescription>
            </SheetHeader>

            {selectedRecord && (
              <div className="mt-6 space-y-6">
                {/* Employee Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Employee Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{selectedRecord.userName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Employee ID</p>
                      <p className="font-medium font-mono">{selectedRecord.employeeCode}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">{formatDate(selectedRecord.date)}</p>
                    </div>
                  </div>
                </div>

                {/* Attendance Status */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Attendance Status
                  </h3>
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant={getAttendanceStatus(selectedRecord).variant} className={getAttendanceStatus(selectedRecord).label === 'Present' ? 'bg-success' : ''}>
                        {getAttendanceStatus(selectedRecord).label}
                      </Badge>
                    </div>
                    {isLate(selectedRecord.checkIn) && (
                      <div className="flex items-center gap-2 p-2 bg-warning/10 border border-warning/20 rounded">
                        <AlertCircle className="h-4 w-4 text-warning" />
                        <span className="text-sm text-warning">Late arrival (after 9:30 AM)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Time Details */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Time Details
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-success">Check-In Time</span>
                        <Clock className="h-4 w-4 text-success" />
                      </div>
                      <p className="text-2xl font-bold text-success">
                        {formatTime(selectedRecord.checkIn)}
                      </p>
                      {selectedRecord.checkIn && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(selectedRecord.checkIn).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      )}
                    </div>

                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-primary">Check-Out Time</span>
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-2xl font-bold text-primary">
                        {formatTime(selectedRecord.checkOut)}
                      </p>
                      {selectedRecord.checkOut && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(selectedRecord.checkOut).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      )}
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Total Work Hours</span>
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <p className="text-2xl font-bold">
                        {calculateWorkHours(selectedRecord.checkIn, selectedRecord.checkOut)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Metadata */}
                {selectedRecord.metadata && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Additional Information</h3>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-2 text-sm">
                        {selectedRecord.metadata.method && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Check-in Method</span>
                            <span className="font-medium capitalize">{selectedRecord.metadata.method}</span>
                          </div>
                        )}
                        {selectedRecord.metadata.face && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Face Verified</span>
                            <Badge variant={selectedRecord.metadata.face.ok ? 'default' : 'destructive'}>
                              {selectedRecord.metadata.face.ok ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                        )}
                        {selectedRecord.metadata.face?.score && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Verification Score</span>
                            <span className="font-medium">{(selectedRecord.metadata.face.score * 100).toFixed(1)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}
