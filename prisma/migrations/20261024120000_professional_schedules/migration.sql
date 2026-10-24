CREATE TABLE "professional_schedules" (
    "id" UUID NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "professionalId" UUID NOT NULL,

    CONSTRAINT "professional_schedules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "professional_schedules_professionalId_dayOfWeek_key"
ON "professional_schedules"("professionalId", "dayOfWeek");

ALTER TABLE "professional_schedules"
ADD CONSTRAINT "professional_schedules_professionalId_fkey"
FOREIGN KEY ("professionalId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
