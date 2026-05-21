import type { AccountMutationResult } from "@/lib/accounts/account-mutations";
import type { AssetDownPaymentsView } from "@/lib/accounts/types";
import type { LoanScheduleView, LoanSummary } from "@/lib/loans/types";

export type BankAccountPayload = {
  name: string;
  bankInstitution: string;
  accountType: string;
  openingBalance: string;
  openingDate: string;
};

async function parseJsonResponse(response: Response): Promise<AccountMutationResult> {
  const text = await response.text();
  if (response.status === 401) {
    return { error: "You are not signed in. Refresh and try again." };
  }
  if (!text) {
    return { error: `Empty response (HTTP ${response.status}).` };
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return {
      error: `Expected JSON (HTTP ${response.status}): ${text.slice(0, 80)}`,
    };
  }
  try {
    return JSON.parse(text) as AccountMutationResult;
  } catch {
    return { error: "Invalid JSON from server." };
  }
}

function bankAccountFetch(url: string, init: RequestInit) {
  return fetch(url, {
    ...init,
    credentials: "same-origin",
    redirect: "manual",
  }).then(parseJsonResponse);
}

export function apiCreateBankAccount(payload: BankAccountPayload) {
  return bankAccountFetch("/api/accounts/bank", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function apiUpdateBankAccount(id: string, payload: BankAccountPayload) {
  return bankAccountFetch(`/api/accounts/bank/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function apiDeleteBankAccount(id: string) {
  return bankAccountFetch(`/api/accounts/bank/${id}`, { method: "DELETE" });
}

export type RegisterAssetPayload = {
  name: string;
  /** Required on create only; type is fixed after creation. */
  assetType?: string;
  openingBalance: string;
  openingDate: string;
};

export type RegisterLiabilityPayload = {
  name: string;
  openingBalance: string;
  openingDate: string;
  financedAssetAccountId?: string | null;
};

export function apiCreateRegisterAsset(payload: RegisterAssetPayload) {
  return bankAccountFetch("/api/accounts/asset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function apiUpdateRegisterAsset(
  id: string,
  payload: RegisterAssetPayload,
) {
  return bankAccountFetch(`/api/accounts/asset/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function apiDeleteRegisterAsset(id: string) {
  return bankAccountFetch(`/api/accounts/asset/${id}`, { method: "DELETE" });
}

export async function apiFetchAssetDownPayments(assetAccountId: string) {
  const response = await fetch(
    `/api/accounts/asset/${assetAccountId}/down-payments`,
    { credentials: "same-origin", redirect: "manual" },
  );
  const text = await response.text();
  if (!text) {
    return { error: `Empty response (HTTP ${response.status}).`, view: null };
  }
  try {
    const data = JSON.parse(text) as AssetDownPaymentsView | { error?: string };
    if ("error" in data && data.error) {
      return { error: data.error, view: null };
    }
    if ("rows" in data && "assetAccountId" in data) {
      return { view: data };
    }
    return { error: "Unexpected response.", view: null };
  } catch {
    return { error: "Invalid JSON.", view: null };
  }
}

export function apiCreateLiability(payload: RegisterLiabilityPayload) {
  return bankAccountFetch("/api/accounts/liability", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function apiUpdateLiability(
  id: string,
  payload: RegisterLiabilityPayload,
) {
  return bankAccountFetch(`/api/accounts/liability/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function apiDeleteLiability(id: string) {
  return bankAccountFetch(`/api/accounts/liability/${id}`, { method: "DELETE" });
}

export type LoanPayload = {
  agreementNo: string;
  lender: string;
  loanType: string;
  amountFinanced: string;
  tenure: string;
  frequency: string;
  totalPayable: string;
  totalInterest: string;
  scheduleGeneratedDate: string;
  financedAssetAccountId?: string | null;
};

export function apiGetLiabilityLoan(liabilityAccountId: string) {
  return fetch(`/api/accounts/liability/${liabilityAccountId}/loan`, {
    credentials: "same-origin",
    redirect: "manual",
  }).then(async (response) => {
    const text = await response.text();
    if (!text) {
      return { error: `Empty response (HTTP ${response.status}).`, loan: null };
    }
    try {
      return JSON.parse(text) as { loan: LoanSummary | null; error?: string };
    } catch {
      return { error: "Invalid JSON.", loan: null };
    }
  });
}

export function apiUpsertLiabilityLoan(
  liabilityAccountId: string,
  payload: LoanPayload,
) {
  return fetch(`/api/accounts/liability/${liabilityAccountId}/loan`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "same-origin",
    redirect: "manual",
  }).then(async (response) => {
    const text = await response.text();
    if (!text) {
      return { error: `Empty response (HTTP ${response.status}).` };
    }
    try {
      return JSON.parse(text) as {
        success?: boolean;
        error?: string;
        loan?: LoanSummary;
      };
    } catch {
      return { error: "Invalid JSON." };
    }
  });
}

export async function apiParseLoanDocument(file: File) {
  const formData = new FormData();
  formData.set("file", file);

  const response = await fetch("/api/loans/parse-document", {
    method: "POST",
    body: formData,
    credentials: "same-origin",
    redirect: "manual",
  });

  const text = await response.text();
  if (!text) {
    return { error: `Empty response (HTTP ${response.status}).` };
  }
  try {
    return JSON.parse(text) as {
      error?: string;
      extract?: import("@/lib/loans/types").LoanScheduleExtractResult;
      checksum?: { ok: boolean; errors: string[] };
    };
  } catch {
    return { error: "Invalid JSON from server." };
  }
}

export async function apiParseLoanSchedulePdf(loanId: string, file: File) {
  const formData = new FormData();
  formData.set("file", file);

  const response = await fetch(`/api/loans/${loanId}/schedule/parse`, {
    method: "POST",
    body: formData,
    credentials: "same-origin",
    redirect: "manual",
  });

  const text = await response.text();
  if (!text) {
    return { error: `Empty response (HTTP ${response.status}).` };
  }
  try {
    return JSON.parse(text) as {
      error?: string;
      extract?: unknown;
      checksum?: { ok: boolean; errors: string[] };
    };
  } catch {
    return { error: "Invalid JSON from server." };
  }
}

export async function apiFetchLoanSchedule(loanId: string) {
  const response = await fetch(`/api/loans/${loanId}/schedule`, {
    credentials: "same-origin",
    redirect: "manual",
  });
  const text = await response.text();
  if (!text) {
    return { error: `Empty response (HTTP ${response.status}).`, view: null };
  }
  try {
    const data = JSON.parse(text) as
      | LoanScheduleView
      | { view?: LoanScheduleView; error?: string };
    if ("error" in data && data.error) {
      return { error: data.error, view: null };
    }
    if ("view" in data && data.view) {
      return { view: data.view };
    }
    if ("rows" in data && "loanId" in data) {
      return { view: data as LoanScheduleView };
    }
    return { error: "Unexpected response.", view: null };
  } catch {
    return { error: "Invalid JSON.", view: null };
  }
}

export function apiConfirmLoanSchedule(
  loanId: string,
  body: { extract: unknown; replaceExisting?: boolean },
) {
  return fetch(`/api/loans/${loanId}/schedule/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
    redirect: "manual",
  }).then(async (response) => {
    const text = await response.text();
    if (!text) {
      return { error: `Empty response (HTTP ${response.status}).` };
    }
    try {
      return JSON.parse(text) as { error?: string; success?: boolean; rowCount?: number };
    } catch {
      return { error: "Invalid JSON from server." };
    }
  });
}
