import type { CategoryMutationResult } from "@/lib/categories/category-mutations";

async function parseJsonResponse(response: Response): Promise<CategoryMutationResult> {
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
    return JSON.parse(text) as CategoryMutationResult;
  } catch {
    return { error: "Invalid JSON from server." };
  }
}

async function categoryFetch(
  url: string,
  init: RequestInit,
): Promise<CategoryMutationResult> {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    redirect: "manual",
  });
  return parseJsonResponse(response);
}

export type MainCategoryPayload = {
  name: string;
  description: string;
  colorHex: string;
  kind: "pnl" | "balance_sheet";
  pnlSign: "income" | "expense" | null;
};

export type SubCategoryPayload = {
  name: string;
  description: string;
  colorHex: string;
  mainCategoryId: string;
};

export function apiCreateMainCategory(payload: MainCategoryPayload) {
  return categoryFetch("/api/categories/main", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function apiUpdateMainCategory(id: string, payload: MainCategoryPayload) {
  return categoryFetch(`/api/categories/main/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function apiDeleteMainCategory(id: string) {
  return categoryFetch(`/api/categories/main/${id}`, { method: "DELETE" });
}

export function apiCreateSubCategory(payload: SubCategoryPayload) {
  return categoryFetch("/api/categories/sub", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function apiUpdateSubCategory(id: string, payload: SubCategoryPayload) {
  return categoryFetch(`/api/categories/sub/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function apiDeleteSubCategory(id: string) {
  return categoryFetch(`/api/categories/sub/${id}`, { method: "DELETE" });
}
