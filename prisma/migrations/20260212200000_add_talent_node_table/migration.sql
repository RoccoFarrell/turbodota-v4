-- CreateTable: IncrementalTalentNode (talent tree purchases)
CREATE TABLE IF NOT EXISTS "IncrementalTalentNode" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncrementalTalentNode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IncrementalTalentNode_saveId_nodeId_key" ON "IncrementalTalentNode"("saveId", "nodeId");
CREATE INDEX IF NOT EXISTS "IncrementalTalentNode_saveId_idx" ON "IncrementalTalentNode"("saveId");

ALTER TABLE "IncrementalTalentNode" ADD CONSTRAINT "IncrementalTalentNode_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
