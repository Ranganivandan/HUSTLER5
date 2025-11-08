import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AuditTable } from '@/components/admin/AuditTable';

export default function Audit() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground">Track all system activities and changes</p>
        </div>

        <AuditTable />
      </div>
    </DashboardLayout>
  );
}
