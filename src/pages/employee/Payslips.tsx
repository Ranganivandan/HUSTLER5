import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PayslipModal } from '@/components/employee/PayslipModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Eye } from 'lucide-react';
import { payrollApi, profileApi } from '@/lib/api';
import { toast } from 'sonner';

type PayslipData = {
  id: string;
  employeeName: string;
  employeeId: string;
  designation: string;
  payPeriod: string;
  basicPay: number;
  hra: number;
  bonus: number;
  pf: number;
  professionalTax: number;
  tds: number;
  netPay: number;
  gross: number;
};

export default function Payslips() {
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [payslips, setPayslips] = useState<PayslipData[]>([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [payslipData, profileData] = await Promise.all([
        payrollApi.getMyPayslips().catch(() => []),
        profileApi.getMe().catch(() => ({ employeeCode: 'N/A', designation: 'N/A' })),
      ]);
      setProfile(profileData);
      
      const formattedPayslips: PayslipData[] = payslipData.map((p: any) => ({
        id: p.id,
        employeeName: profileData.user?.name || 'N/A',
        employeeId: profileData.employeeCode || 'N/A',
        designation: profileData.designation || 'N/A',
        payPeriod: new Date(p.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        basicPay: Number(p.basic),
        hra: Number(p.hra),
        bonus: Number(p.bonus),
        pf: Number(p.pf),
        professionalTax: Number(p.professionalTax),
        tds: Number(p.tds),
        netPay: Number(p.net),
        gross: Number(p.gross),
      }));
      setPayslips(formattedPayslips);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load payslips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleView = (payslip: PayslipData) => {
    setSelectedPayslip(payslip);
    setModalOpen(true);
  };

  const handleDownload = (payslip: PayslipData) => {
    // Generate simple PDF content
    const pdfContent = `
PAYSLIP - ${payslip.payPeriod}

Employee: ${payslip.employeeName}
Employee ID: ${payslip.employeeId}
Designation: ${payslip.designation}

EARNINGS:
Basic Pay: ₹${payslip.basicPay.toLocaleString()}
HRA: ₹${payslip.hra.toLocaleString()}
Bonus: ₹${payslip.bonus.toLocaleString()}
Gross: ₹${payslip.gross.toLocaleString()}

DEDUCTIONS:
PF: ₹${payslip.pf.toLocaleString()}
Professional Tax: ₹${payslip.professionalTax.toLocaleString()}
TDS: ₹${payslip.tds.toLocaleString()}

NET PAY: ₹${payslip.netPay.toLocaleString()}
    `;
    
    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip-${payslip.payPeriod.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Payslip downloaded successfully');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payslips</h1>
          <p className="text-muted-foreground">View and download your salary payslips</p>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <p className="text-muted-foreground">Loading payslips...</p>
          ) : payslips.length === 0 ? (
            <p className="text-muted-foreground">No payslips found</p>
          ) : payslips.map((payslip, index) => (
            <Card key={index}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">{payslip.payPeriod}</h3>
                  <div className="flex gap-6 text-sm text-muted-foreground">
                    <span>Gross: ₹{payslip.gross.toLocaleString()}</span>
                    <span>Deductions: ₹{(payslip.pf + payslip.professionalTax + payslip.tds).toLocaleString()}</span>
                    <span className="font-semibold text-primary">Net: ₹{payslip.netPay.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleView(payslip)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <Button size="sm" onClick={() => handleDownload(payslip)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedPayslip && (
          <PayslipModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            payslip={selectedPayslip}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
