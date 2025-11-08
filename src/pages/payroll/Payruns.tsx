import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Play, Download, Eye, Edit, Save, FileText, Check, X } from 'lucide-react';
import { PercentageSlider } from '@/components/payroll/PercentageSlider';
import { ConfigTemplateModal } from '@/components/payroll/ConfigTemplateModal';
import { toast } from '@/hooks/use-toast';
import { payrollApi, profileApi, attendanceApi } from '@/lib/api';
import { toast as sonnerToast } from 'sonner';

interface PayrollEmployee {
  id: string;
  name: string;
  employeeCode: string;
  department: string;
  basicPay: number;
  officeScore: number;
  attendance: number;
  leaves: number;
  grossPay?: number;
  totalDeductions?: number;
  netPay?: number;
}


export default function Payruns() {
  const [selectedPeriod, setSelectedPeriod] = useState('2025-11');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [isCalculated, setIsCalculated] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState('default');
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<PayrollEmployee[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  // Payroll configuration
  const [config, setConfig] = useState({
    basicPayPercent: 50,
    hraPercent: 40,
    bonusPercent: 10,
    officeScoreWeight: 5,
    pfPercent: 12,
    professionalTax: 200,
    esiPercent: 0.75,
    tdsPercent: 10,
  });

  const [calculatedEmployees, setCalculatedEmployees] = useState<PayrollEmployee[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<PayrollEmployee>>({});

  useEffect(() => {
    loadEmployees();
  }, []); // Load once on mount

  const loadEmployees = async () => {
    setLoading(true);
    try {
      // Load all employee profiles
      const profiles = await profileApi.list({ page: 1, limit: 100 });
      
      if (!profiles.items || profiles.items.length === 0) {
        sonnerToast.info('No employees found. Please add employees first.');
        setEmployees([]);
        setLoading(false);
        return;
      }
      
      // Get attendance for selected period
      const [year, month] = selectedPeriod.split('-');
      const monthStr = `${year}-${month}`;
      
      // Map employees without parallel attendance calls to avoid overwhelming the API
      const employeeData: PayrollEmployee[] = profiles.items.map((p: any) => {
        // Debug: Log department data
        if (!p.department) {
          console.warn('Employee missing department:', p.user?.name, p);
        }
        
        return {
          id: p.userId,
          name: p.user?.name || 'Unknown',
          employeeCode: p.employeeCode || 'N/A',
          department: p.department || 'Unassigned',
          basicPay: (p.metadata?.basicSalary as number) || 30000,
          officeScore: 8.0, // TODO: Get from performance data
          attendance: 22, // Default working days, will be calculated during payroll run
          leaves: 0,
        };
      });
      
      setEmployees(employeeData);
      sonnerToast.success(`Loaded ${employeeData.length} employees`);
    } catch (e) {
      sonnerToast.error(e instanceof Error ? e.message : 'Failed to load employees');
      console.error('Load employees error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmployee = (emp: PayrollEmployee) => {
    setEditingEmployee(emp.id);
    setEditValues({
      basicPay: emp.basicPay,
      grossPay: emp.grossPay,
      totalDeductions: emp.totalDeductions,
      netPay: emp.netPay,
    });
  };

  const handleSaveEdit = (empId: string) => {
    setCalculatedEmployees(prev => 
      prev.map(emp => {
        if (emp.id === empId) {
          const basicPay = editValues.basicPay ?? emp.basicPay;
          const grossPay = editValues.grossPay ?? emp.grossPay ?? 0;
          const totalDeductions = editValues.totalDeductions ?? emp.totalDeductions ?? 0;
          const netPay = editValues.netPay ?? (grossPay - totalDeductions);
          
          return {
            ...emp,
            basicPay,
            grossPay,
            totalDeductions,
            netPay,
          };
        }
        return emp;
      })
    );
    setEditingEmployee(null);
    setEditValues({});
    sonnerToast.success('Employee payroll updated');
  };

  const handleCancelEdit = () => {
    setEditingEmployee(null);
    setEditValues({});
  };

  const calculatePayroll = () => {
    const filtered = selectedDepartment === 'all' 
      ? employees 
      : employees.filter(e => e.department === selectedDepartment);

    const calculated = filtered.map(emp => {
      const basic = emp.basicPay;
      const hra = (basic * config.hraPercent) / 100;
      const performanceBonus = (basic * config.bonusPercent * emp.officeScore) / (10 * 100);
      const grossPay = basic + hra + performanceBonus;
      
      const pf = (basic * config.pfPercent) / 100;
      const esi = (grossPay * config.esiPercent) / 100;
      const tds = (grossPay * config.tdsPercent) / 100;
      const totalDeductions = pf + esi + tds + config.professionalTax;
      
      const netPay = grossPay - totalDeductions;

      return {
        ...emp,
        grossPay,
        totalDeductions,
        netPay,
      };
    });

    setCalculatedEmployees(calculated);
    setIsCalculated(true);
    toast({ title: 'Payroll Calculated', description: `${calculated.length} employees processed` });
  };

  const confirmPayrun = async () => {
    setSubmitting(true);
    try {
      // Check if user is still authenticated
      const token = localStorage.getItem('workzen_access_token');
      if (!token) {
        sonnerToast.error('Session expired. Please login again.');
        window.location.href = '/login';
        return;
      }
      
      // Calculate period dates
      const [year, month] = selectedPeriod.split('-');
      const periodStart = `${year}-${month}-01`;
      const lastDay = new Date(Number(year), Number(month), 0).getDate();
      const periodEnd = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      
      // Run payroll via backend
      await payrollApi.run({ periodStart, periodEnd });
      
      toast({ 
        title: 'Pay Run Confirmed', 
        description: 'Payslips have been generated and sent to employees',
        duration: 3000,
      });
      
      sonnerToast.success('Payroll run completed successfully!');
      
      // Reset state
      setIsCalculated(false);
      setCalculatedEmployees([]);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to run payroll';
      
      // Handle 401 Unauthorized specifically
      if (errorMessage.includes('401') || errorMessage.toLowerCase().includes('unauthorized') || errorMessage.toLowerCase().includes('invalid token')) {
        sonnerToast.error('Session expired. Please login again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (errorMessage.includes('409') || errorMessage.includes('already exists')) {
        sonnerToast.error('Payrun already exists for this month. Choose a different period.');
      } else {
        sonnerToast.error(errorMessage);
      }
      console.error('Payroll run error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const updateConfig = (key: string, value: number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    if (isCalculated) {
      setIsCalculated(false); // Reset calculation when config changes
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pay Run Management</h1>
          <p className="text-muted-foreground">Configure and execute payroll for selected period</p>
        </div>

        <Tabs defaultValue="setup" className="space-y-6">
          <TabsList>
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="calculation" disabled={!isCalculated}>Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pay Run Setup</CardTitle>
                <CardDescription>Select period and employees for payroll processing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Pay Period</Label>
                    <Input 
                      type="month" 
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="Product">Product</SelectItem>
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label>Auto-Calculate Deductions & Bonuses</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically calculate based on attendance, leaves, and performance
                    </p>
                  </div>
                  <Switch checked={autoCalculate} onCheckedChange={setAutoCalculate} />
                </div>

                <div className="flex gap-3">
                  <Button onClick={calculatePayroll} className="gap-2" disabled={loading || employees.length === 0}>
                    <Play className="h-4 w-4" />
                    {loading ? 'Loading...' : 'Run Payroll Calculation'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowTemplateModal(true)}>
                    Load Template
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Included Employees</CardTitle>
                <CardDescription>
                  {selectedDepartment === 'all' ? 'All departments' : selectedDepartment} - {
                    selectedDepartment === 'all' 
                      ? employees.length 
                      : employees.filter(e => e.department === selectedDepartment).length
                  } employees
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Basic Pay</TableHead>
                      <TableHead>Office Score</TableHead>
                      <TableHead>Attendance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={6} className="text-center">Loading employees...</TableCell></TableRow>
                    ) : employees.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center">No employees found</TableCell></TableRow>
                    ) : (selectedDepartment === 'all' ? employees : employees.filter(e => e.department === selectedDepartment)).map(emp => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.name}</TableCell>
                        <TableCell>{emp.employeeCode}</TableCell>
                        <TableCell>{emp.department}</TableCell>
                        <TableCell>₹{emp.basicPay.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={emp.officeScore >= 9 ? 'default' : emp.officeScore >= 7 ? 'secondary' : 'outline'}>
                            {emp.officeScore}/10
                          </Badge>
                        </TableCell>
                        <TableCell>{emp.attendance} days</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pay Calculation Settings</CardTitle>
                <CardDescription>Configure salary components and deductions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Current Template: <span className="text-primary">{currentTemplate}</span></h3>
                    <Button variant="outline" size="sm" onClick={() => setShowTemplateModal(true)}>
                      Change Template
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="mb-4 text-sm font-semibold text-foreground">Earnings</h4>
                    <div className="space-y-4">
                      <PercentageSlider
                        label="HRA Percentage"
                        value={config.hraPercent}
                        onChange={(val) => updateConfig('hraPercent', val)}
                        description="House Rent Allowance as % of Basic Pay"
                      />
                      <PercentageSlider
                        label="Bonus Percentage"
                        value={config.bonusPercent}
                        onChange={(val) => updateConfig('bonusPercent', val)}
                        description="Performance bonus as % of Basic Pay"
                      />
                      <PercentageSlider
                        label="Office Score Weight"
                        value={config.officeScoreWeight}
                        onChange={(val) => updateConfig('officeScoreWeight', val)}
                        max={20}
                        description="Weight of office score in bonus calculation"
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-4 text-sm font-semibold text-foreground">Deductions</h4>
                    <div className="space-y-4">
                      <PercentageSlider
                        label="PF Contribution"
                        value={config.pfPercent}
                        onChange={(val) => updateConfig('pfPercent', val)}
                        description="Provident Fund as % of Basic Pay"
                      />
                      <PercentageSlider
                        label="ESI Contribution"
                        value={config.esiPercent}
                        onChange={(val) => updateConfig('esiPercent', val)}
                        max={5}
                        description="Employee State Insurance as % of Gross"
                      />
                      <PercentageSlider
                        label="TDS Percentage"
                        value={config.tdsPercent}
                        onChange={(val) => updateConfig('tdsPercent', val)}
                        max={30}
                        description="Tax Deducted at Source"
                      />
                      <div className="space-y-2">
                        <Label>Professional Tax (Fixed Amount)</Label>
                        <Input
                          type="number"
                          value={config.professionalTax}
                          onChange={(e) => updateConfig('professionalTax', Number(e.target.value))}
                          className="max-w-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="gap-2">
                    <Save className="h-4 w-4" />
                    Save as Template
                  </Button>
                  <Button onClick={calculatePayroll} className="gap-2">
                    <Play className="h-4 w-4" />
                    Calculate with Current Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calculation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Preview</CardTitle>
                <CardDescription>Review calculated salaries before confirming</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Total Payroll</CardDescription>
                        <CardTitle>₹{calculatedEmployees.reduce((sum, e) => sum + (e.grossPay || 0), 0).toLocaleString()}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Total Deductions</CardDescription>
                        <CardTitle>₹{calculatedEmployees.reduce((sum, e) => sum + (e.totalDeductions || 0), 0).toLocaleString()}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Net Payout</CardDescription>
                        <CardTitle className="text-primary">₹{calculatedEmployees.reduce((sum, e) => sum + (e.netPay || 0), 0).toLocaleString()}</CardTitle>
                      </CardHeader>
                    </Card>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Basic</TableHead>
                        <TableHead>Gross Pay</TableHead>
                        <TableHead>Deductions</TableHead>
                        <TableHead>Net Pay</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calculatedEmployees.map(emp => (
                        <TableRow key={emp.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{emp.name}</p>
                              <p className="text-sm text-muted-foreground">{emp.employeeCode}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {editingEmployee === emp.id ? (
                              <Input
                                type="number"
                                value={editValues.basicPay ?? emp.basicPay}
                                onChange={(e) => setEditValues(prev => ({ ...prev, basicPay: Number(e.target.value) }))}
                                className="w-28"
                              />
                            ) : (
                              `₹${emp.basicPay.toLocaleString()}`
                            )}
                          </TableCell>
                          <TableCell>
                            {editingEmployee === emp.id ? (
                              <Input
                                type="number"
                                value={editValues.grossPay ?? emp.grossPay}
                                onChange={(e) => setEditValues(prev => ({ ...prev, grossPay: Number(e.target.value) }))}
                                className="w-28"
                              />
                            ) : (
                              `₹${emp.grossPay?.toLocaleString()}`
                            )}
                          </TableCell>
                          <TableCell className="text-destructive">
                            {editingEmployee === emp.id ? (
                              <Input
                                type="number"
                                value={editValues.totalDeductions ?? emp.totalDeductions}
                                onChange={(e) => setEditValues(prev => ({ ...prev, totalDeductions: Number(e.target.value) }))}
                                className="w-28"
                              />
                            ) : (
                              `₹${emp.totalDeductions?.toLocaleString()}`
                            )}
                          </TableCell>
                          <TableCell className="font-semibold text-primary">
                            {editingEmployee === emp.id ? (
                              <Input
                                type="number"
                                value={editValues.netPay ?? emp.netPay}
                                onChange={(e) => setEditValues(prev => ({ ...prev, netPay: Number(e.target.value) }))}
                                className="w-28"
                              />
                            ) : (
                              `₹${emp.netPay?.toLocaleString()}`
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {editingEmployee === emp.id ? (
                                <>
                                  <Button variant="default" size="sm" onClick={() => handleSaveEdit(emp.id)}>
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button variant="ghost" size="sm" onClick={() => handleEditEmployee(emp)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex gap-3 pt-4">
                    <Button onClick={confirmPayrun} className="gap-2" disabled={submitting || calculatedEmployees.length === 0}>
                      <FileText className="h-4 w-4" />
                      {submitting ? 'Processing...' : 'Confirm Pay Run & Generate Payslips'}
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Export Preview
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <ConfigTemplateModal 
          open={showTemplateModal}
          onOpenChange={setShowTemplateModal}
          onSelectTemplate={(template) => {
            setCurrentTemplate(template);
            toast({ title: 'Template Loaded', description: `${template} configuration applied` });
          }}
        />
      </div>
    </DashboardLayout>
  );
}
