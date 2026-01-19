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
    "leaver_status" INTEGER NOT NULL,
    "lobby_type" INTEGER NOT NULL,
    "party_size" INTEGER,
    "player_slot" INTEGER NOT NULL,
    "radiant_win" BOOLEAN NOT NULL,
    "skill" INTEGER,
    "start_time" BIGINT NOT NULL,
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
CREATE TABLE "DotaUser" (
    "account_id" INTEGER NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "oldestMatch" TIMESTAMP(3),
    "newestMatch" TIMESTAMP(3),
    "oldestMatchID" BIGINT,
    "newestMatchID" BIGINT,

    CONSTRAINT "DotaUser_pkey" PRIMARY KEY ("account_id")
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
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT NOT NULL,
    "account_id" INTEGER NOT NULL,
    "steam_id" BIGINT,
    "profile_url" TEXT NOT NULL,
    "avatar_url" TEXT NOT NULL,
    "roles" TEXT,
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
CREATE TABLE "_DotaUserToLeague" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_DotaUserToSeason" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_RandomToSeason" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Match_match_id_account_id_key" ON "Match"("match_id", "account_id");

-- CreateIndex
CREATE UNIQUE INDEX "MatchDetail_match_id_key" ON "MatchDetail"("match_id");

-- CreateIndex
CREATE UNIQUE INDEX "PlayersMatchDetail_match_id_account_id_key" ON "PlayersMatchDetail"("match_id", "account_id");

-- CreateIndex
CREATE UNIQUE INDEX "DotaUser_account_id_key" ON "DotaUser"("account_id");

-- CreateIndex
CREATE INDEX "DotaUser_account_id_idx" ON "DotaUser"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "Hero_id_key" ON "Hero"("id");

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
CREATE UNIQUE INDEX "Session_id_key" ON "Session"("id");

-- CreateIndex
CREATE INDEX "Session_user_id_idx" ON "Session"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Key_id_key" ON "Key"("id");

-- CreateIndex
CREATE INDEX "Key_user_id_idx" ON "Key"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "FriendshipMMR_match_id_account_id_key" ON "FriendshipMMR"("match_id", "account_id");

-- CreateIndex
CREATE UNIQUE INDEX "_DotaUserToLeague_AB_unique" ON "_DotaUserToLeague"("A", "B");

-- CreateIndex
CREATE INDEX "_DotaUserToLeague_B_index" ON "_DotaUserToLeague"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_DotaUserToSeason_AB_unique" ON "_DotaUserToSeason"("A", "B");

-- CreateIndex
CREATE INDEX "_DotaUserToSeason_B_index" ON "_DotaUserToSeason"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_RandomToSeason_AB_unique" ON "_RandomToSeason"("A", "B");

-- CreateIndex
CREATE INDEX "_RandomToSeason_B_index" ON "_RandomToSeason"("B");

-- AddForeignKey
ALTER TABLE "PlayersMatchDetail" ADD CONSTRAINT "PlayersMatchDetail_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "MatchDetail"("match_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "League" ADD CONSTRAINT "League_creatorID_fkey" FOREIGN KEY ("creatorID") REFERENCES "User"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_leagueID_fkey" FOREIGN KEY ("leagueID") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonResult" ADD CONSTRAINT "SeasonResult_seasonID_fkey" FOREIGN KEY ("seasonID") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "DotaUser"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPrefs" ADD CONSTRAINT "UserPrefs_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "User"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Random" ADD CONSTRAINT "Random_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "User"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Random" ADD CONSTRAINT "Random_endMatchID_fkey" FOREIGN KEY ("endMatchID") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Key" ADD CONSTRAINT "Key_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendshipMMR" ADD CONSTRAINT "FriendshipMMR_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "MatchDetail"("match_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendshipMMR" ADD CONSTRAINT "FriendshipMMR_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "DotaUser"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

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

