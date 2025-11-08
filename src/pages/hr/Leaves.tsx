import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';

const mockLeaveRequests = [
  {
    id: '1',
    employeeId: 'WZ-1001',
    name: 'Asha Patel',
    department: 'Product',
    type: 'Privilege',
    fromDate: '2025-11-15',
    toDate: '2025-11-17',
    days: 3,
    status: 'pending',
    reason: 'Family event',
    appliedDate: '2025-11-01',
  },
  {
    id: '2',
    employeeId: 'WZ-1002',
    name: 'Rohan Mehta',
    department: 'Sales',
    type: 'Sick',
    fromDate: '2025-11-10',
    toDate: '2025-11-10',
    days: 1,
    status: 'pending',
    reason: 'Medical appointment',
    appliedDate: '2025-11-08',
  },
  {
    id: '3',
    employeeId: 'WZ-1003',
    name: 'Priya Singh',
    department: 'Marketing',
    type: 'Casual',
    fromDate: '2025-11-20',
    toDate: '2025-11-21',
    days: 2,
    status: 'approved',
    reason: 'Personal work',
    appliedDate: '2025-11-05',
  },
];

export default function Leaves() {
  const [filterStatus, setFilterStatus] = useState('all');

  const handleApprove = (id: string, name: string) => {
    toast.success(`Leave approved for ${name}`);
  };

  const handleReject = (id: string, name: string) => {
    toast.error(`Leave rejected for ${name}`);
  };

  const filteredRequests = filterStatus === 'all' 
    ? mockLeaveRequests 
    : mockLeaveRequests.filter(req => req.status === filterStatus);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-success">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leave Management</h1>
          <p className="text-muted-foreground">Review and approve employee leave requests</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Leave Requests</CardTitle>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Requests</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.name}</p>
                        <p className="text-sm text-muted-foreground">{request.employeeId}</p>
                      </div>
                    </TableCell>
                    <TableCell>{request.department}</TableCell>
                    <TableCell>{request.type}</TableCell>
                    <TableCell>{request.fromDate}</TableCell>
                    <TableCell>{request.toDate}</TableCell>
                    <TableCell>{request.days}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{request.reason}</TableCell>
                    <TableCell>
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleApprove(request.id, request.name)}
                          >
                            <Check className="h-4 w-4 text-success" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleReject(request.id, request.name)}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
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
