-- Replace IncrementalQuestClaim with IncrementalSaveQuest (merged quest state + start date).
-- No backfill: drop old table, create new one. Default startedAt = 2026-02-13 00:00 EST = 05:00 UTC.

DROP TABLE IF EXISTS "IncrementalQuestClaim";

CREATE TABLE "IncrementalSaveQuest" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT '2026-02-13 05:00:00+00',
    "claimCount" INTEGER NOT NULL DEFAULT 0,
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "IncrementalSaveQuest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IncrementalSaveQuest_saveId_questId_key" ON "IncrementalSaveQuest"("saveId", "questId");
CREATE INDEX "IncrementalSaveQuest_saveId_idx" ON "IncrementalSaveQuest"("saveId");

ALTER TABLE "IncrementalSaveQuest" ADD CONSTRAINT "IncrementalSaveQuest_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
