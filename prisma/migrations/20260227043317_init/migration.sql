-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'INVESTIGATOR', 'REVIEWER', 'VIEWER');

-- CreateEnum
CREATE TYPE "InvestigationStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'PENDING_REVIEW', 'CLOSED', 'REOPENED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ProblemCategory" AS ENUM ('HUMAN', 'PROCESS', 'EQUIPMENT', 'MATERIAL', 'MEASUREMENT');

-- CreateEnum
CREATE TYPE "CAPAType" AS ENUM ('CORRECTION', 'CORRECTIVE_ACTION', 'PREVENTIVE_ACTION');

-- CreateEnum
CREATE TYPE "CAPAPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "CAPAStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EffectivenessResult" AS ENUM ('EFFECTIVE', 'NOT_EFFECTIVE', 'PENDING');

-- CreateEnum
CREATE TYPE "DetectionMethod" AS ENUM ('DEVIATION', 'OOS', 'ALARM', 'AUDIT', 'COMPLAINT', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'INVESTIGATOR',
    "department" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investigations" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "InvestigationStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "reviewerId" TEXT,

    CONSTRAINT "investigations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problem_definitions" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "detectionMethod" "DetectionMethod" NOT NULL,
    "detectionDetail" TEXT,
    "containmentActions" TEXT NOT NULL,
    "productAffected" BOOLEAN NOT NULL DEFAULT false,
    "productDetails" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "problem_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_assessments" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "q1Score" INTEGER NOT NULL,
    "q2Score" INTEGER NOT NULL,
    "q3Score" INTEGER NOT NULL,
    "q4Score" INTEGER NOT NULL,
    "q5Score" INTEGER NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problem_category_records" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "category" "ProblemCategory" NOT NULL,
    "justification" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "problem_category_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "five_whys_records" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "whyNumber" INTEGER NOT NULL,
    "whyQuestion" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "five_whys_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "root_cause_records" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "rootCauseStatement" TEXT NOT NULL,
    "validationQ1" BOOLEAN NOT NULL,
    "validationQ2" BOOLEAN NOT NULL,
    "validationQ3" BOOLEAN NOT NULL,
    "hasWarnings" BOOLEAN NOT NULL DEFAULT false,
    "warningAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "root_cause_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capa_actions" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "type" "CAPAType" NOT NULL,
    "description" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "priority" "CAPAPriority" NOT NULL,
    "successMetric" TEXT NOT NULL,
    "status" "CAPAStatus" NOT NULL DEFAULT 'OPEN',
    "completedAt" TIMESTAMP(3),
    "completionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capa_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "effectiveness_records" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "monitoringPeriodDays" INTEGER NOT NULL,
    "verificationMethod" TEXT NOT NULL,
    "successCriteria" TEXT NOT NULL,
    "result" "EffectivenessResult" NOT NULL DEFAULT 'PENDING',
    "resultDetail" TEXT,
    "reviewerApproved" BOOLEAN NOT NULL DEFAULT false,
    "reviewerName" TEXT,
    "reviewerNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "effectiveness_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "investigations_referenceNumber_key" ON "investigations"("referenceNumber");

-- CreateIndex
CREATE INDEX "investigations_status_idx" ON "investigations"("status");

-- CreateIndex
CREATE INDEX "investigations_createdById_idx" ON "investigations"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "problem_definitions_investigationId_key" ON "problem_definitions"("investigationId");

-- CreateIndex
CREATE UNIQUE INDEX "risk_assessments_investigationId_key" ON "risk_assessments"("investigationId");

-- CreateIndex
CREATE UNIQUE INDEX "problem_category_records_investigationId_key" ON "problem_category_records"("investigationId");

-- CreateIndex
CREATE INDEX "five_whys_records_investigationId_idx" ON "five_whys_records"("investigationId");

-- CreateIndex
CREATE UNIQUE INDEX "five_whys_records_investigationId_whyNumber_key" ON "five_whys_records"("investigationId", "whyNumber");

-- CreateIndex
CREATE UNIQUE INDEX "root_cause_records_investigationId_key" ON "root_cause_records"("investigationId");

-- CreateIndex
CREATE INDEX "capa_actions_investigationId_idx" ON "capa_actions"("investigationId");

-- CreateIndex
CREATE INDEX "capa_actions_ownerId_idx" ON "capa_actions"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "effectiveness_records_investigationId_key" ON "effectiveness_records"("investigationId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- AddForeignKey
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_definitions" ADD CONSTRAINT "problem_definitions_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problem_category_records" ADD CONSTRAINT "problem_category_records_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "five_whys_records" ADD CONSTRAINT "five_whys_records_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "root_cause_records" ADD CONSTRAINT "root_cause_records_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capa_actions" ADD CONSTRAINT "capa_actions_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capa_actions" ADD CONSTRAINT "capa_actions_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "effectiveness_records" ADD CONSTRAINT "effectiveness_records_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
