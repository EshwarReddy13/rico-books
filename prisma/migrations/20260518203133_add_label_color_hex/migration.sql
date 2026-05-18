-- AlterTable
ALTER TABLE "entities" ADD COLUMN     "color_hex" VARCHAR(7) NOT NULL DEFAULT '#6366f1';

-- AlterTable
ALTER TABLE "main_categories" ADD COLUMN     "color_hex" VARCHAR(7) NOT NULL DEFAULT '#71717a';

-- AlterTable
ALTER TABLE "sub_categories" ADD COLUMN     "color_hex" VARCHAR(7) NOT NULL DEFAULT '#94a3b8';
