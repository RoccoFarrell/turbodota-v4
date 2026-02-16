-- Drop the old per-tick model and recreate as session-based
DROP TABLE IF EXISTS "IncrementalActionHistory";

CREATE TABLE "IncrementalActionHistory" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "actionType" TEXT NOT NULL,
    "actionHeroId" INTEGER,
    "actionStatKey" TEXT,
    "completions" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'idle',
    "itemId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "IncrementalActionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: find open sessions quickly (endedAt IS NULL)
CREATE INDEX "IncrementalActionHistory_saveId_endedAt_idx" ON "IncrementalActionHistory"("saveId", "endedAt");

-- CreateIndex: per-action/per-hero aggregates and recalc
CREATE INDEX "IncrementalActionHistory_saveId_actionType_actionHeroId_actionStatKey_idx" ON "IncrementalActionHistory"("saveId", "actionType", "actionHeroId", "actionStatKey");

-- AddForeignKey
ALTER TABLE "IncrementalActionHistory" ADD CONSTRAINT "IncrementalActionHistory_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
