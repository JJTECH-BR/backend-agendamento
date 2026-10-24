-- CreateIndex
CREATE INDEX "appointments_companyId_professionalId_date_idx" ON "appointments"("companyId", "professionalId", "date");

-- CreateIndex
CREATE INDEX "appointments_companyId_clientId_date_idx" ON "appointments"("companyId", "clientId", "date");
