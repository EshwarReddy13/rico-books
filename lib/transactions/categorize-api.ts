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

export async function apiRunAiCategorization(input?: {
  importBatchId?: string | null;
  transactionIds?: string[];
  revalidate?: boolean;
  signal?: AbortSignal;
}): Promise<{
  success?: boolean;
  error?: string;
  categorizedCount?: number;
  skippedCount?: number;
}> {
  const response = await fetch("/api/categorize/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      importBatchId: input?.importBatchId ?? null,
      transactionIds: input?.transactionIds,
      revalidate: input?.revalidate,
    }),
    credentials: "same-origin",
    redirect: "manual",
    signal: input?.signal,
  });

  return parseJson(response);
}

export async function apiResetPendingCategorization(input?: {
  importBatchId?: string | null;
}): Promise<{ success?: boolean; error?: string; resetCount?: number }> {
  const response = await fetch("/api/categorize/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      importBatchId: input?.importBatchId ?? null,
    }),
    credentials: "same-origin",
    redirect: "manual",
  });

  return parseJson(response);
}
