import { useEffect, useState } from 'react';
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
import { leavesApi, profileApi } from '@/lib/api';
import { X } from 'lucide-react';

type LeaveRow = { id: string; type: string; fromDate: string; toDate: string; days: number; status: string; approver: string; appliedDate: string };

export default function Leaves() {
  const [leaveBalance, setLeaveBalance] = useState<{ casual: number; sick: number; privilege: number }>({ casual: 0, sick: 0, privilege: 0 });
  const [policy, setPolicy] = useState<{ maxConsecutiveDays?: number } | null>(null);
  const [leaves, setLeaves] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      // load balances from backend policy-aware endpoint
      const bal = await leavesApi.getMyBalances();
      const b = bal.balances || ({} as any);
      setLeaveBalance({ casual: b.CASUAL ?? 0, sick: b.SICK ?? 0, privilege: b.EARNED ?? 0 });
      setPolicy({ maxConsecutiveDays: bal.policy?.maxConsecutiveDays });
      // load my leaves
      const res = await leavesApi.list({ page: 1, limit: 100 });
      const rows: LeaveRow[] = res.items.map((r) => ({
        id: r.id,
        type: r.type,
        fromDate: r.startDate.slice(0,10),
        toDate: r.endDate.slice(0,10),
        days: (r.metadata?.days as number) ?? 0,
        status: r.status.toLowerCase(),
        approver: r.approvedById ? r.approvedById : '-',
        appliedDate: r.createdAt.slice(0,10),
      }));
      setLeaves(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (data: any) => {
    try {
      const mapType = (t: string) => t === 'casual' ? 'CASUAL' : t === 'sick' ? 'SICK' : 'EARNED';
      const fmt = (d: Date) => d.toISOString().slice(0,10);
      await leavesApi.apply({ type: mapType(data.type) as any, startDate: fmt(data.fromDate), endDate: fmt(data.toDate), reason: data.reason });
      toast.success('Leave request submitted successfully!');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to submit leave');
    }
  };

  const handleSaveDraft = (data: any) => {
    // No drafts API; keep as noop for now
    console.log('Leave draft saved:', data);
  };

  const handleCancel = async (id: string) => {
    try {
      await leavesApi.cancel(id);
      toast.success('Leave request cancelled');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to cancel leave');
    }
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
                  policy={policy || undefined}
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
