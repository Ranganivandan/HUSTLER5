import { Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface PayslipData {
  employeeName: string;
  employeeId: string;
  designation: string;
  payPeriod: string;
  basicPay: number;
  hra: number;
  bonus: number;
  gross: number;
  pf: number;
  employerPf: number;
  tax: number;
  esi: number;
  totalDeductions: number;
  absentDays: number;
  dayDeduction: number;
  extraPaidLeaveHours: number;
  paidLeaveHourDeduction: number;
  netPay: number;
  ctc: number;
  officeScore: number;
  presentDays?: number;
  workingDays?: number;
}

interface PayslipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payslip: PayslipData;
}

export function PayslipModal({ open, onOpenChange, payslip }: PayslipModalProps) {
  const handleDownload = () => {
    try {
      console.log('Starting PDF generation from modal...', payslip);
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('WorkZen', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Payslip for ${payslip.payPeriod}`, 105, 28, { align: 'center' });
      
      // Line separator
      doc.setLineWidth(0.5);
      doc.line(20, 32, 190, 32);
      
      // Employee Details
      let yPos = 42;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Employee Details', 20, yPos);
      
      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.text('Employee Name:', 20, yPos);
      doc.text(String(payslip.employeeName), 70, yPos);
      
      yPos += 6;
      doc.text('Employee ID:', 20, yPos);
      doc.text(String(payslip.employeeId), 70, yPos);
      
      yPos += 6;
      doc.text('Designation:', 20, yPos);
      doc.text(String(payslip.designation), 70, yPos);
      
      yPos += 6;
      doc.text('Pay Period:', 20, yPos);
      doc.text(String(payslip.payPeriod), 70, yPos);
      
      // Earnings Section
      yPos += 12;
      doc.setFont('helvetica', 'bold');
      doc.text('Earnings', 20, yPos);
      
      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.text('Basic Pay', 20, yPos);
      doc.text(`Rs ${payslip.basicPay.toLocaleString()}`, 170, yPos, { align: 'right' });
      
      yPos += 6;
      doc.text('HRA (20%)', 20, yPos);
      doc.text(`₹${payslip.hra.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 170, yPos, { align: 'right' });
      
      yPos += 6;
      doc.text(`Bonus (10% × ${payslip.officeScore}/10)`, 20, yPos);
      doc.text(`₹${payslip.bonus.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 170, yPos, { align: 'right' });
      
      yPos += 8;
      doc.setLineWidth(0.3);
      doc.line(20, yPos, 190, yPos);
      
      yPos += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Gross Pay', 20, yPos);
      doc.text(`₹${payslip.gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 170, yPos, { align: 'right' });
      
      // Deductions Section
      yPos += 12;
      doc.text('Deductions', 20, yPos);
      
      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.text('PF - Employee (12%)', 20, yPos);
      doc.text(`₹${payslip.pf.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 170, yPos, { align: 'right' });
      
      yPos += 6;
      doc.text('TDS (5%)', 20, yPos);
      doc.text(`₹${payslip.tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 170, yPos, { align: 'right' });
      
      yPos += 6;
      doc.text('ESI (0.75%)', 20, yPos);
      doc.text(`₹${payslip.esi.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 170, yPos, { align: 'right' });
      
      if (payslip.dayDeduction > 0) {
        yPos += 6;
        doc.text(`Absent Days (${payslip.absentDays})`, 20, yPos);
        doc.text(`₹${payslip.dayDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 170, yPos, { align: 'right' });
      }
      
      if (payslip.paidLeaveHourDeduction > 0) {
        yPos += 6;
        doc.text(`Excess Paid Leave (${payslip.extraPaidLeaveHours}hrs)`, 20, yPos);
        doc.text(`₹${payslip.paidLeaveHourDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 170, yPos, { align: 'right' });
      }
      
      yPos += 8;
      doc.line(20, yPos, 190, yPos);
      
      yPos += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Total Deductions', 20, yPos);
      doc.text(`₹${payslip.totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 170, yPos, { align: 'right' });
      
      // Net Pay Box
      yPos += 12;
      doc.setFillColor(240, 240, 240);
      doc.rect(20, yPos - 5, 170, 20, 'F');
      
      doc.setFontSize(12);
      doc.text('Net Pay', 105, yPos + 2, { align: 'center' });
      
      doc.setFontSize(18);
      doc.text(`Rs ${payslip.netPay.toLocaleString()}`, 105, yPos + 10, { align: 'center' });
      
      // Footer
      yPos += 25;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Employer Contributions: PF ₹${payslip.employerPf.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 20, yPos);
      
      yPos += 5;
      doc.text(`CTC (Cost to Company): ₹${payslip.ctc.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 20, yPos);
      
      yPos += 5;
      doc.text(`Office Score: ${payslip.officeScore}/10`, 20, yPos);
      
      yPos += 5;
      doc.setFont('helvetica', 'italic');
      doc.text('This is a computer-generated payslip and does not require a signature.', 20, yPos);
      
      // Save PDF
      console.log('Saving PDF from modal...');
      doc.save(`payslip-${payslip.payPeriod.replace(/\s+/g, '-')}.pdf`);
      console.log('PDF saved successfully from modal');
      toast.success('Payslip downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

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

          {/* Attendance Info */}
          {payslip.workingDays && (
            <div className="grid grid-cols-2 gap-4 bg-muted/50 p-3 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Working Days</p>
                <p className="font-medium">{payslip.presentDays || 0} / {payslip.workingDays}</p>
              </div>
              {payslip.absentDays > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Absent Days</p>
                  <p className="font-medium text-destructive">{payslip.absentDays}</p>
                </div>
              )}
            </div>
          )}

          {/* Earnings */}
          <div>
            <h3 className="mb-3 font-semibold">Earnings</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Basic Pay (50%)</span>
                <span className="font-medium">₹{payslip.basicPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">HRA (20%)</span>
                <span className="font-medium">₹{payslip.hra.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Bonus (10% × {payslip.officeScore}/10)
                </span>
                <span className="font-medium">₹{payslip.bonus.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Gross Pay</span>
                <span>₹{payslip.gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <h3 className="mb-3 font-semibold">Deductions</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">PF - Employee (12%)</span>
                <span className="font-medium">₹{payslip.pf.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TDS (5%)</span>
                <span className="font-medium">₹{payslip.tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ESI (0.75%)</span>
                <span className="font-medium">₹{payslip.esi.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {payslip.dayDeduction > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Absent Days Deduction</span>
                  <span className="font-medium text-destructive">₹{payslip.dayDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {payslip.paidLeaveHourDeduction > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Excess Paid Leave ({payslip.extraPaidLeaveHours}hrs)</span>
                  <span className="font-medium text-destructive">₹{payslip.paidLeaveHourDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total Deductions</span>
                <span>₹{payslip.totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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
