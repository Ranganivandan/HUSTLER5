import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LeaveForm } from '@/components/employee/LeaveForm';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { X } from 'lucide-react';

const mockLeaves = [
  {
    id: '1',
    type: 'Casual',
    fromDate: '2025-11-04',
    toDate: '2025-11-05',
    days: 2,
    status: 'approved',
    approver: 'Rahul Sharma',
    appliedDate: '2025-10-28',
  },
  {
    id: '2',
    type: 'Sick',
    fromDate: '2025-10-20',
    toDate: '2025-10-20',
    days: 1,
    status: 'approved',
    approver: 'Rahul Sharma',
    appliedDate: '2025-10-19',
  },
  {
    id: '3',
    type: 'Privilege',
    fromDate: '2025-11-15',
    toDate: '2025-11-17',
    days: 3,
    status: 'pending',
    approver: '-',
    appliedDate: '2025-11-01',
  },
];

export default function Leaves() {
  const [leaveBalance] = useState({ casual: 6, sick: 4, privilege: 10 });
  const [leaves] = useState(mockLeaves);

  const handleSubmit = (data: any) => {
    console.log('Leave submitted:', data);
    toast.success('Leave request submitted successfully!');
  };

  const handleSaveDraft = (data: any) => {
    console.log('Leave draft saved:', data);
  };

  const handleCancel = (id: string) => {
    console.log('Cancel leave:', id);
    toast.success('Leave request cancelled');
  };

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
          <p className="text-muted-foreground">Apply for leaves and track your requests</p>
        </div>

        <Tabs defaultValue="apply" className="space-y-6">
          <TabsList>
            <TabsTrigger value="apply">Apply Leave</TabsTrigger>
            <TabsTrigger value="history">Leave History</TabsTrigger>
          </TabsList>

          <TabsContent value="apply" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Apply for Leave</CardTitle>
              </CardHeader>
              <CardContent>
                <LeaveForm
                  leaveBalance={leaveBalance}
                  onSubmit={handleSubmit}
                  onSaveDraft={handleSaveDraft}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Leave History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Approver</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaves.map((leave) => (
                      <TableRow key={leave.id}>
                        <TableCell className="font-medium">{leave.type}</TableCell>
                        <TableCell>{leave.fromDate}</TableCell>
                        <TableCell>{leave.toDate}</TableCell>
                        <TableCell>{leave.days}</TableCell>
                        <TableCell>{getStatusBadge(leave.status)}</TableCell>
                        <TableCell>{leave.approver}</TableCell>
                        <TableCell>{leave.appliedDate}</TableCell>
                        <TableCell>
                          {leave.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancel(leave.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
