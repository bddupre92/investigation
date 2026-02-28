-- CreateEnum
CREATE TYPE "CauseType" AS ENUM ('COMMON', 'SPECIAL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "SuspectedCauses" AS ENUM ('SINGLE', 'MULTIPLE');

-- AlterTable
ALTER TABLE "five_whys_records" ALTER COLUMN "depth" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tool_decisions" ADD COLUMN     "aiRecommendation" TEXT,
ADD COLUMN     "causeType" "CauseType",
ADD COLUMN     "howDetail" TEXT,
ADD COLUMN     "howMuch" TEXT,
ADD COLUMN     "isRecurring" BOOLEAN,
ADD COLUMN     "processChangeDetail" TEXT,
ADD COLUMN     "processChangeInvolved" BOOLEAN,
ADD COLUMN     "suspectedCauses" "SuspectedCauses",
ADD COLUMN     "whereDetail" TEXT,
ADD COLUMN     "who" TEXT,
ADD COLUMN     "why" TEXT;
