const TEXT_MAX = 120;

export type LoanInput = {
  agreementNo?: string;
  lender?: string;
  loanType?: string;
  amountFinanced?: string;
  tenure?: string;
  frequency?: string;
  totalPayable?: string;
  totalInterest?: string;
  scheduleGeneratedDate?: string;
  financedAssetAccountId?: string | null;
};

export type ParsedLoan = {
  agreementNo: string;
  lender: string;
  loanType: string;
  amountFinancedPaise: bigint;
  tenure: number;
  frequency: string;
  totalPayablePaise: bigint;
  totalInterestPaise: bigint;
  scheduleGeneratedDate: Date | null;
  financedAssetAccountId: string | null;
};

function parseRupeePaise(raw: string | undefined, label: string): bigint | { error: string } {
  const trimmed = (raw ?? "").trim().replace(/,/g, "");
  if (!trimmed) {
    return { error: `${label} is required.` };
  }
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount < 0) {
    return { error: `${label} must be a valid number.` };
  }
  return BigInt(Math.round(amount * 100));
}

function parseOptionalDate(raw: string | undefined): Date | null | { error: string } {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    return null;
  }
  const date = new Date(`${trimmed}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return { error: "Schedule date is invalid." };
  }
  return date;
}

export function parseLoanInput(
  input: LoanInput,
): ParsedLoan | { error: string } {
  const agreementNo = (input.agreementNo ?? "").trim().slice(0, TEXT_MAX);
  const lender = (input.lender ?? "").trim().slice(0, TEXT_MAX);
  const loanType = (input.loanType ?? "").trim().slice(0, TEXT_MAX);

  const amountFinancedPaise = parseRupeePaise(
    input.amountFinanced,
    "Amount financed",
  );
  if (typeof amountFinancedPaise === "object" && "error" in amountFinancedPaise) {
    return amountFinancedPaise;
  }

  const tenureRaw = (input.tenure ?? "").trim();
  const tenure = Number.parseInt(tenureRaw, 10);
  if (!Number.isFinite(tenure) || tenure < 1) {
    return { error: "Tenure (months) must be at least 1." };
  }

  const totalPayablePaise = parseRupeePaise(input.totalPayable, "Total payable");
  if (typeof totalPayablePaise === "object" && "error" in totalPayablePaise) {
    return totalPayablePaise;
  }

  const totalInterestPaise = parseRupeePaise(
    input.totalInterest,
    "Total interest",
  );
  if (typeof totalInterestPaise === "object" && "error" in totalInterestPaise) {
    return totalInterestPaise;
  }

  const scheduleGeneratedDate = parseOptionalDate(input.scheduleGeneratedDate);
  if (
    typeof scheduleGeneratedDate === "object" &&
    scheduleGeneratedDate &&
    "error" in scheduleGeneratedDate
  ) {
    return scheduleGeneratedDate;
  }

  const frequency = (input.frequency ?? "monthly").trim() || "monthly";

  return {
    agreementNo,
    lender,
    loanType,
    amountFinancedPaise,
    tenure,
    frequency,
    totalPayablePaise,
    totalInterestPaise,
    scheduleGeneratedDate: scheduleGeneratedDate as Date | null,
    financedAssetAccountId: input.financedAssetAccountId?.trim() || null,
  };
}
