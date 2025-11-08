import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { profileApi, authApi } from '@/lib/api';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EmployeeProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

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

  const handleChangePassword = async () => {
    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      toast.success(response.message || 'Password changed successfully!');
      
      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Logout and redirect to login after 2 seconds
      setTimeout(() => {
        logout();
        navigate('/');
      }, 2000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to change password');
    } finally {
      setChangingPassword(false);
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

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password *</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Enter current password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    disabled={changingPassword}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    disabled={changingPassword}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password *</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter new password (min 8 characters)"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    disabled={changingPassword}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={changingPassword}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Password must be at least 8 characters long
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    disabled={changingPassword}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={changingPassword}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={handleChangePassword} 
                  disabled={changingPassword}
                  className="w-full sm:w-auto"
                >
                  {changingPassword ? 'Changing Password...' : 'Change Password'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                  disabled={changingPassword}
                  className="w-full sm:w-auto"
                >
                  Clear
                </Button>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>⚠️ Note:</strong> After changing your password, you will be logged out and need to login again with your new password.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
