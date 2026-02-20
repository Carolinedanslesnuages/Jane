-- CreateEnum
CREATE TYPE "Species" AS ENUM ('DOG', 'CAT', 'HORSE', 'OTHER');

-- AlterTable
ALTER TABLE "Dog" ADD COLUMN     "species" "Species" NOT NULL DEFAULT 'DOG';
