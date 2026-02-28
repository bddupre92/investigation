-- CreateEnum
CREATE TYPE "FishboneCategory" AS ENUM ('MAN', 'MACHINE', 'METHOD', 'MATERIAL', 'MEASUREMENT', 'ENVIRONMENT');

-- CreateTable: tool_decisions
CREATE TABLE "tool_decisions" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "fiveWhys" BOOLEAN NOT NULL DEFAULT true,
    "fishbone" BOOLEAN NOT NULL DEFAULT false,
    "isIsNot" BOOLEAN NOT NULL DEFAULT false,
    "processAnalysis" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tool_decisions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "tool_decisions_investigationId_key" ON "tool_decisions"("investigationId");
ALTER TABLE "tool_decisions" ADD CONSTRAINT "tool_decisions_investigationId_fkey"
  FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: fishbone_causes
CREATE TABLE "fishbone_causes" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "category" "FishboneCategory" NOT NULL,
    "cause" TEXT NOT NULL,
    "evidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "fishbone_causes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "fishbone_causes_investigationId_idx" ON "fishbone_causes"("investigationId");
ALTER TABLE "fishbone_causes" ADD CONSTRAINT "fishbone_causes_investigationId_fkey"
  FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: is_is_not_entries
CREATE TABLE "is_is_not_entries" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "isDescription" TEXT NOT NULL,
    "isNotDescription" TEXT NOT NULL,
    "distinction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "is_is_not_entries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "is_is_not_entries_investigationId_idx" ON "is_is_not_entries"("investigationId");
ALTER TABLE "is_is_not_entries" ADD CONSTRAINT "is_is_not_entries_investigationId_fkey"
  FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: process_analysis_steps
CREATE TABLE "process_analysis_steps" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "processStep" TEXT NOT NULL,
    "expected" TEXT NOT NULL,
    "actual" TEXT NOT NULL,
    "deviation" BOOLEAN NOT NULL DEFAULT false,
    "deviationDetail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "process_analysis_steps_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "process_analysis_steps_investigationId_idx" ON "process_analysis_steps"("investigationId");
ALTER TABLE "process_analysis_steps" ADD CONSTRAINT "process_analysis_steps_investigationId_fkey"
  FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Remap existing investigation currentStep values for new numbering
-- Process in descending order to avoid collisions
UPDATE "investigations" SET "currentStep" = 14 WHERE "currentStep" = 10;
UPDATE "investigations" SET "currentStep" = 13 WHERE "currentStep" = 9;
UPDATE "investigations" SET "currentStep" = 12 WHERE "currentStep" = 8;
UPDATE "investigations" SET "currentStep" = 11 WHERE "currentStep" = 7;
UPDATE "investigations" SET "currentStep" = 10 WHERE "currentStep" = 6;
UPDATE "investigations" SET "currentStep" = 6  WHERE "currentStep" = 5;
UPDATE "investigations" SET "currentStep" = 5  WHERE "currentStep" = 4;
