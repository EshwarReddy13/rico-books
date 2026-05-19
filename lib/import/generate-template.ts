import * as XLSX from "xlsx";

import { IMPORT_TEMPLATE_HEADERS } from "@/lib/import/template-columns";

/** Empty Rico Books / HDFC-layout import template with one example row. */
export function generateImportTemplateBuffer(): Buffer {
  const sheet = XLSX.utils.aoa_to_sheet([
    [...IMPORT_TEMPLATE_HEADERS],
    [
      "20/12/25",
      "Example: UPI payment to merchant",
      "0000000000000001",
      "20/12/25",
      100,
      "",
      10000,
    ],
  ]);

  sheet["!cols"] = [
    { wch: 12 },
    { wch: 48 },
    { wch: 18 },
    { wch: 12 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Transactions");
  return Buffer.from(
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
  );
}
