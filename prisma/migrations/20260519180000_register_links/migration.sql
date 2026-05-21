-- AlterTable
ALTER TABLE "loans" ADD COLUMN "financed_asset_account_id" TEXT;

-- AlterTable
ALTER TABLE "transaction_lines" ADD COLUMN "linked_account_id" TEXT,
ADD COLUMN "linked_account_type" "LinkedRecordType";

-- CreateIndex
CREATE INDEX "loans_financed_asset_account_id_idx" ON "loans"("financed_asset_account_id");

-- CreateIndex
CREATE INDEX "transaction_lines_linked_account_id_idx" ON "transaction_lines"("linked_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sub_categories_linked_record_id_linked_record_type_key" ON "sub_categories"("linked_record_id", "linked_record_type");

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_financed_asset_account_id_fkey" FOREIGN KEY ("financed_asset_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_lines" ADD CONSTRAINT "transaction_lines_linked_account_id_fkey" FOREIGN KEY ("linked_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
