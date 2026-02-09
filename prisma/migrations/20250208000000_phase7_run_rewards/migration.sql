-- AlterTable
ALTER TABLE "IncrementalRun" ADD COLUMN "gold" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "IncrementalRun" ADD COLUMN "heroHp" JSONB;
ALTER TABLE "IncrementalRun" ADD COLUMN "xpByHeroId" JSONB;
