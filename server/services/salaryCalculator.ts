type SalaryBreakup = {
  basic: { monthly: number; annual: number };
  hra: { monthly: number; annual: number };
  conveyance: { monthly: number; annual: number };
  medical: { monthly: number; annual: number };
  flexi: { monthly: number; annual: number };
  employerPF: { monthly: number; annual: number };
  fixedA: { monthly: number; annual: number }; // A
  deductions: {
    pt: { monthly: number; annual: number };
    employeePF: { monthly: number; annual: number };
    insurance: { monthly: number; annual: number };
    tds: { monthly: number; annual: number };
    total: { monthly: number; annual: number };
  };
  gross: { monthly: number; annual: number };  // equals A
  netTakeHome: { monthly: number };            // monthly in offer
};

export function calcOffer(ctcAnnual: number, tdsAnnual = 0): SalaryBreakup {
  const round0 = (n: number) => Math.round(n);

  const basicAnnual = round0(0.60 * ctcAnnual);
  const basicMonthly = basicAnnual / 12;

  const hraAnnual = round0(0.40 * basicAnnual);
  const hraMonthly = hraAnnual / 12;

  const conveyMonthly = 1600;
  const conveyAnnual = conveyMonthly * 12;

  const medicalMonthly = 1250;
  const medicalAnnual = medicalMonthly * 12;

  // PF cap: 12% of min(₹15,000, basicMonthly), max ₹1,800
  const employerPFMonthly = Math.min(0.12 * Math.min(15000, basicMonthly), 1800);
  const employerPFAnnual = employerPFMonthly * 12;

  const fixedAAnnual = ctcAnnual - employerPFAnnual;

  const flexiAnnual = fixedAAnnual - (basicAnnual + hraAnnual + conveyAnnual + medicalAnnual);
  const flexiMonthly = flexiAnnual / 12;

  const grossMonthly = (basicAnnual + hraAnnual + conveyAnnual + medicalAnnual + flexiAnnual) / 12;
  const grossAnnual = fixedAAnnual;

  const employeePFMonthly = employerPFMonthly; // mirror employer side
  const employeePFAnnual = employeePFMonthly * 12;

  const ptMonthly = 200, ptAnnual = ptMonthly * 12;
  const insuranceMonthly = 500, insuranceAnnual = insuranceMonthly * 12;

  const tdsMonthly = tdsAnnual / 12;

  const totalDedMonthly = employeePFMonthly + ptMonthly + insuranceMonthly + tdsMonthly;
  const totalDedAnnual = employeePFAnnual + ptAnnual + insuranceAnnual + tdsAnnual;

  const netTakeHomeMonthly = grossMonthly - totalDedMonthly;

  return {
    basic: { monthly: round0(basicMonthly), annual: basicAnnual },
    hra: { monthly: round0(hraMonthly), annual: hraAnnual },
    conveyance: { monthly: conveyMonthly, annual: conveyAnnual },
    medical: { monthly: medicalMonthly, annual: medicalAnnual },
    flexi: { monthly: round0(flexiMonthly), annual: flexiAnnual },
    employerPF: { monthly: employerPFMonthly, annual: employerPFAnnual },
    fixedA: { monthly: grossMonthly, annual: fixedAAnnual },
    deductions: {
      pt: { monthly: ptMonthly, annual: ptAnnual },
      employeePF: { monthly: employeePFMonthly, annual: employeePFAnnual },
      insurance: { monthly: insuranceMonthly, annual: insuranceAnnual },
      tds: { monthly: tdsMonthly, annual: tdsAnnual },
      total: { monthly: totalDedMonthly, annual: totalDedAnnual },
    },
    gross: { monthly: grossMonthly, annual: grossAnnual },
    netTakeHome: { monthly: netTakeHomeMonthly },
  };
}

// Convert to database fields for offer letter creation
export function convertToOfferLetterFields(salary: SalaryBreakup) {
  return {
    basicSalary: salary.basic.annual,
    hra: salary.hra.annual,
    conveyanceAllowance: salary.conveyance.annual,
    medicalAllowance: salary.medical.annual,
    flexiPay: salary.flexi.annual,
    specialAllowance: 0, // Not used in new calculation
    employerPf: salary.employerPF.annual,
    otherBenefits: 0, // Not used in new calculation
    employeePf: salary.deductions.employeePF.annual,
    professionalTax: salary.deductions.pt.annual,
    insurance: salary.deductions.insurance.annual,
    incomeTax: salary.deductions.tds.annual,
    otherDeductions: salary.deductions.insurance.annual, // Include insurance as other deductions
    netSalary: salary.netTakeHome.monthly * 12, // Annual net
    grossSalary: salary.gross.annual
  };
}