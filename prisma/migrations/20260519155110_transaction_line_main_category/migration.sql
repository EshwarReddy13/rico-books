-- AlterTable
ALTER TABLE "transaction_lines" ADD COLUMN     "main_category_id" TEXT;

-- CreateIndex
CREATE INDEX "transaction_lines_main_category_id_idx" ON "transaction_lines"("main_category_id");

-- AddForeignKey
ALTER TABLE "transaction_lines" ADD CONSTRAINT "transaction_lines_main_category_id_fkey" FOREIGN KEY ("main_category_id") REFERENCES "main_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
