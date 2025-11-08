import { useEffect, useState } from 'react';
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
import { leavesApi, usersApi } from '@/lib/api';

type LeaveRow = { id: string; employeeId: string; name: string; department: string; type: string; fromDate: string; toDate: string; days: number; status: string; reason: string; appliedDate: string };

export default function Leaves() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [leaves, setLeaves] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});

  const load = async () => {
    setLoading(true);
    try {
      // Load all users for name mapping
      const usersRes = await usersApi.list({ page: 1, limit: 100 });
      const umap: Record<string, any> = {};
      usersRes.items.forEach((u: any) => { umap[u.id] = u; });
      setUsersMap(umap);

      // Load all leaves (HR sees all)
      const status = filterStatus === 'all' ? undefined : (filterStatus.toUpperCase() as any);
      const res = await leavesApi.list({ page: 1, limit: 100, status });
      const rows: LeaveRow[] = res.items.map((r) => {
        const user = umap[r.userId] || {};
        return {
          id: r.id,
          employeeId: user.id?.slice(0,8) || r.userId.slice(0,8),
          name: user.name || 'Unknown',
          department: 'N/A',
          type: r.type,
          fromDate: r.startDate.slice(0,10),
          toDate: r.endDate.slice(0,10),
          days: (r.metadata?.days as number) ?? 0,
          status: r.status.toLowerCase(),
          reason: r.reason || '',
          appliedDate: r.createdAt.slice(0,10),
        };
      });
      setLeaves(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterStatus]);

  const handleApprove = async (id: string, name: string) => {
    try {
      await leavesApi.approve(id);
      toast.success(`Leave approved for ${name}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to approve');
    }
  };

  const handleReject = async (id: string, name: string) => {
    try {
      await leavesApi.reject(id, 'Rejected by HR');
      toast.error(`Leave rejected for ${name}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to reject');
    }
  };

  const filteredRequests = leaves;

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
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="text-center">Loading...</TableCell></TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center">No leave requests found</TableCell></TableRow>
                ) : filteredRequests.map((request) => (
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
