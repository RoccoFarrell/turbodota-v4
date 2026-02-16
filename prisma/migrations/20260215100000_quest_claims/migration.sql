-- CreateTable
CREATE TABLE "IncrementalQuestClaim" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "claimCount" INTEGER NOT NULL DEFAULT 0,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncrementalQuestClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IncrementalQuestClaim_saveId_idx" ON "IncrementalQuestClaim"("saveId");

-- CreateIndex
CREATE UNIQUE INDEX "IncrementalQuestClaim_saveId_questId_key" ON "IncrementalQuestClaim"("saveId", "questId");

-- AddForeignKey
ALTER TABLE "IncrementalQuestClaim" ADD CONSTRAINT "IncrementalQuestClaim_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
