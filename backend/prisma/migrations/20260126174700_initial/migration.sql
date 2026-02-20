-- CreateEnum
CREATE TYPE "DogSex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "BehaviorCategory" AS ENUM ('EXPLORATION', 'PLAY', 'REST', 'SOCIAL', 'STRESS', 'ELIMINATION');

-- CreateEnum
CREATE TYPE "ObservationType" AS ENUM ('EVENT', 'STATE');

-- CreateEnum
CREATE TYPE "CognitiveTestType" AS ENUM ('OBJECT_PERMANENCE', 'DETOUR', 'MANIPULATION');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "keycloakSubject" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dog" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT,
    "birthDate" DATE,
    "sex" "DogSex",
    "neutered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Observation" (
    "id" TEXT NOT NULL,
    "dogId" TEXT NOT NULL,
    "behavior" TEXT NOT NULL,
    "category" "BehaviorCategory" NOT NULL,
    "type" "ObservationType" NOT NULL,
    "startedAt" TIMESTAMP(3),
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationSeconds" DOUBLE PRECISION,
    "notes" TEXT,
    "location" TEXT,
    "weather" TEXT,
    "stimuli" TEXT,

    CONSTRAINT "Observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveState" (
    "id" TEXT NOT NULL,
    "dogId" TEXT NOT NULL,
    "behavior" TEXT NOT NULL,
    "category" "BehaviorCategory" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActiveState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CognitiveTest" (
    "id" TEXT NOT NULL,
    "dogId" TEXT NOT NULL,
    "testType" "CognitiveTestType" NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationSeconds" DOUBLE PRECISION NOT NULL,
    "score" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "CognitiveTest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_keycloakSubject_key" ON "User"("keycloakSubject");

-- CreateIndex
CREATE UNIQUE INDEX "Dog_ownerId_name_key" ON "Dog"("ownerId", "name");

-- CreateIndex
CREATE INDEX "Observation_dogId_recordedAt_idx" ON "Observation"("dogId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveState_dogId_behavior_key" ON "ActiveState"("dogId", "behavior");

-- CreateIndex
CREATE INDEX "CognitiveTest_dogId_recordedAt_idx" ON "CognitiveTest"("dogId", "recordedAt");

-- AddForeignKey
ALTER TABLE "Dog" ADD CONSTRAINT "Dog_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveState" ADD CONSTRAINT "ActiveState_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CognitiveTest" ADD CONSTRAINT "CognitiveTest_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
