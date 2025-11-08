export type PayrollInputs = {
  basicSalary: number;
  workingDays: number;
  presentDays: number;
  professionalTaxFlat?: number; // if provided, overrides slab
};

export type PayrollBreakup = {
  gross: number;
  pf: number;
  professionalTax: number;
  unpaidLeaveDeduction: number;
  net: number;
};

export function computePF(basicSalary: number) {
  return round2(basicSalary * 0.12);
}

export function computeProfessionalTax(amount: number, flat?: number) {
  if (typeof flat === 'number') return round2(flat);
  // simple slab: <=15k => 150; <=25k => 200; >25k => 250
  if (amount <= 15000) return 150;
  if (amount <= 25000) return 200;
  return 250;
}

export function computeUnpaidLeaveDeduction(basicSalary: number, workingDays: number, presentDays: number) {
  const unpaidDays = Math.max(0, workingDays - presentDays);
  const perDay = basicSalary / Math.max(1, workingDays);
  return round2(unpaidDays * perDay);
}

export function computePayslip(input: PayrollInputs): PayrollBreakup {
  const gross = round2(input.basicSalary);
  const pf = computePF(input.basicSalary);
  const professionalTax = computeProfessionalTax(gross, input.professionalTaxFlat);
  const unpaidLeaveDeduction = computeUnpaidLeaveDeduction(input.basicSalary, input.workingDays, input.presentDays);
  const net = round2(gross - pf - professionalTax - unpaidLeaveDeduction);
  return { gross, pf, professionalTax, unpaidLeaveDeduction, net };
}

export function countWorkingDays(start: Date, end: Date) {
  let days = 0;
  const d = new Date(start);
  while (d <= end) {
    const day = d.getDay(); // 0 Sun, 6 Sat
    if (day !== 0 && day !== 6) days++;
    d.setDate(d.getDate() + 1);
  }
  return days;
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}
