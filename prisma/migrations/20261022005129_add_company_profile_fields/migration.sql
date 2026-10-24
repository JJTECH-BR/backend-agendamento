-- DropIndex
DROP INDEX "appointments_companyId_clientId_date_idx";

-- DropIndex
DROP INDEX "appointments_companyId_professionalId_date_idx";

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "address" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "phone" TEXT;
