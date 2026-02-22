/*
  Warnings:

  - The `status` column on the `Lead` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'PROPOSAL', 'ON_HOLD', 'WON', 'LOST');

-- DropIndex
DROP INDEX "Lead_email_key";

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "company" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "value" DECIMAL(65,30),
ALTER COLUMN "email" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "LeadStatus" NOT NULL DEFAULT 'NEW';

-- DropEnum
DROP TYPE "Status";

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
