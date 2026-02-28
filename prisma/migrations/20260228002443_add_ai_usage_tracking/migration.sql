-- AlterTable
ALTER TABLE "users" ADD COLUMN     "aiDailyLimit" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "aiMonthlyLimit" INTEGER NOT NULL DEFAULT 200;

-- CreateTable
CREATE TABLE "ai_usage_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "estimatedCost" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_usage_records_userId_createdAt_idx" ON "ai_usage_records"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_usage_records_createdAt_idx" ON "ai_usage_records"("createdAt");

-- AddForeignKey
ALTER TABLE "ai_usage_records" ADD CONSTRAINT "ai_usage_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
