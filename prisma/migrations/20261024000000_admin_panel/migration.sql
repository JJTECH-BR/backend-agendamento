DO $$ BEGIN
    CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "companies"
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "heroTitle" TEXT,
ADD COLUMN IF NOT EXISTS "heroDescription" TEXT,
ADD COLUMN IF NOT EXISTS "phone" TEXT,
ADD COLUMN IF NOT EXISTS "address" TEXT,
ADD COLUMN IF NOT EXISTS "openingTime" TEXT NOT NULL DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS "closingTime" TEXT NOT NULL DEFAULT '17:00',
ADD COLUMN IF NOT EXISTS "closedDates" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "instagram" TEXT,
ADD COLUMN IF NOT EXISTS "instagramUrl" TEXT,
ADD COLUMN IF NOT EXISTS "pageContent" JSONB;

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "specialty" TEXT,
ADD COLUMN IF NOT EXISTS "biography" TEXT,
ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "services"
ADD COLUMN IF NOT EXISTS "professionalId" UUID;

ALTER TABLE "appointments"
ADD COLUMN IF NOT EXISTS "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS "price" DOUBLE PRECISION;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'services_professionalId_fkey'
          AND conrelid = '"services"'::regclass
    ) THEN
        ALTER TABLE "services"
        ADD CONSTRAINT "services_professionalId_fkey"
        FOREIGN KEY ("professionalId") REFERENCES "users"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "services_professionalId_idx" ON "services"("professionalId");
CREATE INDEX IF NOT EXISTS "appointments_companyId_date_idx" ON "appointments"("companyId", "date");
CREATE INDEX IF NOT EXISTS "appointments_status_idx" ON "appointments"("status");
