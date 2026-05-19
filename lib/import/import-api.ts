import type {
  ImportConfirmResult,
  ImportConfirmRow,
  ImportParseResult,
} from "@/lib/import/types";

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

export function downloadImportTemplate() {
  window.location.href = "/api/import/template";
}

export async function apiParseImport(
  accountId: string,
  file: File,
): Promise<ImportParseResult> {
  const formData = new FormData();
  formData.append("accountId", accountId);
  formData.append("file", file);

  const response = await fetch("/api/import/parse", {
    method: "POST",
    body: formData,
    credentials: "same-origin",
    redirect: "manual",
  });

  const data = await parseJson<ImportParseResult>(response);
  if (!response.ok && !data.error) {
    return { rows: [], parseErrors: [], error: `Parse failed (HTTP ${response.status}).` };
  }
  return data;
}

export async function apiConfirmImport(payload: {
  accountId: string;
  fileName: string;
  rows: ImportConfirmRow[];
  entityId?: string | null;
}): Promise<ImportConfirmResult> {
  const response = await fetch("/api/import/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accountId: payload.accountId,
      fileName: payload.fileName,
      rows: payload.rows,
      entityId: payload.entityId ?? null,
    }),
    credentials: "same-origin",
    redirect: "manual",
  });

  return parseJson<ImportConfirmResult>(response);
}
