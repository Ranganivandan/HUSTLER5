import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PayslipModal } from '@/components/employee/PayslipModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Eye } from 'lucide-react';

const mockPayslips = [
  {
    employeeName: 'Asha Patel',
    employeeId: 'WZ-1001',
    designation: 'Software Engineer',
    payPeriod: 'October 2025',
    basicPay: 50000,
    hra: 20000,
    bonus: 5000,
    pf: 1800,
    professionalTax: 200,
    tds: 1500,
    officeScore: 8.5,
    officeScoreBonus: 2000,
    netPay: 73500,
    ctc: 88000,
  },
  {
    employeeName: 'Asha Patel',
    employeeId: 'WZ-1001',
    designation: 'Software Engineer',
    payPeriod: 'September 2025',
    basicPay: 50000,
    hra: 20000,
    bonus: 5000,
    pf: 1800,
    professionalTax: 200,
    tds: 1500,
    officeScore: 8.0,
    officeScoreBonus: 1800,
    netPay: 73300,
    ctc: 88000,
  },
  {
    employeeName: 'Asha Patel',
    employeeId: 'WZ-1001',
    designation: 'Software Engineer',
    payPeriod: 'August 2025',
    basicPay: 50000,
    hra: 20000,
    bonus: 5000,
    pf: 1800,
    professionalTax: 200,
    tds: 1500,
    officeScore: 9.0,
    officeScoreBonus: 2200,
    netPay: 73700,
    ctc: 88000,
  },
];

export default function Payslips() {
  const [selectedPayslip, setSelectedPayslip] = useState<typeof mockPayslips[0] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleView = (payslip: typeof mockPayslips[0]) => {
    setSelectedPayslip(payslip);
    setModalOpen(true);
  };

  const handleDownload = (payslip: typeof mockPayslips[0]) => {
    const blob = new Blob(['Payslip PDF content'], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip-${payslip.payPeriod}.pdf`;
    a.click();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payslips</h1>
          <p className="text-muted-foreground">View and download your salary payslips</p>
        </div>

        <div className="grid gap-4">
          {mockPayslips.map((payslip, index) => (
            <Card key={index}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">{payslip.payPeriod}</h3>
                  <div className="flex gap-6 text-sm text-muted-foreground">
                    <span>Gross: ₹{(payslip.basicPay + payslip.hra + payslip.bonus + payslip.officeScoreBonus).toLocaleString()}</span>
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
