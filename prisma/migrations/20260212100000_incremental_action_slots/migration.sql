-- CreateTable: IncrementalActionSlot (multi-slot action system)
CREATE TABLE "IncrementalActionSlot" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "actionType" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastTickAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionHeroId" INTEGER,
    "actionStatKey" TEXT,

    CONSTRAINT "IncrementalActionSlot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IncrementalActionSlot_saveId_slotIndex_key" ON "IncrementalActionSlot"("saveId", "slotIndex");
CREATE INDEX "IncrementalActionSlot_saveId_idx" ON "IncrementalActionSlot"("saveId");

ALTER TABLE "IncrementalActionSlot" ADD CONSTRAINT "IncrementalActionSlot_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing IncrementalActionState rows to slot index 0
INSERT INTO "IncrementalActionSlot" ("id", "saveId", "slotIndex", "actionType", "progress", "lastTickAt", "actionHeroId", "actionStatKey")
SELECT "id", "saveId", 0, "actionType", "progress", "lastTickAt", "actionHeroId", "actionStatKey"
FROM "IncrementalActionState";
