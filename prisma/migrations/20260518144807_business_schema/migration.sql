-- CreateEnum
CREATE TYPE "MainCategoryKind" AS ENUM ('pnl', 'balance_sheet');

-- CreateEnum
CREATE TYPE "PnlSign" AS ENUM ('income', 'expense');

-- CreateEnum
CREATE TYPE "AccountKind" AS ENUM ('asset', 'liability');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('bank', 'vehicle', 'computer', 'furniture', 'equipment', 'investment', 'other');

-- CreateEnum
CREATE TYPE "TransactionDirection" AS ENUM ('debit', 'credit');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending_review', 'confirmed');

-- CreateEnum
CREATE TYPE "LinkedRecordType" AS ENUM ('asset', 'liability');

-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('processing', 'completed', 'failed');

-- CreateTable
CREATE TABLE "entities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "main_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "kind" "MainCategoryKind" NOT NULL,
    "pnl_sign" "PnlSign",

    CONSTRAINT "main_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_categories" (
    "id" TEXT NOT NULL,
    "main_category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "linked_record_id" TEXT,
    "linked_record_type" "LinkedRecordType",

    CONSTRAINT "sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "account_kind" "AccountKind" NOT NULL,
    "asset_type" "AssetType",
    "opening_value_paise" BIGINT NOT NULL DEFAULT 0,
    "opening_date" DATE,
    "business_use_pct" DECIMAL(5,2),
    "depreciation_rate" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_account_profiles" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL DEFAULT '',
    "column_mapping" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_account_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL,
    "source_account_id" TEXT NOT NULL,
    "file_name" TEXT,
    "status" "ImportBatchStatus" NOT NULL DEFAULT 'completed',
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "row_count" INTEGER NOT NULL DEFAULT 0,
    "duplicate_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "value_date" DATE,
    "amount_paise" BIGINT NOT NULL,
    "direction" "TransactionDirection" NOT NULL,
    "raw_description" TEXT NOT NULL,
    "reference_no" TEXT NOT NULL DEFAULT '',
    "closing_balance_paise" BIGINT,
    "source_account_id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "import_batch_id" TEXT NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'pending_review',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_lines" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "amount_paise" BIGINT NOT NULL,
    "sub_category_id" TEXT,
    "entity_id" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "confidence" DECIMAL(4,3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "liability_account_id" TEXT NOT NULL,
    "agreement_no" TEXT NOT NULL DEFAULT '',
    "lender" TEXT NOT NULL DEFAULT '',
    "loan_type" TEXT NOT NULL DEFAULT '',
    "amount_financed_paise" BIGINT NOT NULL,
    "tenure" INTEGER NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'monthly',
    "total_payable_paise" BIGINT NOT NULL,
    "total_interest_paise" BIGINT NOT NULL,
    "schedule_generated_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_schedule_rows" (
    "id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "installment_no" INTEGER NOT NULL,
    "due_date" DATE NOT NULL,
    "emi_amount_paise" BIGINT NOT NULL,
    "principal_amount_paise" BIGINT NOT NULL,
    "interest_amount_paise" BIGINT NOT NULL,
    "closing_balance_paise" BIGINT NOT NULL,
    "matched_txn_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_schedule_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_profiles" (
    "id" TEXT NOT NULL,
    "financial_year" TEXT NOT NULL,
    "itr_form" TEXT NOT NULL DEFAULT 'ITR-3',
    "presumptive_enabled" BOOLEAN NOT NULL DEFAULT false,
    "presumptive_rate" DECIMAL(5,2),
    "schedules_enabled" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entity_table" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "old_value" TEXT NOT NULL DEFAULT '',
    "new_value" TEXT NOT NULL DEFAULT '',
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_by_auth_user_id" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learned_categorization_rules" (
    "id" TEXT NOT NULL,
    "match_pattern" TEXT NOT NULL,
    "sub_category_id" TEXT NOT NULL,
    "entity_id" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learned_categorization_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "main_categories_name_key" ON "main_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sub_categories_main_category_id_name_key" ON "sub_categories"("main_category_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "bank_account_profiles_account_id_key" ON "bank_account_profiles"("account_id");

-- CreateIndex
CREATE INDEX "transactions_status_date_idx" ON "transactions"("status", "date");

-- CreateIndex
CREATE INDEX "transactions_import_batch_id_idx" ON "transactions"("import_batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_source_account_id_fingerprint_key" ON "transactions"("source_account_id", "fingerprint");

-- CreateIndex
CREATE INDEX "transaction_lines_transaction_id_idx" ON "transaction_lines"("transaction_id");

-- CreateIndex
CREATE INDEX "transaction_lines_sub_category_id_idx" ON "transaction_lines"("sub_category_id");

-- CreateIndex
CREATE INDEX "transaction_lines_entity_id_idx" ON "transaction_lines"("entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "loans_liability_account_id_key" ON "loans"("liability_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "loan_schedule_rows_matched_txn_id_key" ON "loan_schedule_rows"("matched_txn_id");

-- CreateIndex
CREATE INDEX "loan_schedule_rows_loan_id_due_date_idx" ON "loan_schedule_rows"("loan_id", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "loan_schedule_rows_loan_id_installment_no_key" ON "loan_schedule_rows"("loan_id", "installment_no");

-- CreateIndex
CREATE UNIQUE INDEX "tax_profiles_financial_year_key" ON "tax_profiles"("financial_year");

-- CreateIndex
CREATE INDEX "audit_logs_entity_table_entity_id_idx" ON "audit_logs"("entity_table", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_changed_at_idx" ON "audit_logs"("changed_at");

-- CreateIndex
CREATE INDEX "learned_categorization_rules_match_pattern_idx" ON "learned_categorization_rules"("match_pattern");

-- AddForeignKey
ALTER TABLE "sub_categories" ADD CONSTRAINT "sub_categories_main_category_id_fkey" FOREIGN KEY ("main_category_id") REFERENCES "main_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_account_profiles" ADD CONSTRAINT "bank_account_profiles_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_source_account_id_fkey" FOREIGN KEY ("source_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_source_account_id_fkey" FOREIGN KEY ("source_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_lines" ADD CONSTRAINT "transaction_lines_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_lines" ADD CONSTRAINT "transaction_lines_sub_category_id_fkey" FOREIGN KEY ("sub_category_id") REFERENCES "sub_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_lines" ADD CONSTRAINT "transaction_lines_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_liability_account_id_fkey" FOREIGN KEY ("liability_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_schedule_rows" ADD CONSTRAINT "loan_schedule_rows_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_schedule_rows" ADD CONSTRAINT "loan_schedule_rows_matched_txn_id_fkey" FOREIGN KEY ("matched_txn_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learned_categorization_rules" ADD CONSTRAINT "learned_categorization_rules_sub_category_id_fkey" FOREIGN KEY ("sub_category_id") REFERENCES "sub_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learned_categorization_rules" ADD CONSTRAINT "learned_categorization_rules_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
