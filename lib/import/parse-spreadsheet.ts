import * as XLSX from "xlsx";

import type { BankColumnMapping } from "@/lib/accounts/default-hdfc-mapping";
import { computeTransactionFingerprint } from "@/lib/import/fingerprint";
import {
  DEFAULT_IMPORT_COLUMN_MAPPING,
  type ImportColumnMapping,
} from "@/lib/import/template-columns";
import type { ImportParseResult, ImportParseRow } from "@/lib/import/types";

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function parseAmountCell(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const cleaned = String(value).replace(/,/g, "").trim();
  if (!cleaned) {
    return null;
  }
  const amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : null;
}

/** Parse DD/MM/YY or DD/MM/YYYY to ISO date string (yyyy-mm-dd). */
export function parseStatementDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }

  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(raw);
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = Number(match[3]);
  if (year < 100) {
    year += 2000;
  }

  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function findHeaderRowIndex(
  rows: unknown[][],
  mapping: ImportColumnMapping,
): number {
  const target = normalizeHeader(mapping.date).toLowerCase();

  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = rows[i];
    if (!row?.length) {
      continue;
    }
    const first = normalizeHeader(row[0]).toLowerCase();
    if (first === target) {
      return i;
    }
  }

  return -1;
}

function buildColumnIndex(
  headerRow: unknown[],
  mapping: ImportColumnMapping,
): Record<keyof ImportColumnMapping, number> | null {
  const indexByHeader = new Map<string, number>();
  headerRow.forEach((cell, idx) => {
    indexByHeader.set(normalizeHeader(cell).toLowerCase(), idx);
  });

  const resolve = (key: keyof ImportColumnMapping) => {
    const label = normalizeHeader(mapping[key]).toLowerCase();
    const idx = indexByHeader.get(label);
    return idx === undefined ? -1 : idx;
  };

  const indices = {
    date: resolve("date"),
    narration: resolve("narration"),
    referenceNo: resolve("referenceNo"),
    valueDate: resolve("valueDate"),
    withdrawal: resolve("withdrawal"),
    deposit: resolve("deposit"),
    closingBalance: resolve("closingBalance"),
  };

  if (indices.date < 0 || indices.narration < 0) {
    return null;
  }

  return indices;
}

function cell(row: unknown[], index: number): unknown {
  if (index < 0) {
    return "";
  }
  return row[index] ?? "";
}

export function parseImportSpreadsheet(
  buffer: Buffer,
  sourceAccountId: string,
  columnMapping: ImportColumnMapping | BankColumnMapping = DEFAULT_IMPORT_COLUMN_MAPPING,
): ImportParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { rows: [], parseErrors: [], error: "No sheet found in file." };
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: true,
  });

  const headerRowIndex = findHeaderRowIndex(rows, columnMapping);
  if (headerRowIndex < 0) {
    return {
      rows: [],
      parseErrors: [],
      error:
        "Could not find a header row. Use the Rico Books template or an HDFC statement export.",
    };
  }

  const col = buildColumnIndex(rows[headerRowIndex], columnMapping);
  if (!col) {
    return {
      rows: [],
      parseErrors: [],
      error: "Missing required columns (Date, Narration).",
    };
  }

  const parsedRows: ImportParseRow[] = [];
  const parseErrors: ImportParseResult["parseErrors"] = [];

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => String(c ?? "").trim() === "")) {
      continue;
    }

    const rowNumber = i + 1;
    const date = parseStatementDate(cell(row, col.date));
    const rawDescription = String(cell(row, col.narration)).trim();
    const referenceNo = String(cell(row, col.referenceNo)).trim();
    const valueDateRaw = cell(row, col.valueDate);
    const valueDate = parseStatementDate(valueDateRaw);
    const withdrawal = parseAmountCell(cell(row, col.withdrawal));
    const deposit = parseAmountCell(cell(row, col.deposit));
    const closingRaw = parseAmountCell(cell(row, col.closingBalance));
    const closingBalancePaise =
      closingRaw === null ? null : Math.round(closingRaw * 100);

    if (!date) {
      parseErrors.push({ row: rowNumber, message: "Invalid or missing date." });
      continue;
    }
    if (!rawDescription) {
      parseErrors.push({
        row: rowNumber,
        message: "Missing narration / description.",
      });
      continue;
    }

    let direction: "debit" | "credit" | null = null;
    let amountInr: number | null = null;

    if (withdrawal !== null && withdrawal > 0) {
      direction = "debit";
      amountInr = withdrawal;
    } else if (deposit !== null && deposit > 0) {
      direction = "credit";
      amountInr = deposit;
    }

    if (!direction || amountInr === null) {
      parseErrors.push({
        row: rowNumber,
        message: "Need a withdrawal or deposit amount.",
      });
      continue;
    }

    const amountPaise = Math.round(amountInr * 100);
    const fingerprint = computeTransactionFingerprint({
      sourceAccountId,
      date,
      amountPaise,
      rawDescription,
      referenceNo,
      closingBalancePaise,
    });

    parsedRows.push({
      clientId: `row-${rowNumber}-${fingerprint.slice(0, 8)}`,
      rowNumber,
      date,
      valueDate,
      rawDescription,
      referenceNo,
      amountPaise,
      direction,
      closingBalancePaise,
      fingerprint,
      isDuplicate: false,
    });
  }

  return { rows: parsedRows, parseErrors };
}
