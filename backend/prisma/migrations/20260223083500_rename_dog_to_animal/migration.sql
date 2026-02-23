-- Renomme « chien » en « animal » sans toucher aux données.
ALTER TYPE "DogSex" RENAME TO "Sex";

ALTER TABLE "Dog" RENAME TO "Animal";
ALTER TABLE "Animal" RENAME CONSTRAINT "Dog_pkey" TO "Animal_pkey";
ALTER TABLE "Animal" RENAME CONSTRAINT "Dog_ownerId_fkey" TO "Animal_ownerId_fkey";
ALTER INDEX "Dog_ownerId_name_key" RENAME TO "Animal_ownerId_name_key";

ALTER TABLE "Observation" RENAME COLUMN "dogId" TO "animalId";
ALTER TABLE "Observation" RENAME CONSTRAINT "Observation_dogId_fkey" TO "Observation_animalId_fkey";
ALTER INDEX "Observation_dogId_recordedAt_idx" RENAME TO "Observation_animalId_recordedAt_idx";

ALTER TABLE "ActiveState" RENAME COLUMN "dogId" TO "animalId";
ALTER TABLE "ActiveState" RENAME CONSTRAINT "ActiveState_dogId_fkey" TO "ActiveState_animalId_fkey";
ALTER INDEX "ActiveState_dogId_behavior_key" RENAME TO "ActiveState_animalId_behavior_key";

ALTER TABLE "CognitiveTest" RENAME COLUMN "dogId" TO "animalId";
ALTER TABLE "CognitiveTest" RENAME CONSTRAINT "CognitiveTest_dogId_fkey" TO "CognitiveTest_animalId_fkey";
ALTER INDEX "CognitiveTest_dogId_recordedAt_idx" RENAME TO "CognitiveTest_animalId_recordedAt_idx";
