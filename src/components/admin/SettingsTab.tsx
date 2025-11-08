import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { settingsApi } from '@/lib/api';
import { toast as sonnerToast } from 'sonner';

export function SettingsTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    company: {},
    attendance: {},
    leaves: {},
    payroll: {},
    notifications: {},
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsApi.getAll();
      setSettings(data);
    } catch (error) {
      sonnerToast.error('Failed to load settings');
      console.error('Load settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (category: string, key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save all categories
      await Promise.all([
        settingsApi.updateByCategory('company', settings.company),
        settingsApi.updateByCategory('attendance', settings.attendance),
        settingsApi.updateByCategory('leaves', settings.leaves),
        settingsApi.updateByCategory('payroll', settings.payroll),
        settingsApi.updateByCategory('notifications', settings.notifications),
      ]);
      
      sonnerToast.success('Settings saved successfully');
      toast({
        title: 'Settings saved',
        description: 'Your changes have been saved successfully.',
      });
    } catch (error) {
      sonnerToast.error('Failed to save settings');
      console.error('Save settings error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Tabs defaultValue="company" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="company">Company</TabsTrigger>
        <TabsTrigger value="attendance">Attendance</TabsTrigger>
        <TabsTrigger value="leaves">Leaves</TabsTrigger>
        <TabsTrigger value="payroll">Payroll</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>

      <TabsContent value="company" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input 
                  id="company-name" 
                  value={settings.company.companyName || ''}
                  onChange={(e) => handleChange('company', 'companyName', e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fiscal-year">Fiscal Year Start</Label>
                <Input 
                  id="fiscal-year" 
                  type="month" 
                  value={settings.company.fiscalYearStart || ''}
                  onChange={(e) => handleChange('company', 'fiscalYearStart', e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Input 
                  id="currency" 
                  value={settings.company.currency || ''}
                  onChange={(e) => handleChange('company', 'currency', e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input 
                  id="timezone" 
                  value={settings.company.timezone || ''}
                  onChange={(e) => handleChange('company', 'timezone', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Company Address</Label>
              <Input 
                id="address" 
                value={settings.company.address || ''}
                onChange={(e) => handleChange('company', 'address', e.target.value)}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="attendance" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-hours">Minimum Hours Per Day</Label>
                <Input 
                  id="min-hours" 
                  type="number" 
                  value={settings.attendance.minHoursPerDay || ''}
                  onChange={(e) => handleChange('attendance', 'minHoursPerDay', Number(e.target.value))}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grace-time">Grace Time (minutes)</Label>
                <Input 
                  id="grace-time" 
                  type="number" 
                  value={settings.attendance.graceTimeMinutes || ''}
                  onChange={(e) => handleChange('attendance', 'graceTimeMinutes', Number(e.target.value))}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="working-days">Working Days</Label>
                <Input 
                  id="working-days" 
                  value={settings.attendance.workingDays || ''}
                  onChange={(e) => handleChange('attendance', 'workingDays', e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auto-absent">Auto Mark Absent After (days)</Label>
                <Input 
                  id="auto-absent" 
                  type="number" 
                  value={settings.attendance.autoMarkAbsentAfterDays || ''}
                  onChange={(e) => handleChange('attendance', 'autoMarkAbsentAfterDays', Number(e.target.value))}
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="leaves" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Leave Policies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="casual-leaves">Casual Leaves (yearly)</Label>
                <Input 
                  id="casual-leaves" 
                  type="number" 
                  value={settings.leaves.casualLeavesYearly || ''}
                  onChange={(e) => handleChange('leaves', 'casualLeavesYearly', Number(e.target.value))}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sick-leaves">Sick Leaves (yearly)</Label>
                <Input 
                  id="sick-leaves" 
                  type="number" 
                  value={settings.leaves.sickLeavesYearly || ''}
                  onChange={(e) => handleChange('leaves', 'sickLeavesYearly', Number(e.target.value))}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="privilege-leaves">Privilege Leaves (yearly)</Label>
                <Input 
                  id="privilege-leaves" 
                  type="number" 
                  value={settings.leaves.privilegeLeavesYearly || ''}
                  onChange={(e) => handleChange('leaves', 'privilegeLeavesYearly', Number(e.target.value))}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-consecutive">Max Consecutive Leave Days</Label>
              <Input 
                id="max-consecutive" 
                type="number" 
                value={settings.leaves.maxConsecutiveDays || ''}
                onChange={(e) => handleChange('leaves', 'maxConsecutiveDays', Number(e.target.value))}
                disabled={loading}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="carry-forward" 
                checked={settings.leaves.allowCarryForward || false}
                onCheckedChange={(checked) => handleChange('leaves', 'allowCarryForward', checked)}
                disabled={loading}
              />
              <Label htmlFor="carry-forward">Allow Carry Forward to Next Year</Label>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="payroll" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Payroll Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pf">PF (%)</Label>
                <Input 
                  id="pf" 
                  type="number" 
                  step="0.01"
                  value={settings.payroll.pfPercentage || ''}
                  onChange={(e) => handleChange('payroll', 'pfPercentage', Number(e.target.value))}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="esi">ESI (%)</Label>
                <Input 
                  id="esi" 
                  type="number" 
                  step="0.01"
                  value={settings.payroll.esiPercentage || ''}
                  onChange={(e) => handleChange('payroll', 'esiPercentage', Number(e.target.value))}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prof-tax">Professional Tax</Label>
                <Input 
                  id="prof-tax" 
                  type="number" 
                  value={settings.payroll.professionalTax || ''}
                  onChange={(e) => handleChange('payroll', 'professionalTax', Number(e.target.value))}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bonus">Default Bonus (%)</Label>
                <Input 
                  id="bonus" 
                  type="number" 
                  step="0.01"
                  value={settings.payroll.defaultBonusPercentage || ''}
                  onChange={(e) => handleChange('payroll', 'defaultBonusPercentage', Number(e.target.value))}
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Notifications & Integrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-alerts">Email Alerts</Label>
                  <p className="text-sm text-muted-foreground">Send email notifications for important events</p>
                </div>
                <Switch 
                  id="email-alerts" 
                  checked={settings.notifications.emailAlerts || false}
                  onCheckedChange={(checked) => handleChange('notifications', 'emailAlerts', checked)}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="attendance-reminder">Attendance Reminders</Label>
                  <p className="text-sm text-muted-foreground">Remind employees to mark attendance</p>
                </div>
                <Switch 
                  id="attendance-reminder" 
                  checked={settings.notifications.attendanceReminders || false}
                  onCheckedChange={(checked) => handleChange('notifications', 'attendanceReminders', checked)}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="leave-approval">Leave Approval Notifications</Label>
                  <p className="text-sm text-muted-foreground">Notify HR of pending leave approvals</p>
                </div>
                <Switch 
                  id="leave-approval" 
                  checked={settings.notifications.leaveApprovalNotifications || false}
                  onCheckedChange={(checked) => handleChange('notifications', 'leaveApprovalNotifications', checked)}
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} disabled={loading || saving}>
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>
    </Tabs>
  );
}
