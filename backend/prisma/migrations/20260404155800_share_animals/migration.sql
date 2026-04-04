-- CreateEnum
CREATE TYPE "ShareRole" AS ENUM ('VIEWER', 'OBSERVER');

-- AlterTable
ALTER TABLE "Observation" ADD COLUMN     "recordedById" TEXT;

-- CreateTable
CREATE TABLE "AnimalShare" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ShareRole" NOT NULL DEFAULT 'OBSERVER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnimalShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnimalShare_userId_idx" ON "AnimalShare"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AnimalShare_animalId_userId_key" ON "AnimalShare"("animalId", "userId");

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimalShare" ADD CONSTRAINT "AnimalShare_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimalShare" ADD CONSTRAINT "AnimalShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
