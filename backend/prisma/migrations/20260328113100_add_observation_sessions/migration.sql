-- CreateEnum
CREATE TYPE "SamplingMethod" AS ENUM ('AD_LIBITUM', 'FOCAL', 'SCAN');

-- AlterTable
ALTER TABLE "Observation" ADD COLUMN     "sessionId" TEXT;

-- CreateTable
CREATE TABLE "ObservationSession" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "observerName" TEXT NOT NULL,
    "method" "SamplingMethod" NOT NULL DEFAULT 'AD_LIBITUM',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "ObservationSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ObservationSession_animalId_startedAt_idx" ON "ObservationSession"("animalId", "startedAt");

-- CreateIndex
CREATE INDEX "Observation_sessionId_idx" ON "Observation"("sessionId");

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ObservationSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObservationSession" ADD CONSTRAINT "ObservationSession_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
