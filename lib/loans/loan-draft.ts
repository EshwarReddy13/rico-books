import { paiseToRupeeInput } from "@/lib/accounts/format-balance";
import type { LoanPayload } from "@/lib/accounts/account-api";
import type { LoanScheduleExtractResult, LoanSummary } from "@/lib/loans/types";

export type LoanDraft = {
  agreementNo: string;
  lender: string;
  loanType: string;
  amountFinanced: string;
  tenure: string;
  frequency: string;
  totalPayable: string;
  totalInterest: string;
  scheduleGeneratedDate: string;
  financedAssetAccountId: string;
};

export const emptyLoanDraft = (): LoanDraft => ({
  agreementNo: "",
  lender: "",
  loanType: "Auto Loan",
  amountFinanced: "",
  tenure: "",
  frequency: "monthly",
  totalPayable: "",
  totalInterest: "",
  scheduleGeneratedDate: "",
  financedAssetAccountId: "",
});

export function loanDraftFromSummary(loan: LoanSummary): LoanDraft {
  return {
    agreementNo: loan.agreementNo,
    lender: loan.lender,
    loanType: loan.loanType || "Auto Loan",
    amountFinanced: paiseToRupeeInput(loan.amountFinancedPaise),
    tenure: String(loan.tenure),
    frequency: loan.frequency || "monthly",
    totalPayable: paiseToRupeeInput(loan.totalPayablePaise),
    totalInterest: paiseToRupeeInput(loan.totalInterestPaise),
    scheduleGeneratedDate: loan.scheduleGeneratedDate ?? "",
    financedAssetAccountId: loan.financedAssetAccountId ?? "",
  };
}

export function loanDraftFromExtractHeader(
  header: LoanScheduleExtractResult["header"],
): LoanDraft {
  return {
    agreementNo: header.agreementNo,
    lender: header.lender,
    loanType: header.loanType || "Auto Loan",
    amountFinanced: paiseToRupeeInput(header.amountFinancedPaise),
    tenure: String(header.tenure),
    frequency: header.frequency || "monthly",
    totalPayable: paiseToRupeeInput(header.totalPayablePaise),
    totalInterest: paiseToRupeeInput(header.totalInterestPaise),
    scheduleGeneratedDate: header.scheduleGeneratedDate ?? "",
    financedAssetAccountId: "",
  };
}

export function loanPayloadFromDraft(draft: LoanDraft): LoanPayload {
  return {
    agreementNo: draft.agreementNo,
    lender: draft.lender,
    loanType: draft.loanType,
    amountFinanced: draft.amountFinanced,
    tenure: draft.tenure,
    frequency: draft.frequency,
    totalPayable: draft.totalPayable,
    totalInterest: draft.totalInterest,
    scheduleGeneratedDate: draft.scheduleGeneratedDate,
    financedAssetAccountId: draft.financedAssetAccountId || null,
  };
}
