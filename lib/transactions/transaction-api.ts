export type SaveCategorizationPayload = {
  mainCategoryId?: string | null;
  subCategoryId?: string | null;
  entityId?: string | null;
  description?: string;
  confirm?: boolean;
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
