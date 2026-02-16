-- AlterTable: add claimCount to IncrementalQuestClaim (repeatable quests)
ALTER TABLE "IncrementalQuestClaim" ADD COLUMN IF NOT EXISTS "claimCount" INTEGER NOT NULL DEFAULT 0;
