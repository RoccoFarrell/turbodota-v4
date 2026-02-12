-- CreateTable: IncrementalUpgrade (Phase 13.6 - extensible upgrade system)
CREATE TABLE "IncrementalUpgrade" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "upgradeType" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncrementalUpgrade_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IncrementalUpgrade_saveId_upgradeType_key" ON "IncrementalUpgrade"("saveId", "upgradeType");
CREATE INDEX "IncrementalUpgrade_saveId_idx" ON "IncrementalUpgrade"("saveId");

ALTER TABLE "IncrementalUpgrade" ADD CONSTRAINT "IncrementalUpgrade_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
