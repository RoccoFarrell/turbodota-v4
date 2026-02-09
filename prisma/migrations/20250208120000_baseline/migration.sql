-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

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

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT NOT NULL,
    "account_id" INTEGER NOT NULL,
    "steam_id" BIGINT,
    "profile_url" TEXT,
    "avatar_url" TEXT,
    "roles" TEXT,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPrefs" (
    "id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "UserPrefs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DotaUser" (
    "account_id" INTEGER NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "oldestMatch" TIMESTAMP(3),
    "newestMatch" TIMESTAMP(3),
    "oldestMatchID" BIGINT,
    "newestMatchID" BIGINT,

    CONSTRAINT "DotaUser_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" SERIAL NOT NULL,
    "match_id" BIGINT NOT NULL,
    "account_id" INTEGER NOT NULL,
    "assists" INTEGER NOT NULL,
    "average_rank" INTEGER,
    "deaths" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "game_mode" INTEGER NOT NULL,
    "hero_id" INTEGER NOT NULL,
    "kills" INTEGER NOT NULL,
    "leaver_status" INTEGER,
    "lobby_type" INTEGER,
    "party_size" INTEGER,
    "player_slot" INTEGER NOT NULL,
    "radiant_win" BOOLEAN NOT NULL,
    "skill" INTEGER,
    "start_time" BIGINT NOT NULL,
    "hero_variant" INTEGER,
    "version" INTEGER,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchDetail" (
    "match_id" BIGINT NOT NULL,
    "radiant_win" BOOLEAN NOT NULL,
    "duration" INTEGER NOT NULL,
    "pre_game_duration" INTEGER NOT NULL,
    "start_time" BIGINT NOT NULL,
    "tower_status_radiant" INTEGER NOT NULL,
    "tower_status_dire" INTEGER NOT NULL,
    "barracks_status_radiant" INTEGER NOT NULL,
    "barracks_status_dire" INTEGER NOT NULL,
    "first_blood_time" INTEGER NOT NULL,
    "patch" INTEGER NOT NULL,
    "radiant_score" INTEGER NOT NULL,
    "dire_score" INTEGER NOT NULL,
    "average_rank" INTEGER,

    CONSTRAINT "MatchDetail_pkey" PRIMARY KEY ("match_id")
);

-- CreateTable
CREATE TABLE "PlayersMatchDetail" (
    "id" SERIAL NOT NULL,
    "match_id" BIGINT NOT NULL,
    "account_id" INTEGER NOT NULL,
    "player_slot" INTEGER NOT NULL,
    "hero_id" INTEGER NOT NULL,
    "item_0" INTEGER NOT NULL,
    "item_1" INTEGER NOT NULL,
    "item_2" INTEGER NOT NULL,
    "item_3" INTEGER NOT NULL,
    "item_4" INTEGER NOT NULL,
    "item_5" INTEGER NOT NULL,
    "backpack_0" INTEGER NOT NULL,
    "backpack_1" INTEGER NOT NULL,
    "backpack_2" INTEGER NOT NULL,
    "item_neutral" INTEGER NOT NULL,
    "kills" INTEGER NOT NULL,
    "deaths" INTEGER NOT NULL,
    "assists" INTEGER NOT NULL,
    "last_hits" INTEGER NOT NULL,
    "denies" INTEGER NOT NULL,
    "gold_per_min" INTEGER NOT NULL,
    "xp_per_min" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "net_worth" INTEGER NOT NULL,
    "aghanims_scepter" INTEGER NOT NULL,
    "aghanims_shard" INTEGER NOT NULL,
    "moonshard" INTEGER NOT NULL,
    "hero_damage" INTEGER,
    "tower_damage" INTEGER,
    "hero_healing" INTEGER,
    "gold" INTEGER,
    "gold_spent" INTEGER,
    "win" BOOLEAN NOT NULL,
    "lose" BOOLEAN NOT NULL,
    "total_gold" INTEGER NOT NULL,
    "total_xp" INTEGER NOT NULL,
    "kda" DOUBLE PRECISION NOT NULL,
    "benchmarks" TEXT NOT NULL,

    CONSTRAINT "PlayersMatchDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "League" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorID" INTEGER NOT NULL,

    CONSTRAINT "League_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "creatorID" INTEGER NOT NULL,
    "leagueID" INTEGER NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonResult" (
    "id" SERIAL NOT NULL,
    "seasonID" INTEGER NOT NULL,
    "account_id" INTEGER NOT NULL,
    "place" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "SeasonResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Random" (
    "id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "win" BOOLEAN,
    "endDate" TIMESTAMP(3),
    "endMatchID" INTEGER,
    "endGold" INTEGER,
    "availableHeroes" TEXT NOT NULL,
    "bannedHeroes" TEXT,
    "selectedRoles" TEXT,
    "expectedGold" INTEGER NOT NULL,
    "modifierAmount" INTEGER NOT NULL,
    "modifierTotal" INTEGER NOT NULL,
    "randomedHero" INTEGER NOT NULL,

    CONSTRAINT "Random_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "active_expires" BIGINT NOT NULL,
    "idle_expires" BIGINT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Key" (
    "id" TEXT NOT NULL,
    "hashed_password" TEXT,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "Key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hero" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "localized_name" TEXT NOT NULL,
    "primary_attr" TEXT NOT NULL,
    "attack_type" TEXT NOT NULL,
    "roles" TEXT NOT NULL,
    "legs" INTEGER,

    CONSTRAINT "Hero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FriendshipMMR" (
    "id" SERIAL NOT NULL,
    "match_id" BIGINT NOT NULL,
    "account_id" INTEGER NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "win" BOOLEAN NOT NULL,
    "mmrModifier" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "FriendshipMMR_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "IncrementalLineup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
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
    "gold" INTEGER NOT NULL DEFAULT 0,
    "heroHp" JSONB,
    "xpByHeroId" JSONB,
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
CREATE TABLE "_DotaUserToLeague" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DotaUserToLeague_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DotaUserToSeason" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DotaUserToSeason_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_RandomToSeason" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_RandomToSeason_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_account_id_key" ON "User"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_steam_id_key" ON "User"("steam_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserPrefs_account_id_name_key" ON "UserPrefs"("account_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "DotaUser_account_id_key" ON "DotaUser"("account_id");

-- CreateIndex
CREATE INDEX "DotaUser_account_id_idx" ON "DotaUser"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "Match_match_id_account_id_key" ON "Match"("match_id", "account_id");

-- CreateIndex
CREATE UNIQUE INDEX "MatchDetail_match_id_key" ON "MatchDetail"("match_id");

-- CreateIndex
CREATE UNIQUE INDEX "PlayersMatchDetail_match_id_account_id_key" ON "PlayersMatchDetail"("match_id", "account_id");

-- CreateIndex
CREATE UNIQUE INDEX "Turbotown_account_id_seasonID_key" ON "Turbotown"("account_id", "seasonID");

-- CreateIndex
CREATE UNIQUE INDEX "TurbotownMetric_turbotownID_label_key" ON "TurbotownMetric"("turbotownID", "label");

-- CreateIndex
CREATE UNIQUE INDEX "Session_id_key" ON "Session"("id");

-- CreateIndex
CREATE INDEX "Session_user_id_idx" ON "Session"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Key_id_key" ON "Key"("id");

-- CreateIndex
CREATE INDEX "Key_user_id_idx" ON "Key"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Hero_id_key" ON "Hero"("id");

-- CreateIndex
CREATE UNIQUE INDEX "FriendshipMMR_match_id_account_id_key" ON "FriendshipMMR"("match_id", "account_id");

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
CREATE INDEX "IncrementalLineup_userId_idx" ON "IncrementalLineup"("userId");

-- CreateIndex
CREATE INDEX "IncrementalRun_userId_idx" ON "IncrementalRun"("userId");

-- CreateIndex
CREATE INDEX "IncrementalRun_lineupId_idx" ON "IncrementalRun"("lineupId");

-- CreateIndex
CREATE INDEX "IncrementalMapNode_runId_idx" ON "IncrementalMapNode"("runId");

-- CreateIndex
CREATE INDEX "_DotaUserToLeague_B_index" ON "_DotaUserToLeague"("B");

-- CreateIndex
CREATE INDEX "_DotaUserToSeason_B_index" ON "_DotaUserToSeason"("B");

-- CreateIndex
CREATE INDEX "_RandomToSeason_B_index" ON "_RandomToSeason"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "DotaUser"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPrefs" ADD CONSTRAINT "UserPrefs_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "User"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayersMatchDetail" ADD CONSTRAINT "PlayersMatchDetail_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "MatchDetail"("match_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "League" ADD CONSTRAINT "League_creatorID_fkey" FOREIGN KEY ("creatorID") REFERENCES "User"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_leagueID_fkey" FOREIGN KEY ("leagueID") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonResult" ADD CONSTRAINT "SeasonResult_seasonID_fkey" FOREIGN KEY ("seasonID") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Random" ADD CONSTRAINT "Random_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "User"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Random" ADD CONSTRAINT "Random_endMatchID_fkey" FOREIGN KEY ("endMatchID") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "Session" ADD CONSTRAINT "Session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Key" ADD CONSTRAINT "Key_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendshipMMR" ADD CONSTRAINT "FriendshipMMR_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "MatchDetail"("match_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendshipMMR" ADD CONSTRAINT "FriendshipMMR_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "DotaUser"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "IncrementalLineup" ADD CONSTRAINT "IncrementalLineup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncrementalRun" ADD CONSTRAINT "IncrementalRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncrementalRun" ADD CONSTRAINT "IncrementalRun_lineupId_fkey" FOREIGN KEY ("lineupId") REFERENCES "IncrementalLineup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncrementalMapNode" ADD CONSTRAINT "IncrementalMapNode_runId_fkey" FOREIGN KEY ("runId") REFERENCES "IncrementalRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DotaUserToLeague" ADD CONSTRAINT "_DotaUserToLeague_A_fkey" FOREIGN KEY ("A") REFERENCES "DotaUser"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DotaUserToLeague" ADD CONSTRAINT "_DotaUserToLeague_B_fkey" FOREIGN KEY ("B") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DotaUserToSeason" ADD CONSTRAINT "_DotaUserToSeason_A_fkey" FOREIGN KEY ("A") REFERENCES "DotaUser"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DotaUserToSeason" ADD CONSTRAINT "_DotaUserToSeason_B_fkey" FOREIGN KEY ("B") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RandomToSeason" ADD CONSTRAINT "_RandomToSeason_A_fkey" FOREIGN KEY ("A") REFERENCES "Random"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RandomToSeason" ADD CONSTRAINT "_RandomToSeason_B_fkey" FOREIGN KEY ("B") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;
