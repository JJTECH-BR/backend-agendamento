/*
  Warnings:

  - The primary key for the `appointments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `companies` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `services` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `appointments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `serviceId` on the `appointments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `companyId` on the `appointments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `clientId` on the `appointments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `professionalId` on the `appointments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `companies` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `services` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `companyId` on the `services` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `companyId` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_clientId_fkey";

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_companyId_fkey";

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_professionalId_fkey";

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_serviceId_fkey";

-- DropForeignKey
ALTER TABLE "services" DROP CONSTRAINT "services_companyId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_companyId_fkey";

-- AlterTable
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "serviceId",
ADD COLUMN     "serviceId" UUID NOT NULL,
DROP COLUMN "companyId",
ADD COLUMN     "companyId" UUID NOT NULL,
DROP COLUMN "clientId",
ADD COLUMN     "clientId" UUID NOT NULL,
DROP COLUMN "professionalId",
ADD COLUMN     "professionalId" UUID NOT NULL,
ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "companies" DROP CONSTRAINT "companies_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "services" DROP CONSTRAINT "services_pkey",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
DROP COLUMN "companyId",
ADD COLUMN     "companyId" UUID NOT NULL,
ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "companyId",
ADD COLUMN     "companyId" UUID NOT NULL,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
