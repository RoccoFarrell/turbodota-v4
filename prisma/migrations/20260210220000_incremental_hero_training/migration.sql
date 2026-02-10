-- CreateTable: IncrementalHeroTraining (per-save, per-hero, per-stat training deltas)
CREATE TABLE "IncrementalHeroTraining" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "heroId" INTEGER NOT NULL,
    "statKey" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncrementalHeroTraining_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IncrementalHeroTraining_saveId_heroId_statKey_key" ON "IncrementalHeroTraining"("saveId", "heroId", "statKey");
CREATE INDEX "IncrementalHeroTraining_saveId_idx" ON "IncrementalHeroTraining"("saveId");
CREATE INDEX "IncrementalHeroTraining_saveId_heroId_idx" ON "IncrementalHeroTraining"("saveId", "heroId");

ALTER TABLE "IncrementalHeroTraining" ADD CONSTRAINT "IncrementalHeroTraining_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
