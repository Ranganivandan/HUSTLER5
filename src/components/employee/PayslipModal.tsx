import { Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface PayslipData {
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
  officeScore: number;
  officeScoreBonus: number;
  netPay: number;
  ctc: number;
}

interface PayslipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payslip: PayslipData;
}

export function PayslipModal({ open, onOpenChange, payslip }: PayslipModalProps) {
  const handleDownload = () => {
    // Mock PDF download
    const blob = new Blob(['Payslip PDF content'], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip-${payslip.payPeriod}.pdf`;
    a.click();
  };

  const grossPay = payslip.basicPay + payslip.hra + payslip.bonus + payslip.officeScoreBonus;
  const totalDeductions = payslip.pf + payslip.professionalTax + payslip.tds;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Payslip</DialogTitle>
            <Button size="sm" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground mx-auto">
              <span className="text-lg font-bold">WZ</span>
            </div>
            <h2 className="text-2xl font-bold">WorkZen</h2>
            <p className="text-sm text-muted-foreground">Payslip for {payslip.payPeriod}</p>
          </div>

          <Separator />

          {/* Employee Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Employee Name</p>
              <p className="font-medium">{payslip.employeeName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Employee ID</p>
              <p className="font-medium">{payslip.employeeId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Designation</p>
              <p className="font-medium">{payslip.designation}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pay Period</p>
              <p className="font-medium">{payslip.payPeriod}</p>
            </div>
          </div>

          <Separator />

          {/* Earnings */}
          <div>
            <h3 className="mb-3 font-semibold">Earnings</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Basic Pay</span>
                <span className="font-medium">₹{payslip.basicPay.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">HRA</span>
                <span className="font-medium">₹{payslip.hra.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bonus</span>
                <span className="font-medium">₹{payslip.bonus.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Office Score Bonus ({payslip.officeScore}/10)
                </span>
                <span className="font-medium">₹{payslip.officeScoreBonus.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Gross Pay</span>
                <span>₹{grossPay.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <h3 className="mb-3 font-semibold">Deductions</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">PF (12%)</span>
                <span className="font-medium">₹{payslip.pf.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Professional Tax</span>
                <span className="font-medium">₹{payslip.professionalTax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TDS</span>
                <span className="font-medium">₹{payslip.tds.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total Deductions</span>
                <span>₹{totalDeductions.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Net Pay */}
          <div className="rounded-lg bg-primary/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Pay</p>
                <p className="text-3xl font-bold text-primary">₹{payslip.netPay.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">CTC</p>
                <p className="text-xl font-semibold">₹{payslip.ctc.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="rounded-lg bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">
              <strong>Employer Contributions:</strong> PF ₹{payslip.pf.toLocaleString()}, ESI ₹0
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              <strong>Notes:</strong> Includes attendance bonus and office score evaluation.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
