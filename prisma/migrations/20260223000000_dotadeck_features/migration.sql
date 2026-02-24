-- CreateEnum
CREATE TYPE "StatType" AS ENUM ('KILLS', 'ASSISTS', 'NET_WORTH', 'LAST_HITS', 'DENIES', 'DAMAGE', 'HEALING', 'BUILDING', 'SUPPORT', 'SCORE');

-- CreateEnum
CREATE TYPE "EffectType" AS ENUM ('STAT_MULTIPLIER', 'STAT_ADDER', 'SCORE_MULTIPLIER');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "CardAction" AS ENUM ('DRAWN', 'DISCARDED', 'QUEST_WIN', 'QUEST_LOSS', 'PASSIVE_MOD');

-- CreateEnum
CREATE TYPE "ModType" AS ENUM ('ADD', 'SUBTRACT', 'RESET', 'MODIFY');

-- CreateEnum
CREATE TYPE "IncrementalRunStatus" AS ENUM ('ACTIVE', 'WON', 'DEAD');

-- CreateEnum
CREATE TYPE "IncrementalNodeType" AS ENUM ('COMBAT', 'ELITE', 'BOSS', 'SHOP', 'EVENT', 'REST', 'BASE');

-- DropForeignKey
ALTER TABLE "Key" DROP CONSTRAINT "Key_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_user_id_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_account_id_fkey";

-- AlterTable
ALTER TABLE "DotaUser" ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "display_name" TEXT;

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "hero_variant" INTEGER,
ALTER COLUMN "leaver_status" DROP NOT NULL,
ALTER COLUMN "lobby_type" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Season" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "google_id" TEXT,
ALTER COLUMN "account_id" DROP NOT NULL,
ALTER COLUMN "profile_url" DROP NOT NULL,
ALTER COLUMN "avatar_url" DROP NOT NULL;

-- AlterTable
ALTER TABLE "_DotaUserToLeague" ADD CONSTRAINT "_DotaUserToLeague_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_DotaUserToLeague_AB_unique";

-- AlterTable
ALTER TABLE "_DotaUserToSeason" ADD CONSTRAINT "_DotaUserToSeason_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_DotaUserToSeason_AB_unique";

-- AlterTable
ALTER TABLE "_RandomToSeason" ADD CONSTRAINT "_RandomToSeason_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_RandomToSeason_AB_unique";

-- DropTable
DROP TABLE "Key";

-- DropTable
DROP TABLE "Session";

-- CreateTable
CREATE TABLE "Turbotown" (
    "id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "seasonID" INTEGER NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Turbotown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TurbotownMetric" (
    "id" SERIAL NOT NULL,
    "turbotownID" INTEGER NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "label" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "TurbotownMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TurbotownQuest" (
    "id" SERIAL NOT NULL,
    "active" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,
    "win" BOOLEAN,
    "xp" INTEGER NOT NULL,
    "gold" INTEGER NOT NULL,
    "endXp" INTEGER,
    "endGold" INTEGER,
    "questSlot" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "endDate" TIMESTAMP(3),
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdDate" TIMESTAMP(3) NOT NULL,
    "randomID" INTEGER NOT NULL,
    "turbotownID" INTEGER NOT NULL,

    CONSTRAINT "TurbotownQuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TurbotownItem" (
    "id" SERIAL NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "turbotownID" INTEGER NOT NULL,
    "itemID" INTEGER NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "TurbotownItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TurbotownStatus" (
    "id" SERIAL NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "appliedDate" TIMESTAMP(3) NOT NULL,
    "resolvedDate" TIMESTAMP(3),
    "turbotownID" INTEGER NOT NULL,

    CONSTRAINT "TurbotownStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TurbotownAction" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "value" TEXT,
    "appliedDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "turbotownID" INTEGER NOT NULL,
    "turbotownDestinationID" INTEGER NOT NULL,

    CONSTRAINT "TurbotownAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imgSrc" TEXT NOT NULL,
    "goldCost" INTEGER NOT NULL,
    "quantityAvailable" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeroCard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "baseFormula" TEXT NOT NULL,
    "effectType" "EffectType" NOT NULL,
    "statType" "StatType" NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "requiresTarget" BOOLEAN NOT NULL DEFAULT false,
    "isDurationBased" BOOLEAN NOT NULL DEFAULT false,
    "isStackable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timesPlayed" INTEGER NOT NULL DEFAULT 0,
    "totalScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastPlayedAt" TIMESTAMP(3),

    CONSTRAINT "UserCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DotaDeckGame" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gold" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "status" "GameStatus" NOT NULL DEFAULT 'ACTIVE',
    "soloGamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "winStreak" INTEGER NOT NULL DEFAULT 0,
    "playStreak" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DotaDeckGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "matchId" BIGINT,
    "accountId" INTEGER NOT NULL,
    "finalScore" INTEGER NOT NULL DEFAULT 0,
    "status" "RoundStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "gameId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoundUserCard" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "userCardId" TEXT NOT NULL,
    "multiplierAchieved" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "scoreContribution" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RoundUserCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonUser" (
    "id" TEXT NOT NULL,
    "accountId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "handSize" INTEGER NOT NULL DEFAULT 3,
    "discardTokens" INTEGER NOT NULL DEFAULT 5,
    "hasSeenRules" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeasonUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "heroId" INTEGER NOT NULL,
    "baseGold" INTEGER NOT NULL DEFAULT 100,
    "baseXP" INTEGER NOT NULL DEFAULT 100,
    "goldMod" INTEGER NOT NULL DEFAULT 0,
    "xpMod" INTEGER NOT NULL DEFAULT 0,
    "drawLockCount" INTEGER NOT NULL DEFAULT 0,
    "lastDrawn" TIMESTAMP(3),
    "holderId" TEXT,
    "drawnAt" TIMESTAMP(3),
    "deckId" TEXT,
    "position" INTEGER,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deck" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardHistory" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "action" "CardAction" NOT NULL,
    "modType" "ModType" NOT NULL,
    "seasonUserId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentGold" INTEGER NOT NULL,
    "currentXP" INTEGER NOT NULL,
    "goldMod" INTEGER NOT NULL,
    "xpMod" INTEGER NOT NULL,

    CONSTRAINT "CardHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeroDraw" (
    "id" TEXT NOT NULL,
    "seasonUserId" TEXT NOT NULL,
    "heroId" INTEGER NOT NULL,
    "drawnAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matchResult" BOOLEAN,
    "matchId" TEXT,
    "cardId" TEXT,

    CONSTRAINT "HeroDraw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncrementalSave" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "account_id" INTEGER,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncrementalSave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncrementalBankCurrency" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "currencyKey" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "IncrementalBankCurrency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncrementalBankItem" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "itemDefId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "IncrementalBankItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncrementalRuneGrantedMatch" (
    "id" SERIAL NOT NULL,
    "matchId" BIGINT NOT NULL,
    "account_id" INTEGER NOT NULL,

    CONSTRAINT "IncrementalRuneGrantedMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncrementalLineup" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "heroIds" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncrementalLineup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncrementalRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lineupId" TEXT NOT NULL,
    "status" "IncrementalRunStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentNodeId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "seed" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "gold" INTEGER NOT NULL DEFAULT 0,
    "heroHp" JSONB,
    "xpByHeroId" JSONB,
    "nodeClearances" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncrementalRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncrementalMapNode" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "nodeType" "IncrementalNodeType" NOT NULL,
    "encounterId" TEXT,
    "nextNodeIds" TEXT[],
    "floor" INTEGER,
    "act" INTEGER,

    CONSTRAINT "IncrementalMapNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncrementalActionState" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastTickAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionHeroId" INTEGER,
    "actionStatKey" TEXT,

    CONSTRAINT "IncrementalActionState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncrementalActionSlot" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "actionType" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastTickAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionHeroId" INTEGER,
    "actionStatKey" TEXT,
    "actionPartyHeroIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],

    CONSTRAINT "IncrementalActionSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncrementalRosterHero" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "heroId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncrementalRosterHero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncrementalConvertedMatch" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "matchId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncrementalConvertedMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncrementalHeroTraining" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "heroId" INTEGER NOT NULL,
    "statKey" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncrementalHeroTraining_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncrementalTalentNode" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncrementalTalentNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncrementalUpgrade" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "upgradeType" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncrementalUpgrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncrementalHeroBaseStat" (
    "heroId" INTEGER NOT NULL,
    "localizedName" TEXT NOT NULL,
    "primaryAttribute" TEXT NOT NULL,
    "baseAttackInterval" DOUBLE PRECISION NOT NULL,
    "baseAttackDamage" INTEGER NOT NULL,
    "baseMaxHp" INTEGER NOT NULL,
    "baseArmor" DOUBLE PRECISION NOT NULL,
    "baseMagicResist" DOUBLE PRECISION NOT NULL,
    "baseSpellInterval" DOUBLE PRECISION,
    "abilityId1" TEXT NOT NULL,
    "abilityId2" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "IncrementalHeroAbility" (
    "id" TEXT NOT NULL,
    "abilityName" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "effect" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "damageType" TEXT,
    "baseDamage" INTEGER,
    "returnDamageRatio" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncrementalHeroAbility_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "IncrementalSaveQuest" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'recurring',
    "startedAt" TIMESTAMP(3) NOT NULL,
    "claimCount" INTEGER NOT NULL DEFAULT 0,
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "IncrementalSaveQuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncrementalActionHistory" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "actionType" TEXT NOT NULL,
    "actionHeroId" INTEGER,
    "actionStatKey" TEXT,
    "completions" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'idle',
    "itemId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "IncrementalActionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Turbotown_account_id_seasonID_key" ON "Turbotown"("account_id", "seasonID");

-- CreateIndex
CREATE UNIQUE INDEX "TurbotownMetric_turbotownID_label_key" ON "TurbotownMetric"("turbotownID", "label");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_id_key" ON "UserSession"("id");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HeroCard_name_key" ON "HeroCard"("name");

-- CreateIndex
CREATE INDEX "UserCard_userId_idx" ON "UserCard"("userId");

-- CreateIndex
CREATE INDEX "UserCard_cardId_idx" ON "UserCard"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCard_userId_cardId_key" ON "UserCard"("userId", "cardId");

-- CreateIndex
CREATE INDEX "DotaDeckGame_userId_idx" ON "DotaDeckGame"("userId");

-- CreateIndex
CREATE INDEX "Round_gameId_idx" ON "Round"("gameId");

-- CreateIndex
CREATE INDEX "Round_matchId_accountId_idx" ON "Round"("matchId", "accountId");

-- CreateIndex
CREATE INDEX "RoundUserCard_roundId_idx" ON "RoundUserCard"("roundId");

-- CreateIndex
CREATE INDEX "RoundUserCard_userCardId_idx" ON "RoundUserCard"("userCardId");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonUser_seasonId_accountId_key" ON "SeasonUser"("seasonId", "accountId");

-- CreateIndex
CREATE INDEX "Card_deckId_idx" ON "Card"("deckId");

-- CreateIndex
CREATE INDEX "Card_heroId_idx" ON "Card"("heroId");

-- CreateIndex
CREATE UNIQUE INDEX "Deck_seasonId_name_key" ON "Deck"("seasonId", "name");

-- CreateIndex
CREATE INDEX "IncrementalSave_userId_idx" ON "IncrementalSave"("userId");

-- CreateIndex
CREATE INDEX "IncrementalBankCurrency_saveId_idx" ON "IncrementalBankCurrency"("saveId");

-- CreateIndex
CREATE UNIQUE INDEX "IncrementalBankCurrency_saveId_currencyKey_key" ON "IncrementalBankCurrency"("saveId", "currencyKey");

-- CreateIndex
CREATE INDEX "IncrementalBankItem_saveId_idx" ON "IncrementalBankItem"("saveId");

-- CreateIndex
CREATE UNIQUE INDEX "IncrementalBankItem_saveId_itemDefId_key" ON "IncrementalBankItem"("saveId", "itemDefId");

-- CreateIndex
CREATE INDEX "IncrementalRuneGrantedMatch_account_id_idx" ON "IncrementalRuneGrantedMatch"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "IncrementalRuneGrantedMatch_matchId_account_id_key" ON "IncrementalRuneGrantedMatch"("matchId", "account_id");

-- CreateIndex
CREATE INDEX "IncrementalLineup_saveId_idx" ON "IncrementalLineup"("saveId");

-- CreateIndex
CREATE INDEX "IncrementalRun_userId_idx" ON "IncrementalRun"("userId");

-- CreateIndex
CREATE INDEX "IncrementalRun_lineupId_idx" ON "IncrementalRun"("lineupId");

-- CreateIndex
CREATE INDEX "IncrementalMapNode_runId_idx" ON "IncrementalMapNode"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "IncrementalActionState_saveId_key" ON "IncrementalActionState"("saveId");

-- CreateIndex
CREATE INDEX "IncrementalActionState_saveId_idx" ON "IncrementalActionState"("saveId");

-- CreateIndex
CREATE INDEX "IncrementalActionSlot_saveId_idx" ON "IncrementalActionSlot"("saveId");

-- CreateIndex
CREATE UNIQUE INDEX "IncrementalActionSlot_saveId_slotIndex_key" ON "IncrementalActionSlot"("saveId", "slotIndex");

-- CreateIndex
CREATE INDEX "IncrementalRosterHero_saveId_idx" ON "IncrementalRosterHero"("saveId");

-- CreateIndex
CREATE UNIQUE INDEX "IncrementalRosterHero_saveId_heroId_key" ON "IncrementalRosterHero"("saveId", "heroId");

-- CreateIndex
CREATE INDEX "IncrementalConvertedMatch_saveId_idx" ON "IncrementalConvertedMatch"("saveId");

-- CreateIndex
CREATE UNIQUE INDEX "IncrementalConvertedMatch_saveId_matchId_key" ON "IncrementalConvertedMatch"("saveId", "matchId");

-- CreateIndex
CREATE INDEX "IncrementalHeroTraining_saveId_idx" ON "IncrementalHeroTraining"("saveId");

-- CreateIndex
CREATE INDEX "IncrementalHeroTraining_saveId_heroId_idx" ON "IncrementalHeroTraining"("saveId", "heroId");

-- CreateIndex
CREATE UNIQUE INDEX "IncrementalHeroTraining_saveId_heroId_statKey_key" ON "IncrementalHeroTraining"("saveId", "heroId", "statKey");

-- CreateIndex
CREATE INDEX "IncrementalTalentNode_saveId_idx" ON "IncrementalTalentNode"("saveId");

-- CreateIndex
CREATE UNIQUE INDEX "IncrementalTalentNode_saveId_nodeId_key" ON "IncrementalTalentNode"("saveId", "nodeId");

-- CreateIndex
CREATE INDEX "IncrementalUpgrade_saveId_idx" ON "IncrementalUpgrade"("saveId");

-- CreateIndex
CREATE UNIQUE INDEX "IncrementalUpgrade_saveId_upgradeType_key" ON "IncrementalUpgrade"("saveId", "upgradeType");

-- CreateIndex
CREATE UNIQUE INDEX "IncrementalHeroBaseStat_heroId_key" ON "IncrementalHeroBaseStat"("heroId");

-- CreateIndex
CREATE INDEX "IncrementalHeroBaseStat_heroId_idx" ON "IncrementalHeroBaseStat"("heroId");

-- CreateIndex
CREATE INDEX "IncrementalHeroAbility_id_idx" ON "IncrementalHeroAbility"("id");

-- CreateIndex
CREATE INDEX "IncrementalSaveHeroModification_saveId_idx" ON "IncrementalSaveHeroModification"("saveId");

-- CreateIndex
CREATE INDEX "IncrementalSaveHeroModification_saveId_heroId_idx" ON "IncrementalSaveHeroModification"("saveId", "heroId");

-- CreateIndex
CREATE UNIQUE INDEX "IncrementalSaveHeroModification_saveId_heroId_kind_key_key" ON "IncrementalSaveHeroModification"("saveId", "heroId", "kind", "key");

-- CreateIndex
CREATE INDEX "IncrementalSaveQuest_saveId_idx" ON "IncrementalSaveQuest"("saveId");

-- CreateIndex
CREATE INDEX "IncrementalSaveQuest_saveId_type_idx" ON "IncrementalSaveQuest"("saveId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "IncrementalSaveQuest_saveId_questId_key" ON "IncrementalSaveQuest"("saveId", "questId");

-- CreateIndex
CREATE INDEX "IncrementalActionHistory_saveId_endedAt_idx" ON "IncrementalActionHistory"("saveId", "endedAt");

-- CreateIndex
CREATE INDEX "IncrementalActionHistory_saveId_actionType_actionHeroId_act_idx" ON "IncrementalActionHistory"("saveId", "actionType", "actionHeroId", "actionStatKey");

-- CreateIndex
CREATE UNIQUE INDEX "User_google_id_key" ON "User"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "DotaUser"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turbotown" ADD CONSTRAINT "Turbotown_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "User"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turbotown" ADD CONSTRAINT "Turbotown_seasonID_fkey" FOREIGN KEY ("seasonID") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurbotownMetric" ADD CONSTRAINT "TurbotownMetric_turbotownID_fkey" FOREIGN KEY ("turbotownID") REFERENCES "Turbotown"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurbotownQuest" ADD CONSTRAINT "TurbotownQuest_randomID_fkey" FOREIGN KEY ("randomID") REFERENCES "Random"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurbotownQuest" ADD CONSTRAINT "TurbotownQuest_turbotownID_fkey" FOREIGN KEY ("turbotownID") REFERENCES "Turbotown"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurbotownItem" ADD CONSTRAINT "TurbotownItem_turbotownID_fkey" FOREIGN KEY ("turbotownID") REFERENCES "Turbotown"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurbotownItem" ADD CONSTRAINT "TurbotownItem_itemID_fkey" FOREIGN KEY ("itemID") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurbotownStatus" ADD CONSTRAINT "TurbotownStatus_turbotownID_fkey" FOREIGN KEY ("turbotownID") REFERENCES "Turbotown"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurbotownAction" ADD CONSTRAINT "TurbotownAction_turbotownID_fkey" FOREIGN KEY ("turbotownID") REFERENCES "Turbotown"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurbotownAction" ADD CONSTRAINT "TurbotownAction_turbotownDestinationID_fkey" FOREIGN KEY ("turbotownDestinationID") REFERENCES "Turbotown"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "HeroCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DotaDeckGame" ADD CONSTRAINT "DotaDeckGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "DotaDeckGame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_matchId_accountId_fkey" FOREIGN KEY ("matchId", "accountId") REFERENCES "PlayersMatchDetail"("match_id", "account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundUserCard" ADD CONSTRAINT "RoundUserCard_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundUserCard" ADD CONSTRAINT "RoundUserCard_userCardId_fkey" FOREIGN KEY ("userCardId") REFERENCES "UserCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonUser" ADD CONSTRAINT "SeasonUser_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonUser" ADD CONSTRAINT "SeasonUser_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "DotaUser"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_heroId_fkey" FOREIGN KEY ("heroId") REFERENCES "Hero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_holderId_fkey" FOREIGN KEY ("holderId") REFERENCES "SeasonUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardHistory" ADD CONSTRAINT "CardHistory_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardHistory" ADD CONSTRAINT "CardHistory_seasonUserId_fkey" FOREIGN KEY ("seasonUserId") REFERENCES "SeasonUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeroDraw" ADD CONSTRAINT "HeroDraw_seasonUserId_fkey" FOREIGN KEY ("seasonUserId") REFERENCES "SeasonUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeroDraw" ADD CONSTRAINT "HeroDraw_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncrementalSave" ADD CONSTRAINT "IncrementalSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncrementalBankCurrency" ADD CONSTRAINT "IncrementalBankCurrency_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncrementalBankItem" ADD CONSTRAINT "IncrementalBankItem_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncrementalLineup" ADD CONSTRAINT "IncrementalLineup_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncrementalRun" ADD CONSTRAINT "IncrementalRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncrementalRun" ADD CONSTRAINT "IncrementalRun_lineupId_fkey" FOREIGN KEY ("lineupId") REFERENCES "IncrementalLineup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncrementalMapNode" ADD CONSTRAINT "IncrementalMapNode_runId_fkey" FOREIGN KEY ("runId") REFERENCES "IncrementalRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncrementalActionState" ADD CONSTRAINT "IncrementalActionState_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncrementalActionSlot" ADD CONSTRAINT "IncrementalActionSlot_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncrementalRosterHero" ADD CONSTRAINT "IncrementalRosterHero_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncrementalConvertedMatch" ADD CONSTRAINT "IncrementalConvertedMatch_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncrementalHeroTraining" ADD CONSTRAINT "IncrementalHeroTraining_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncrementalTalentNode" ADD CONSTRAINT "IncrementalTalentNode_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncrementalUpgrade" ADD CONSTRAINT "IncrementalUpgrade_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncrementalSaveHeroModification" ADD CONSTRAINT "IncrementalSaveHeroModification_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncrementalSaveQuest" ADD CONSTRAINT "IncrementalSaveQuest_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncrementalActionHistory" ADD CONSTRAINT "IncrementalActionHistory_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

