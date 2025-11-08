import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SettingsTab } from '@/components/admin/SettingsTab';

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground">Configure company-wide settings and policies</p>
        </div>

        <SettingsTab />
      </div>
    </DashboardLayout>
  );
}
