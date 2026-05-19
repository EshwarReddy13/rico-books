import { requireSession } from "@/lib/api/require-session";
import { generateImportTemplateBuffer } from "@/lib/import/generate-template";

export async function GET() {
  const { unauthorized } = await requireSession();
  if (unauthorized) {
    return unauthorized;
  }

  const buffer = generateImportTemplateBuffer();

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="rico-books-import-template.xlsx"',
    },
  });
}
