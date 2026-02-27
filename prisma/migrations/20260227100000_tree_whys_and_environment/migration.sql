-- Add ENVIRONMENT to ProblemCategory enum
ALTER TYPE "ProblemCategory" ADD VALUE 'ENVIRONMENT';

-- Add new columns to five_whys_records (with defaults for existing rows)
ALTER TABLE "five_whys_records" ADD COLUMN "treeIndex" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "five_whys_records" ADD COLUMN "depth" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "five_whys_records" ADD COLUMN "parentId" TEXT;

-- Migrate existing data: copy whyNumber into depth
UPDATE "five_whys_records" SET "depth" = "whyNumber";

-- Drop old unique constraint and column
DROP INDEX "five_whys_records_investigationId_whyNumber_key";
ALTER TABLE "five_whys_records" DROP COLUMN "whyNumber";

-- Add self-referential foreign key
ALTER TABLE "five_whys_records" ADD CONSTRAINT "five_whys_records_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "five_whys_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add index on parentId
CREATE INDEX "five_whys_records_parentId_idx" ON "five_whys_records"("parentId");
