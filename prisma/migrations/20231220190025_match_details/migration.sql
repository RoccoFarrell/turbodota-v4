/*
  Warnings:

  - The primary key for the `Match` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `account_id` on the `Match` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `account_id` on the `User` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to drop the `Article` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[match_id,account_id]` on the table `Match` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[steam_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `avatar_url` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profile_url` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Article" DROP CONSTRAINT "Article_userId_fkey";

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_account_id_fkey";

-- DropIndex
DROP INDEX "Match_match_id_key";

-- AlterTable
ALTER TABLE "Match" DROP CONSTRAINT "Match_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "account_id" SET DATA TYPE INTEGER,
ALTER COLUMN "average_rank" DROP NOT NULL,
ADD CONSTRAINT "Match_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar_url" TEXT NOT NULL,
ADD COLUMN     "profile_url" TEXT NOT NULL,
ADD COLUMN     "roles" TEXT,
ADD COLUMN     "steam_id" BIGINT,
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "account_id" SET DATA TYPE INTEGER;

-- DropTable
DROP TABLE "Article";

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
    "average_rank" INTEGER NOT NULL,

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
    "hero_damage" INTEGER NOT NULL,
    "tower_damage" INTEGER NOT NULL,
    "hero_healing" INTEGER NOT NULL,
    "gold" INTEGER NOT NULL,
    "gold_spent" INTEGER NOT NULL,
    "win" BOOLEAN NOT NULL,
    "lose" BOOLEAN NOT NULL,
    "total_gold" INTEGER NOT NULL,
    "total_xp" INTEGER NOT NULL,
    "kda" DOUBLE PRECISION NOT NULL,
    "benchmarks" TEXT NOT NULL,

    CONSTRAINT "PlayersMatchDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DotaUser" (
    "account_id" INTEGER NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "oldestMatch" TIMESTAMP(3),
    "newestMatch" TIMESTAMP(3),

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
    "legs" INTEGER NOT NULL,

    CONSTRAINT "Hero_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "UserPrefs_account_id_name_key" ON "UserPrefs"("account_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Match_match_id_account_id_key" ON "Match"("match_id", "account_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_steam_id_key" ON "User"("steam_id");

-- AddForeignKey
ALTER TABLE "PlayersMatchDetail" ADD CONSTRAINT "PlayersMatchDetail_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "MatchDetail"("match_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayersMatchDetail" ADD CONSTRAINT "PlayersMatchDetail_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "User"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DotaUser" ADD CONSTRAINT "DotaUser_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "User"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPrefs" ADD CONSTRAINT "UserPrefs_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "User"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Random" ADD CONSTRAINT "Random_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "User"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Random" ADD CONSTRAINT "Random_endMatchID_fkey" FOREIGN KEY ("endMatchID") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
