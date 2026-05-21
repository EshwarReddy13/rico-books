export type LoanSummary = {
  id: string;
  liabilityAccountId: string;
  financedAssetAccountId: string | null;
  agreementNo: string;
  lender: string;
  loanType: string;
  amountFinancedPaise: number;
  tenure: number;
  frequency: string;
  totalPayablePaise: number;
  totalInterestPaise: number;
  scheduleGeneratedDate: string | null;
  scheduleRowCount: number;
  matchedScheduleCount: number;
};

export type ScheduleRowPreview = {
  installmentNo: number;
  dueDate: string;
  emiAmountPaise: number;
  principalAmountPaise: number;
  interestAmountPaise: number;
  closingBalancePaise: number;
};

export type LoanScheduleExtractResult = {
  header: {
    agreementNo: string;
    lender: string;
    loanType: string;
    amountFinancedPaise: number;
    tenure: number;
    frequency: string;
    totalPayablePaise: number;
    totalInterestPaise: number;
    scheduleGeneratedDate: string | null;
  };
  rows: ScheduleRowPreview[];
};

export type ScheduleChecksumResult = {
  ok: boolean;
  errors: string[];
};

export type SchedulePaymentStatus = "paid" | "pending" | "due";

export type LoanScheduleRowView = {
  id: string;
  installmentNo: number;
  dueDate: string;
  emiAmountPaise: number;
  principalAmountPaise: number;
  interestAmountPaise: number;
  closingBalancePaise: number;
  matchedTxnId: string | null;
  paymentStatus: SchedulePaymentStatus;
  matchedTransaction: {
    id: string;
    date: string;
    amountPaise: number;
    rawDescription: string;
    status: "pending_review" | "confirmed";
  } | null;
};

export type LoanScheduleView = {
  loanId: string;
  liabilityName: string;
  amountFinancedPaise: number;
  /** Principal still owed (financed − principal on linked EMIs). */
  outstandingBalancePaise: number;
  rows: LoanScheduleRowView[];
  matchedCount: number;
  paidCount: number;
  pendingCount: number;
  totalCount: number;
};
