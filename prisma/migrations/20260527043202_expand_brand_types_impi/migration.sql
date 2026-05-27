-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BrandType" ADD VALUE 'OLFACTORY';
ALTER TYPE "BrandType" ADD VALUE 'COMMERCIAL_NOTICE';
ALTER TYPE "BrandType" ADD VALUE 'TRADE_NAME';
ALTER TYPE "BrandType" ADD VALUE 'CERTIFICATION_MARK';
ALTER TYPE "BrandType" ADD VALUE 'COLLECTIVE_MARK';
ALTER TYPE "BrandType" ADD VALUE 'APPELLATION_OF_ORIGIN';
ALTER TYPE "BrandType" ADD VALUE 'GEOGRAPHICAL_INDICATION';
