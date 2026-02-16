-- CreateTable
CREATE TABLE "IncrementalActionHistory" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "actionHeroId" INTEGER,
    "actionStatKey" TEXT,
    "completions" INTEGER NOT NULL,
    "durationSec" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'idle_tick',
    "itemId" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncrementalActionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IncrementalActionHistory_saveId_at_idx" ON "IncrementalActionHistory"("saveId", "at");

-- CreateIndex
CREATE INDEX "IncrementalActionHistory_saveId_actionType_actionHeroId_actionStatKey_idx" ON "IncrementalActionHistory"("saveId", "actionType", "actionHeroId", "actionStatKey");

-- AddForeignKey
ALTER TABLE "IncrementalActionHistory" ADD CONSTRAINT "IncrementalActionHistory_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
