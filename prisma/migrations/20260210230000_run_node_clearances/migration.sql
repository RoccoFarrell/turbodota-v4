-- AlterTable
ALTER TABLE "IncrementalRun" ADD COLUMN IF NOT EXISTS "nodeClearances" JSONB;
