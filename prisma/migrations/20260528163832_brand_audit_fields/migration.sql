-- CreateEnum
CREATE TYPE "ApplicationType" AS ENUM ('TRADEMARK_REGISTRATION', 'COMMERCIAL_NOTICE_REGISTRATION', 'TRADE_NAME_REGISTRATION', 'APPELLATION_OF_ORIGIN_REQUEST', 'GEOGRAPHICAL_INDICATION_REQUEST', 'RENEWAL', 'ASSIGNMENT', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LegalStatus" ADD VALUE 'IN_PROGRESS';
ALTER TYPE "LegalStatus" ADD VALUE 'ABANDONED';

-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "application_type" "ApplicationType",
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'México',
ADD COLUMN     "observations" TEXT;
