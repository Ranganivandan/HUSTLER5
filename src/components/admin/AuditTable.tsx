import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Download } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  target: string;
  details: string;
  type: 'created' | 'updated' | 'deleted' | 'system';
}

const actionColors = {
  created: 'bg-green-500/10 text-green-700 border-green-200',
  updated: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  deleted: 'bg-red-500/10 text-red-700 border-red-200',
  system: 'bg-blue-500/10 text-blue-700 border-blue-200',
};

export function AuditTable() {
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.auditLogs({ page: 1, limit: 100 });
      const rows: AuditLog[] = res.items.map((r) => ({
        id: r.id,
        timestamp: new Date(r.createdAt).toLocaleString(),
        user: r.user?.name || 'System',
        role: r.user?.role?.name || 'System',
        action: r.action,
        target: r.entity || 'Unknown',
        details: JSON.stringify(r.meta || {}),
        type: r.action.toLowerCase().includes('create') ? 'created' : r.action.toLowerCase().includes('update') ? 'updated' : r.action.toLowerCase().includes('delete') ? 'deleted' : 'system',
      }));
      setLogs(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredLogs = logs.filter(
    (log) =>
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.target.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Audit Logs</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center">No audit logs found</TableCell></TableRow>
                ) : filteredLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedLog(log)}
                  >
                    <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={actionColors[log.type]}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.target}</TableCell>
                    <TableCell className="max-w-md truncate">{log.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Timestamp</p>
                <p className="font-mono">{selectedLog.timestamp}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">User</p>
                <p className="font-medium">{selectedLog.user}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Action</p>
                <Badge variant="outline" className={actionColors[selectedLog.type]}>
                  {selectedLog.action}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Target</p>
                <p className="font-medium">{selectedLog.target}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Details</p>
                <p className="text-sm">{selectedLog.details}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
