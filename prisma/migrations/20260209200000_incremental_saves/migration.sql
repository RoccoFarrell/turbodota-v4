-- Incremental data per "save" (multiple saves per user). User record stays auth-only.
-- CreateTable IncrementalSave
CREATE TABLE "IncrementalSave" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "essence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncrementalSave_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "IncrementalSave_userId_idx" ON "IncrementalSave"("userId");
ALTER TABLE "IncrementalSave" ADD CONSTRAINT "IncrementalSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: one save per user with current essence
INSERT INTO "IncrementalSave" ("id", "userId", "essence", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, "id", COALESCE("essence", 0), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "User";

-- IncrementalActionState: add saveId, backfill, then switch
ALTER TABLE "IncrementalActionState" ADD COLUMN "saveId" TEXT;
UPDATE "IncrementalActionState" SET "saveId" = (SELECT "id" FROM "IncrementalSave" WHERE "IncrementalSave"."userId" = "IncrementalActionState"."userId" LIMIT 1);
ALTER TABLE "IncrementalActionState" ALTER COLUMN "saveId" SET NOT NULL;
DROP INDEX IF EXISTS "IncrementalActionState_userId_key";
DROP INDEX IF EXISTS "IncrementalActionState_userId_idx";
ALTER TABLE "IncrementalActionState" DROP CONSTRAINT IF EXISTS "IncrementalActionState_userId_fkey";
ALTER TABLE "IncrementalActionState" DROP COLUMN "userId";
CREATE UNIQUE INDEX "IncrementalActionState_saveId_key" ON "IncrementalActionState"("saveId");
CREATE INDEX "IncrementalActionState_saveId_idx" ON "IncrementalActionState"("saveId");
ALTER TABLE "IncrementalActionState" ADD CONSTRAINT "IncrementalActionState_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- IncrementalRosterHero: add saveId, backfill, then switch
ALTER TABLE "IncrementalRosterHero" ADD COLUMN "saveId" TEXT;
UPDATE "IncrementalRosterHero" SET "saveId" = (SELECT "id" FROM "IncrementalSave" WHERE "IncrementalSave"."userId" = "IncrementalRosterHero"."userId" LIMIT 1);
ALTER TABLE "IncrementalRosterHero" ALTER COLUMN "saveId" SET NOT NULL;
DROP INDEX IF EXISTS "IncrementalRosterHero_userId_heroId_key";
DROP INDEX IF EXISTS "IncrementalRosterHero_userId_idx";
ALTER TABLE "IncrementalRosterHero" DROP CONSTRAINT IF EXISTS "IncrementalRosterHero_userId_fkey";
ALTER TABLE "IncrementalRosterHero" DROP COLUMN "userId";
CREATE UNIQUE INDEX "IncrementalRosterHero_saveId_heroId_key" ON "IncrementalRosterHero"("saveId", "heroId");
CREATE INDEX "IncrementalRosterHero_saveId_idx" ON "IncrementalRosterHero"("saveId");
ALTER TABLE "IncrementalRosterHero" ADD CONSTRAINT "IncrementalRosterHero_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- IncrementalConvertedMatch: add saveId, backfill, then switch
ALTER TABLE "IncrementalConvertedMatch" ADD COLUMN "saveId" TEXT;
UPDATE "IncrementalConvertedMatch" SET "saveId" = (SELECT "id" FROM "IncrementalSave" WHERE "IncrementalSave"."userId" = "IncrementalConvertedMatch"."userId" LIMIT 1);
ALTER TABLE "IncrementalConvertedMatch" ALTER COLUMN "saveId" SET NOT NULL;
DROP INDEX IF EXISTS "IncrementalConvertedMatch_userId_matchId_key";
DROP INDEX IF EXISTS "IncrementalConvertedMatch_userId_idx";
ALTER TABLE "IncrementalConvertedMatch" DROP CONSTRAINT IF EXISTS "IncrementalConvertedMatch_userId_fkey";
ALTER TABLE "IncrementalConvertedMatch" DROP COLUMN "userId";
CREATE UNIQUE INDEX "IncrementalConvertedMatch_saveId_matchId_key" ON "IncrementalConvertedMatch"("saveId", "matchId");
CREATE INDEX "IncrementalConvertedMatch_saveId_idx" ON "IncrementalConvertedMatch"("saveId");
ALTER TABLE "IncrementalConvertedMatch" ADD CONSTRAINT "IncrementalConvertedMatch_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- IncrementalLineup: add saveId, backfill, then switch
ALTER TABLE "IncrementalLineup" ADD COLUMN "saveId" TEXT;
UPDATE "IncrementalLineup" SET "saveId" = (SELECT "id" FROM "IncrementalSave" WHERE "IncrementalSave"."userId" = "IncrementalLineup"."userId" LIMIT 1);
ALTER TABLE "IncrementalLineup" ALTER COLUMN "saveId" SET NOT NULL;
DROP INDEX IF EXISTS "IncrementalLineup_userId_idx";
ALTER TABLE "IncrementalLineup" DROP CONSTRAINT IF EXISTS "IncrementalLineup_userId_fkey";
ALTER TABLE "IncrementalLineup" DROP COLUMN "userId";
CREATE INDEX "IncrementalLineup_saveId_idx" ON "IncrementalLineup"("saveId");
ALTER TABLE "IncrementalLineup" ADD CONSTRAINT "IncrementalLineup_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- User: remove essence
ALTER TABLE "User" DROP COLUMN IF EXISTS "essence";
