-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('current', 'savings', 'salary', 'fd', 'other');

-- CreateEnum
CREATE TYPE "BankInstitution" AS ENUM ('hdfc', 'icici', 'sbi', 'axis', 'kotak', 'idfc_first', 'yes', 'indusind', 'punjab_national', 'other');

-- AlterTable
ALTER TABLE "bank_account_profiles" ADD COLUMN     "account_type" "BankAccountType" NOT NULL DEFAULT 'current',
ADD COLUMN     "bank_institution" "BankInstitution" NOT NULL DEFAULT 'other';
