import {
  computeLoanOutstandingPaise,
  schedulePaymentStatus,
} from "@/lib/loans/compute-loan-outstanding";
import type { LoanScheduleView } from "@/lib/loans/types";
import { prisma } from "@/lib/prisma";

export async function loadLoanScheduleView(
  loanId: string,
): Promise<LoanScheduleView | { error: string }> {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    select: {
      id: true,
      amountFinancedPaise: true,
      liabilityAccount: {
        select: { name: true, openingValuePaise: true },
      },
      scheduleRows: {
        orderBy: { installmentNo: "asc" },
        select: {
          id: true,
          installmentNo: true,
          dueDate: true,
          emiAmountPaise: true,
          principalAmountPaise: true,
          interestAmountPaise: true,
          closingBalancePaise: true,
          matchedTxnId: true,
          matchedTransaction: {
            select: {
              id: true,
              date: true,
              amountPaise: true,
              rawDescription: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!loan) {
    return { error: "Loan not found." };
  }

  const rows = loan.scheduleRows.map((row) => {
    const matchedTransaction = row.matchedTransaction
      ? {
          id: row.matchedTransaction.id,
          date: row.matchedTransaction.date.toISOString().slice(0, 10),
          amountPaise: Number(row.matchedTransaction.amountPaise),
          rawDescription: row.matchedTransaction.rawDescription,
          status: row.matchedTransaction.status as
            | "pending_review"
            | "confirmed",
        }
      : null;

    return {
      id: row.id,
      installmentNo: row.installmentNo,
      dueDate: row.dueDate.toISOString().slice(0, 10),
      emiAmountPaise: Number(row.emiAmountPaise),
      principalAmountPaise: Number(row.principalAmountPaise),
      interestAmountPaise: Number(row.interestAmountPaise),
      closingBalancePaise: Number(row.closingBalancePaise),
      matchedTxnId: row.matchedTxnId,
      paymentStatus: schedulePaymentStatus({
        matchedTxnId: row.matchedTxnId,
        matchedTransaction,
      }),
      matchedTransaction,
    };
  });

  const matchedCount = rows.filter((r) => r.matchedTxnId != null).length;
  const paidCount = rows.filter((r) => r.paymentStatus === "paid").length;
  const pendingCount = rows.filter((r) => r.paymentStatus === "pending").length;

  const amountFinancedPaise = Number(loan.amountFinancedPaise);
  const openingValuePaise = Number(loan.liabilityAccount.openingValuePaise);

  const outstandingBalancePaise = computeLoanOutstandingPaise({
    amountFinancedPaise,
    openingValuePaise,
    scheduleRows: rows.map((r) => ({
      principalAmountPaise: r.principalAmountPaise,
      matchedTxnId: r.matchedTxnId,
    })),
  });

  return {
    loanId: loan.id,
    liabilityName: loan.liabilityAccount.name,
    amountFinancedPaise,
    outstandingBalancePaise,
    rows,
    matchedCount,
    paidCount,
    pendingCount,
    totalCount: rows.length,
  };
}
