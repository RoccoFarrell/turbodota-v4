-- AlterTable
ALTER TABLE "IncrementalSaveQuest" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'recurring';

-- CreateIndex
CREATE INDEX "IncrementalSaveQuest_saveId_type_idx" ON "IncrementalSaveQuest"("saveId", "type");
