-- CreateTable
CREATE TABLE "IncrementalSaveHeroModification" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "heroId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "valueJson" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncrementalSaveHeroModification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IncrementalSaveHeroModification_saveId_idx" ON "IncrementalSaveHeroModification"("saveId");

-- CreateIndex
CREATE INDEX "IncrementalSaveHeroModification_saveId_heroId_idx" ON "IncrementalSaveHeroModification"("saveId", "heroId");

-- CreateIndex
CREATE UNIQUE INDEX "IncrementalSaveHeroModification_saveId_heroId_kind_key_key" ON "IncrementalSaveHeroModification"("saveId", "heroId", "kind", "key");

-- AddForeignKey
ALTER TABLE "IncrementalSaveHeroModification" ADD CONSTRAINT "IncrementalSaveHeroModification_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
