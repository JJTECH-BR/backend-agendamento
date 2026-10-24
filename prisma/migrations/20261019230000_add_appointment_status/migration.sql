ALTER TABLE "appointments"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING';

CREATE INDEX "appointments_companyId_professionalId_date_idx"
ON "appointments"("companyId", "professionalId", "date");

CREATE INDEX "appointments_companyId_clientId_date_idx"
ON "appointments"("companyId", "clientId", "date");
