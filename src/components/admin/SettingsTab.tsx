import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export function SettingsTab() {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: 'Settings saved',
      description: 'Your changes have been saved successfully.',
    });
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
                <Input id="company-name" defaultValue="WorkZen Technologies" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fiscal-year">Fiscal Year Start</Label>
                <Input id="fiscal-year" type="month" defaultValue="2025-04" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Input id="currency" defaultValue="INR" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" defaultValue="Asia/Kolkata" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Company Address</Label>
              <Input id="address" defaultValue="123 Tech Park, Bangalore, Karnataka" />
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
                <Input id="min-hours" type="number" defaultValue="8" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grace-time">Grace Time (minutes)</Label>
                <Input id="grace-time" type="number" defaultValue="15" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="working-days">Working Days</Label>
                <Input id="working-days" defaultValue="Monday - Saturday" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auto-absent">Auto Mark Absent After (days)</Label>
                <Input id="auto-absent" type="number" defaultValue="3" />
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
                <Input id="casual-leaves" type="number" defaultValue="12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sick-leaves">Sick Leaves (yearly)</Label>
                <Input id="sick-leaves" type="number" defaultValue="12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="privilege-leaves">Privilege Leaves (yearly)</Label>
                <Input id="privilege-leaves" type="number" defaultValue="15" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-consecutive">Max Consecutive Leave Days</Label>
              <Input id="max-consecutive" type="number" defaultValue="5" />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="carry-forward" defaultChecked />
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
                <Input id="pf" type="number" defaultValue="12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="esi">ESI (%)</Label>
                <Input id="esi" type="number" defaultValue="1.75" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prof-tax">Professional Tax</Label>
                <Input id="prof-tax" type="number" defaultValue="200" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bonus">Default Bonus (%)</Label>
                <Input id="bonus" type="number" defaultValue="10" />
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
                <Switch id="email-alerts" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="attendance-reminder">Attendance Reminders</Label>
                  <p className="text-sm text-muted-foreground">Remind employees to mark attendance</p>
                </div>
                <Switch id="attendance-reminder" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="leave-approval">Leave Approval Notifications</Label>
                  <p className="text-sm text-muted-foreground">Notify HR of pending leave approvals</p>
                </div>
                <Switch id="leave-approval" defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSave}>Save All Changes</Button>
      </div>
    </Tabs>
  );
}
