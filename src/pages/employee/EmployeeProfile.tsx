import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { profileApi } from '@/lib/api';
import { toast } from 'sonner';

export default function EmployeeProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await profileApi.getMe();
      setProfile(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground">Manage your personal information</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="mt-1 text-base text-card-foreground">{user?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="mt-1 text-base text-card-foreground">{user?.email || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Employee Code
                </label>
                <p className="mt-1 text-base text-card-foreground font-mono font-semibold">{profile?.employeeCode || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Department
                </label>
                <p className="mt-1 text-base text-card-foreground">{profile?.department || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Designation
                </label>
                <p className="mt-1 text-base text-card-foreground">{profile?.designation || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Phone
                </label>
                <p className="mt-1 text-base text-card-foreground">{profile?.phone || 'N/A'}</p>
              </div>
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
