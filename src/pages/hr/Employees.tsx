import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Edit, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { profileApi, usersApi } from '@/lib/api';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type EmployeeRow = { id: string; name: string; department: string; designation: string; status: string; joinDate: string; email: string; phone: string };

export default function Employees() {
  const [searchQuery, setSearchQuery] = useState('');
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRow | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    password: 'Welcome@123',
    role: 'employee',
    department: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await profileApi.list({ page: 1, limit: 500, search: searchQuery || undefined });
      const rows: EmployeeRow[] = res.items.map((p: any) => ({
        id: p.employeeCode || p.userId?.slice(0,8) || 'N/A',
        name: p.user?.name || 'Unknown',
        department: 'N/A',
        designation: p.designation || 'N/A',
        status: 'Active',
        joinDate: p.createdAt?.slice(0,10) || 'N/A',
        email: p.user?.email || 'N/A',
        phone: p.phone || 'N/A',
      }));
      setEmployees(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [searchQuery]);

  const filteredEmployees = employees;

  const handleView = (employee: EmployeeRow) => {
    setSelectedEmployee(employee);
    setViewModalOpen(true);
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.role) {
      toast.error('Name, email, and role are required');
      return;
    }
    
    setSubmitting(true);
    try {
      await usersApi.create({
        name: newEmployee.name,
        email: newEmployee.email,
        password: newEmployee.password,
        role: newEmployee.role as any,
      });
      
      toast.success(`Employee ${newEmployee.name} created successfully!`);
      
      // Reload employees list
      await load();
      
      // Reset form and close dialog
      setNewEmployee({ name: '', email: '', password: 'Welcome@123', role: 'employee', department: '' });
      setAddModalOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create employee');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Employee Management</h1>
            <p className="text-muted-foreground">Manage employee records and information</p>
          </div>
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Employee Directory</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    className="pl-8 w-[300px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center">Loading...</TableCell></TableRow>
                ) : filteredEmployees.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center">No employees found</TableCell></TableRow>
                ) : filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.id}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.designation}</TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-success">{employee.status}</Badge>
                    </TableCell>
                    <TableCell>{employee.joinDate}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(employee)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Employee Dialog */}
        <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input 
                  id="name" 
                  placeholder="Enter full name" 
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="user@workzen.com" 
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Default Password</Label>
                <Input 
                  id="password" 
                  type="text" 
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">User can change this after first login</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={newEmployee.role} onValueChange={(val) => setNewEmployee({ ...newEmployee, role: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="hr">HR Officer</SelectItem>
                    <SelectItem value="payroll">Payroll Officer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department (Optional)</Label>
                <Select value={newEmployee.department} onValueChange={(val) => setNewEmployee({ ...newEmployee, department: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Human Resources">Human Resources</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Can be updated in profile later</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddModalOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleAddEmployee} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Employee'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Employee Dialog */}
        {selectedEmployee && (
          <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Employee Profile</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="personal" className="w-full">
                <TabsList>
                  <TabsTrigger value="personal">Personal Info</TabsTrigger>
                  <TabsTrigger value="attendance">Attendance</TabsTrigger>
                  <TabsTrigger value="leaves">Leave History</TabsTrigger>
                </TabsList>
                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Employee ID</p>
                      <p className="font-medium">{selectedEmployee.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{selectedEmployee.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedEmployee.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedEmployee.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="font-medium">{selectedEmployee.department}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Designation</p>
                      <p className="font-medium">{selectedEmployee.designation}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Join Date</p>
                      <p className="font-medium">{selectedEmployee.joinDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant="default" className="bg-success">{selectedEmployee.status}</Badge>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="attendance">
                  <p className="text-center text-muted-foreground py-8">Attendance summary would appear here</p>
                </TabsContent>
                <TabsContent value="leaves">
                  <p className="text-center text-muted-foreground py-8">Leave history would appear here</p>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
