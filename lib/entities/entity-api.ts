import type { EntityMutationResult } from "@/lib/entities/entity-mutations";

export type EntityPayload = {
  name: string;
  description: string;
  colorHex: string;
};

const DEBUG = process.env.NODE_ENV === "development";

function debug(label: string, data?: unknown) {
  if (DEBUG) {
    console.log(`[entity-api] ${label}`, data ?? "");
  }
}

async function parseJsonResponse(
  response: Response,
  method: string,
  url: string,
): Promise<EntityMutationResult> {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();

  debug(`${method} ${url} → ${response.status}`, {
    contentType,
    redirected: response.redirected,
    url: response.url,
    bodyPreview: text.slice(0, 200),
  });

  if (response.status === 401) {
    return { error: "You are not signed in. Refresh the page and try again." };
  }

  if (response.status >= 300 && response.status < 400) {
    return {
      error: `Request was redirected (${response.status} → ${response.url}). Auth middleware may have sent you to login instead of the API.`,
    };
  }

  if (!text) {
    return { error: `Empty response from server (HTTP ${response.status}).` };
  }

  if (!contentType.includes("application/json")) {
    return {
      error: `Expected JSON but got ${contentType || "unknown type"} (HTTP ${response.status}). First bytes: ${text.slice(0, 80)}`,
    };
  }

  try {
    return JSON.parse(text) as EntityMutationResult;
  } catch {
    return {
      error: `Invalid JSON (HTTP ${response.status}): ${text.slice(0, 120)}`,
    };
  }
}

async function entityFetch(
  url: string,
  init: RequestInit,
): Promise<EntityMutationResult> {
  debug(`→ ${init.method ?? "GET"} ${url}`, init.body);

  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    redirect: "manual",
  });

  return parseJsonResponse(response, init.method ?? "GET", url);
}

export async function apiCreateEntity(
  payload: EntityPayload,
): Promise<EntityMutationResult> {
  return entityFetch("/api/entities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function apiUpdateEntity(
  id: string,
  payload: EntityPayload,
): Promise<EntityMutationResult> {
  return entityFetch(`/api/entities/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function apiDeleteEntity(
  id: string,
): Promise<EntityMutationResult> {
  return entityFetch(`/api/entities/${id}`, {
    method: "DELETE",
  });
}
