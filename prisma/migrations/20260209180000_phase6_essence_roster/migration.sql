-- Phase 6: Essence, browser actions, roster
-- AlterTable
ALTER TABLE "User" ADD COLUMN "essence" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "IncrementalActionState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastTickAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncrementalActionState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncrementalRosterHero" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "heroId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncrementalRosterHero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncrementalConvertedMatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncrementalConvertedMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IncrementalActionState_userId_key" ON "IncrementalActionState"("userId");

-- CreateIndex
CREATE INDEX "IncrementalActionState_userId_idx" ON "IncrementalActionState"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "IncrementalRosterHero_userId_heroId_key" ON "IncrementalRosterHero"("userId", "heroId");

-- CreateIndex
CREATE INDEX "IncrementalRosterHero_userId_idx" ON "IncrementalRosterHero"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "IncrementalConvertedMatch_userId_matchId_key" ON "IncrementalConvertedMatch"("userId", "matchId");

-- CreateIndex
CREATE INDEX "IncrementalConvertedMatch_userId_idx" ON "IncrementalConvertedMatch"("userId");

-- AddForeignKey
ALTER TABLE "IncrementalActionState" ADD CONSTRAINT "IncrementalActionState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncrementalRosterHero" ADD CONSTRAINT "IncrementalRosterHero_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncrementalConvertedMatch" ADD CONSTRAINT "IncrementalConvertedMatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
