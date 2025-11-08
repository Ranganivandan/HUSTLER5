import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  designation?: string;
  joiningDate?: string;
  manager?: string;
}

interface UserDetailDrawerProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailDrawer({ user, open, onOpenChange }: UserDetailDrawerProps) {
  if (!user) return null;

  const performanceData = [
    { month: 'May', score: 8.2 },
    { month: 'Jun', score: 8.5 },
    { month: 'Jul', score: 8.7 },
    { month: 'Aug', score: 8.9 },
    { month: 'Sep', score: 9.1 },
    { month: 'Oct', score: 9.0 },
  ];

  const leaveData = [
    { type: 'Casual', value: 4, color: 'hsl(var(--chart-1))' },
    { type: 'Sick', value: 2, color: 'hsl(var(--chart-2))' },
    { type: 'Privilege', value: 3, color: 'hsl(var(--chart-3))' },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{user.name}</SheetTitle>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary">{user.role}</Badge>
            <Badge variant="outline">{user.department}</Badge>
            <Badge variant={user.status === 'Active' ? 'default' : 'destructive'}>{user.status}</Badge>
          </div>
        </SheetHeader>

        <Tabs defaultValue="profile" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="leaves">Leaves</TabsTrigger>
            <TabsTrigger value="payslips">Payslips</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Designation</p>
                    <p className="font-medium">{user.designation || 'Software Engineer'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{user.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Joining Date</p>
                    <p className="font-medium">{user.joiningDate || '2024-03-01'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Manager</p>
                    <p className="font-medium">{user.manager || 'Rajesh Kumar'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Employee ID</p>
                    <p className="font-medium">WZ-{user.id.slice(0, 4)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  <p className="text-2xl font-bold">92%</p>
                  <p className="text-xs text-muted-foreground mt-1">Average daily hours: 8.5</p>
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Employee has maintained 92% attendance and a 8.7/10 performance average.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaves" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Taken</p>
                    <p className="text-2xl font-bold">9</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className="text-2xl font-bold">11</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold">1</p>
                  </div>
                </div>
                <div className="h-40 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={leaveData} cx="50%" cy="50%" outerRadius={60} dataKey="value" label>
                        {leaveData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payslips" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {['October 2025', 'September 2025', 'August 2025'].map((month) => (
                    <div key={month} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{month}</p>
                        <p className="text-sm text-muted-foreground">Net Pay: ₹73,500</p>
                      </div>
                      <Badge variant="outline">View</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
