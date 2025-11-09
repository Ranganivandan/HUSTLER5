/**
 * Enhanced Payroll Calculator with accurate salary components
 * Handles NaN prevention, unpaid leave deductions, and paid leave hour deductions
 */

/**
 * Safe number conversion - prevents NaN values
 */
export function safe(val: any): number {
  const num = Number(val);
  return isNaN(num) || !isFinite(num) ? 0 : num;
}

/**
 * Round to 2 decimal places
 */
export function round2(n: number): number {
  return Math.round(safe(n) * 100) / 100;
}

/**
 * Input parameters for payslip calculation
 */
export interface PayslipCalculationInput {
  salary: number;                    // Monthly salary
  officeScore?: number;              // Office score (0-10), default 10
  absentDays?: number;               // Unpaid absent days
  totalWorkingDays?: number;         // Total working days in month, default 26
  extraPaidLeaveHours?: number;      // Extra paid leave hours beyond allowance
  standardWorkHoursPerDay?: number;  // Standard work hours per day, default 8
}

/**
 * Complete payslip breakdown
 */
export interface PayslipBreakdown {
  // Salary Components
  basic: number;                     // 50% of salary
  hra: number;                       // 20% of salary
  bonus: number;                     // 10% of salary × (officeScore / 10)
  gross: number;                     // Basic + HRA + Bonus
  
  // Deductions
  pf: number;                        // 12% of Basic (Employee contribution)
  employerPf: number;                // 12% of Basic (Employer contribution)
  tax: number;                       // 5% of Gross (TDS)
  esi: number;                       // 0.75% of Gross
  totalDeductions: number;           // PF + Tax + ESI
  
  // Leave Deductions
  dayDeduction: number;              // Per-day salary × absent days
  paidLeaveHourDeduction: number;    // Per-hour salary × extra paid leave hours
  
  // Final Amounts
  netBeforeLeaveDeductions: number;  // Gross - Total Deductions
  finalNet: number;                  // Net - Day Deduction - Paid Leave Hour Deduction
  ctc: number;                       // Gross + Employer PF
  
  // Metadata
  officeScoreBonus: number;          // Bonus amount based on office score
  perDaySalary: number;              // Daily salary rate
  perHourSalary: number;             // Hourly salary rate
  absentDays: number;                // Number of absent days
  extraPaidLeaveHours: number;       // Extra paid leave hours
}

/**
 * Calculate comprehensive payslip with all components
 * 
 * @param input - Calculation parameters
 * @returns Complete payslip breakdown
 * 
 * @example
 * ```typescript
 * const payslip = calculatePayslip({
 *   salary: 80000,
 *   officeScore: 10,
 *   absentDays: 2,
 *   extraPaidLeaveHours: 4
 * });
 * // Returns: { basic: 40000, hra: 16000, bonus: 8000, ... finalNet: 46907.68 }
 * ```
 */
export function calculatePayslip(input: PayslipCalculationInput): PayslipBreakdown {
  // Sanitize inputs
  const salary = safe(input.salary);
  const officeScore = safe(input.officeScore ?? 10);
  const absentDays = safe(input.absentDays ?? 0);
  const totalWorkingDays = safe(input.totalWorkingDays ?? 26);
  const extraPaidLeaveHours = safe(input.extraPaidLeaveHours ?? 0);
  const standardWorkHoursPerDay = safe(input.standardWorkHoursPerDay ?? 8);

  // Salary Components (50% + 20% + 10% = 80% of salary)
  const basic = round2(salary * 0.5);
  const hra = round2(salary * 0.2);
  const bonusBase = round2(salary * 0.1);
  const officeScoreMultiplier = Math.min(Math.max(officeScore, 0), 10) / 10; // Clamp 0-10
  const bonus = round2(bonusBase * officeScoreMultiplier);
  const officeScoreBonus = bonus; // Same as bonus for clarity
  
  const gross = round2(basic + hra + bonus);

  // Leave Deductions (calculated from gross pay, not total salary)
  const perDaySalary = totalWorkingDays > 0 ? round2(gross / totalWorkingDays) : 0;
  const perHourSalary = (totalWorkingDays > 0 && standardWorkHoursPerDay > 0) 
    ? round2(gross / (totalWorkingDays * standardWorkHoursPerDay)) 
    : 0;

  const dayDeduction = round2(perDaySalary * absentDays);
  const paidLeaveHourDeduction = round2(perHourSalary * extraPaidLeaveHours);

  // Deductions
  const pf = round2(basic * 0.12);           // Employee PF: 12% of Basic
  const employerPf = round2(basic * 0.12);   // Employer PF: 12% of Basic
  const tax = round2(gross * 0.05);          // TDS: 5% of Gross
  const esi = round2(gross * 0.0075);        // ESI: 0.75% of Gross
  const totalDeductions = round2(pf + tax + esi + dayDeduction + paidLeaveHourDeduction);

  // Final Net Pay (cannot be negative)
  const finalNet = Math.max(
    round2(gross - totalDeductions),
    0
  );

  // CTC (Cost to Company)
  const ctc = round2(gross + employerPf);

  return {
    basic,
    hra,
    bonus,
    gross,
    pf,
    employerPf,
    tax,
    esi,
    totalDeductions,
    dayDeduction,
    paidLeaveHourDeduction,
    netBeforeLeaveDeductions: round2(gross - pf - tax - esi), // Net before leave deductions
    finalNet,
    ctc,
    officeScoreBonus,
    perDaySalary,
    perHourSalary,
    absentDays,
    extraPaidLeaveHours,
  };
}

/**
 * Count working days (excluding weekends) between two dates
 */
export function countWorkingDays(start: Date, end: Date): number {
  let days = 0;
  const current = new Date(start);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return days;
}

/**
 * Format currency in INR
 */
export function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe(value));
}

/**
 * Legacy compatibility - maps old computePayslip to new calculatePayslip
 * @deprecated Use calculatePayslip instead
 */
export function computePayslip(input: {
  basicSalary: number;
  workingDays: number;
  presentDays: number;
  professionalTaxFlat?: number;
}): {
  gross: number;
  pf: number;
  professionalTax: number;
  unpaidLeaveDeduction: number;
  net: number;
} {
  const absentDays = Math.max(0, input.workingDays - input.presentDays);
  
  const result = calculatePayslip({
    salary: safe(input.basicSalary),
    absentDays,
    totalWorkingDays: input.workingDays,
  });

  return {
    gross: result.gross,
    pf: result.pf,
    professionalTax: safe(input.professionalTaxFlat ?? 0), // Keep for compatibility
    unpaidLeaveDeduction: result.dayDeduction,
    net: result.finalNet,
  };
}
