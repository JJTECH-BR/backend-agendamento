ALTER TABLE "services"
ADD COLUMN "professionalId" UUID;

ALTER TABLE "services"
ADD CONSTRAINT "services_professionalId_fkey"
FOREIGN KEY ("professionalId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
