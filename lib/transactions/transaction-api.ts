export type SaveCategorizationPayload = {
  mainCategoryId?: string | null;
  subCategoryId?: string | null;
  entityId?: string | null;
  description?: string;
  confirm?: boolean;
  confirmOnly?: boolean;
};

async function parseJson<T>(response: Response): Promise<T & { error?: string }> {
  const text = await response.text();
  if (response.status === 401) {
    return { error: "You are not signed in. Refresh and try again." } as T & {
      error?: string;
    };
  }
  if (!text) {
    return { error: `Empty response (HTTP ${response.status}).` } as T & {
      error?: string;
    };
  }
  try {
    return JSON.parse(text) as T & { error?: string };
  } catch {
    return { error: "Invalid JSON from server." } as T & { error?: string };
  }
}

export async function apiSaveTransactionCategorization(
  transactionId: string,
  payload: SaveCategorizationPayload,
): Promise<{ success?: boolean; error?: string }> {
  const response = await fetch(`/api/transactions/${transactionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "same-origin",
    redirect: "manual",
  });

  return parseJson(response);
}

export async function apiBulkConfirmHighConfidence(input: {
  transactionIds: string[];
  minConfidence?: number;
  entityId?: string | null;
}): Promise<{
  success?: boolean;
  error?: string;
  confirmedCount?: number;
  skippedCount?: number;
}> {
  const response = await fetch("/api/transactions/bulk-confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    credentials: "same-origin",
    redirect: "manual",
  });

  return parseJson(response);
}

export async function apiSuggestLineDescription(
  input: {
    rawDescription: string;
    categoryLabel: string;
    amountInr: string;
    direction: "debit" | "credit";
    entityName?: string | null;
  },
  signal?: AbortSignal,
): Promise<{ description?: string; error?: string }> {
  const response = await fetch("/api/transactions/suggest-description", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    credentials: "same-origin",
    redirect: "manual",
    signal,
  });

  return parseJson(response);
}

export async function apiDeleteAllTransactions(): Promise<{
  success?: boolean;
  error?: string;
}> {
  const response = await fetch("/api/transactions", {
    method: "DELETE",
    credentials: "same-origin",
    redirect: "manual",
  });

  return parseJson(response);
}
