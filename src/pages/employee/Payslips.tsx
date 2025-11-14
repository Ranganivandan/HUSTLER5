import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PayslipModal } from '@/components/employee/PayslipModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Eye } from 'lucide-react';
import { payrollApi, profileApi } from '@/lib/api';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

type PayslipData = {
  id: string;
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
        profileApi.getMe().catch(() => ({ employeeCode: 'N/A', designation: 'N/A', user: { name: 'N/A' } })),
      ]);
      setProfile(profileData);
      
      console.log('Raw payslip data:', payslipData);
      
      const formattedPayslips: PayslipData[] = payslipData
        .map((p: any) => {
          const formatted = {
            id: p.id,
            employeeName: (profileData as any).user?.name || 'N/A',
            employeeId: (profileData as any).employeeCode || 'N/A',
            designation: (profileData as any).designation || 'N/A',
            payPeriod: new Date(p.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            basicPay: Number(p.basic || 0),
            hra: Number(p.hra || 0),
            bonus: Number(p.bonus || 0),
            gross: Number(p.gross || 0),
            pf: Number(p.pf || 0),
            employerPf: Number(p.employerPf || 0),
            tax: Number(p.tax || 0),
            esi: Number(p.esi || 0),
            totalDeductions: Number(p.totalDeductions || 0),
            absentDays: Number(p.absentDays || 0),
            dayDeduction: Number(p.dayDeduction || 0),
            extraPaidLeaveHours: Number(p.extraPaidLeaveHours || 0),
            paidLeaveHourDeduction: Number(p.paidLeaveHourDeduction || 0),
            netPay: Number(p.net || 0),
            ctc: Number(p.ctc || 0),
            officeScore: Number(p.officeScore || 10),
            presentDays: p.components?.presentDays,
            workingDays: p.components?.workingDays,
          };
          console.log('Formatted payslip:', formatted);
          return formatted;
        })
        .filter((p) => {
          // Only filter out completely invalid payslips (both net and gross are 0)
          const isValid = !(p.netPay === 0 && p.gross === 0);
          if (!isValid) {
            console.log('Filtering out invalid payslip:', p);
          }
          return isValid;
        });
      
      console.log('Final payslips to display:', formattedPayslips);
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
    try {
      console.log('Starting PDF generation...', payslip);
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
      
      // Attendance Info
      if (payslip.workingDays) {
        yPos += 6;
        doc.text('Working Days:', 20, yPos);
        doc.text(`${payslip.presentDays || 0} / ${payslip.workingDays}`, 70, yPos);
      }
      
      if (payslip.absentDays > 0) {
        yPos += 6;
        doc.text('Absent Days:', 20, yPos);
        doc.text(String(payslip.absentDays), 70, yPos);
      }
      
      // Earnings Section
      yPos += 12;
      doc.setFont('helvetica', 'bold');
      doc.text('Earnings', 20, yPos);
      
      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.text('Basic Pay (50%)', 20, yPos);
      doc.text(`₹${payslip.basicPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 170, yPos, { align: 'right' });
      
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
      doc.text('PF - Employee (12% of Basic)', 20, yPos);
      doc.text(`₹${payslip.pf.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 170, yPos, { align: 'right' });
      
      yPos += 6;
      doc.text('TDS (5% of Gross)', 20, yPos);
      doc.text(`₹${payslip.tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 170, yPos, { align: 'right' });
      
      yPos += 6;
      doc.text('ESI (0.75% of Gross)', 20, yPos);
      doc.text(`₹${payslip.esi.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 170, yPos, { align: 'right' });
      
      if (payslip.dayDeduction > 0) {
        yPos += 6;
        doc.text(`Absent Days Deduction (${payslip.absentDays} days)`, 20, yPos);
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
      console.log('Saving PDF...');
      doc.save(`payslip-${payslip.payPeriod.replace(/\s+/g, '-')}.pdf`);
      console.log('PDF saved successfully');
      toast.success('Payslip downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">No payslips available yet</p>
              <p className="text-sm text-muted-foreground">
                Payslips will appear here once payroll is generated by your administrator.
              </p>
            </div>
          ) : payslips.map((payslip, index) => (
            <Card key={index}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">{payslip.payPeriod}</h3>
                  <div className="flex gap-6 text-sm text-muted-foreground">
                    <span>Gross: ₹{payslip.gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    <span>Deductions: ₹{payslip.totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    <span className="font-semibold text-primary">Net: ₹{payslip.netPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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
