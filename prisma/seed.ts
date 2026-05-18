import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/** Default main categories — architecture.md §3.2 */
const mainCategories = [
  {
    name: "Income",
    kind: "pnl" as const,
    pnlSign: "income" as const,
    description: "Revenue and other P&L income",
  },
  {
    name: "Expense",
    kind: "pnl" as const,
    pnlSign: "expense" as const,
    description: "Operating and other P&L expenses",
  },
  {
    name: "Owner Contribution",
    kind: "balance_sheet" as const,
    pnlSign: null,
    description: "Capital introduced by the owner",
  },
  {
    name: "Assets",
    kind: "balance_sheet" as const,
    pnlSign: null,
    description: "Asset purchases and register",
  },
  {
    name: "Loans",
    kind: "balance_sheet" as const,
    pnlSign: null,
    description: "Loan principal movements",
  },
  {
    name: "Transfer",
    kind: "balance_sheet" as const,
    pnlSign: null,
    description: "Moves between own accounts — not P&L",
  },
];

async function main() {
  for (const cat of mainCategories) {
    await prisma.mainCategory.upsert({
      where: { name: cat.name },
      create: {
        name: cat.name,
        kind: cat.kind,
        pnlSign: cat.pnlSign,
        description: cat.description,
      },
      update: {
        kind: cat.kind,
        pnlSign: cat.pnlSign,
        description: cat.description,
      },
    });
  }

  console.log(`Seeded ${mainCategories.length} main categories.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
