import type { AccountMutationResult } from "@/lib/accounts/account-mutations";

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
