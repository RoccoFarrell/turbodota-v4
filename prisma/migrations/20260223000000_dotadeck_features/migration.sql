-- Idempotent migration: only applies changes missing from production.
-- Production already has enums, DotaDeck tables, Turbotown tables, etc.
-- This migration adds: User columns (email, google_id), UserSession,
-- all Incremental* tables, and drops legacy Key/Session tables.

-- =============================================
-- 1. ALTER USER TABLE (add new auth columns)
-- =============================================
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "google_id" TEXT;
ALTER TABLE "User" ALTER COLUMN "account_id" DROP NOT NULL;

-- Unique indexes on new columns
CREATE UNIQUE INDEX IF NOT EXISTS "User_google_id_key" ON "User"("google_id");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- Change FK from RESTRICT to SET NULL
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_account_id_fkey";
ALTER TABLE "User" ADD CONSTRAINT "User_account_id_fkey"
  FOREIGN KEY ("account_id") REFERENCES "DotaUser"("account_id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================
-- 2. DROP LEGACY AUTH TABLES (Key, Session)
-- =============================================
ALTER TABLE "Key" DROP CONSTRAINT IF EXISTS "Key_user_id_fkey";
ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_user_id_fkey";
DROP TABLE IF EXISTS "Key";
DROP TABLE IF EXISTS "Session";

-- =============================================
-- 3. CREATE UserSession TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserSession_id_key" ON "UserSession"("id");
CREATE INDEX IF NOT EXISTS "UserSession_userId_idx" ON "UserSession"("userId");
ALTER TABLE "UserSession" DROP CONSTRAINT IF EXISTS "UserSession_userId_fkey";
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================
-- 4. CREATE INCREMENTAL TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS "IncrementalSave" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "account_id" INTEGER,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IncrementalSave_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "IncrementalSave_userId_idx" ON "IncrementalSave"("userId");

CREATE TABLE IF NOT EXISTS "IncrementalBankCurrency" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "currencyKey" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "IncrementalBankCurrency_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "IncrementalBankCurrency_saveId_idx" ON "IncrementalBankCurrency"("saveId");
CREATE UNIQUE INDEX IF NOT EXISTS "IncrementalBankCurrency_saveId_currencyKey_key" ON "IncrementalBankCurrency"("saveId", "currencyKey");

CREATE TABLE IF NOT EXISTS "IncrementalBankItem" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "itemDefId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "IncrementalBankItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "IncrementalBankItem_saveId_idx" ON "IncrementalBankItem"("saveId");
CREATE UNIQUE INDEX IF NOT EXISTS "IncrementalBankItem_saveId_itemDefId_key" ON "IncrementalBankItem"("saveId", "itemDefId");

CREATE TABLE IF NOT EXISTS "IncrementalRuneGrantedMatch" (
    "id" SERIAL NOT NULL,
    "matchId" BIGINT NOT NULL,
    "account_id" INTEGER NOT NULL,
    CONSTRAINT "IncrementalRuneGrantedMatch_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "IncrementalRuneGrantedMatch_account_id_idx" ON "IncrementalRuneGrantedMatch"("account_id");
CREATE UNIQUE INDEX IF NOT EXISTS "IncrementalRuneGrantedMatch_matchId_account_id_key" ON "IncrementalRuneGrantedMatch"("matchId", "account_id");

CREATE TABLE IF NOT EXISTS "IncrementalActionState" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastTickAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionHeroId" INTEGER,
    "actionStatKey" TEXT,
    CONSTRAINT "IncrementalActionState_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "IncrementalActionState_saveId_key" ON "IncrementalActionState"("saveId");
CREATE INDEX IF NOT EXISTS "IncrementalActionState_saveId_idx" ON "IncrementalActionState"("saveId");

CREATE TABLE IF NOT EXISTS "IncrementalActionSlot" (
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
CREATE INDEX IF NOT EXISTS "IncrementalActionSlot_saveId_idx" ON "IncrementalActionSlot"("saveId");
CREATE UNIQUE INDEX IF NOT EXISTS "IncrementalActionSlot_saveId_slotIndex_key" ON "IncrementalActionSlot"("saveId", "slotIndex");

CREATE TABLE IF NOT EXISTS "IncrementalRosterHero" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "heroId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IncrementalRosterHero_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "IncrementalRosterHero_saveId_idx" ON "IncrementalRosterHero"("saveId");
CREATE UNIQUE INDEX IF NOT EXISTS "IncrementalRosterHero_saveId_heroId_key" ON "IncrementalRosterHero"("saveId", "heroId");

CREATE TABLE IF NOT EXISTS "IncrementalConvertedMatch" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "matchId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IncrementalConvertedMatch_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "IncrementalConvertedMatch_saveId_idx" ON "IncrementalConvertedMatch"("saveId");
CREATE UNIQUE INDEX IF NOT EXISTS "IncrementalConvertedMatch_saveId_matchId_key" ON "IncrementalConvertedMatch"("saveId", "matchId");

CREATE TABLE IF NOT EXISTS "IncrementalHeroTraining" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "heroId" INTEGER NOT NULL,
    "statKey" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IncrementalHeroTraining_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "IncrementalHeroTraining_saveId_idx" ON "IncrementalHeroTraining"("saveId");
CREATE INDEX IF NOT EXISTS "IncrementalHeroTraining_saveId_heroId_idx" ON "IncrementalHeroTraining"("saveId", "heroId");
CREATE UNIQUE INDEX IF NOT EXISTS "IncrementalHeroTraining_saveId_heroId_statKey_key" ON "IncrementalHeroTraining"("saveId", "heroId", "statKey");

CREATE TABLE IF NOT EXISTS "IncrementalTalentNode" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IncrementalTalentNode_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "IncrementalTalentNode_saveId_idx" ON "IncrementalTalentNode"("saveId");
CREATE UNIQUE INDEX IF NOT EXISTS "IncrementalTalentNode_saveId_nodeId_key" ON "IncrementalTalentNode"("saveId", "nodeId");

CREATE TABLE IF NOT EXISTS "IncrementalUpgrade" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "upgradeType" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IncrementalUpgrade_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "IncrementalUpgrade_saveId_idx" ON "IncrementalUpgrade"("saveId");
CREATE UNIQUE INDEX IF NOT EXISTS "IncrementalUpgrade_saveId_upgradeType_key" ON "IncrementalUpgrade"("saveId", "upgradeType");

CREATE TABLE IF NOT EXISTS "IncrementalHeroBaseStat" (
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
CREATE UNIQUE INDEX IF NOT EXISTS "IncrementalHeroBaseStat_heroId_key" ON "IncrementalHeroBaseStat"("heroId");
CREATE INDEX IF NOT EXISTS "IncrementalHeroBaseStat_heroId_idx" ON "IncrementalHeroBaseStat"("heroId");

CREATE TABLE IF NOT EXISTS "IncrementalHeroAbility" (
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
CREATE INDEX IF NOT EXISTS "IncrementalHeroAbility_id_idx" ON "IncrementalHeroAbility"("id");

CREATE TABLE IF NOT EXISTS "IncrementalSaveHeroModification" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "heroId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "valueJson" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IncrementalSaveHeroModification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "IncrementalSaveHeroModification_saveId_idx" ON "IncrementalSaveHeroModification"("saveId");
CREATE INDEX IF NOT EXISTS "IncrementalSaveHeroModification_saveId_heroId_idx" ON "IncrementalSaveHeroModification"("saveId", "heroId");
CREATE UNIQUE INDEX IF NOT EXISTS "IncrementalSaveHeroModification_saveId_heroId_kind_key_key" ON "IncrementalSaveHeroModification"("saveId", "heroId", "kind", "key");

CREATE TABLE IF NOT EXISTS "IncrementalSaveQuest" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'recurring',
    "startedAt" TIMESTAMP(3) NOT NULL,
    "claimCount" INTEGER NOT NULL DEFAULT 0,
    "claimedAt" TIMESTAMP(3),
    CONSTRAINT "IncrementalSaveQuest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "IncrementalSaveQuest_saveId_idx" ON "IncrementalSaveQuest"("saveId");
CREATE INDEX IF NOT EXISTS "IncrementalSaveQuest_saveId_type_idx" ON "IncrementalSaveQuest"("saveId", "type");
CREATE UNIQUE INDEX IF NOT EXISTS "IncrementalSaveQuest_saveId_questId_key" ON "IncrementalSaveQuest"("saveId", "questId");

CREATE TABLE IF NOT EXISTS "IncrementalActionHistory" (
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
CREATE INDEX IF NOT EXISTS "IncrementalActionHistory_saveId_endedAt_idx" ON "IncrementalActionHistory"("saveId", "endedAt");
CREATE INDEX IF NOT EXISTS "IncrementalActionHistory_saveId_actionType_actionHeroId_act_idx" ON "IncrementalActionHistory"("saveId", "actionType", "actionHeroId", "actionStatKey");

-- =============================================
-- 5. ALTER EXISTING INCREMENTAL TABLES (old schema -> new schema)
-- =============================================

-- IncrementalLineup: rename userId -> saveId, change FK from User to IncrementalSave
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'IncrementalLineup' AND column_name = 'userId'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'IncrementalLineup' AND column_name = 'saveId'
  ) THEN
    ALTER TABLE "IncrementalLineup" DROP CONSTRAINT IF EXISTS "IncrementalLineup_userId_fkey";
    DROP INDEX IF EXISTS "IncrementalLineup_userId_idx";
    ALTER TABLE "IncrementalLineup" RENAME COLUMN "userId" TO "saveId";
    CREATE INDEX "IncrementalLineup_saveId_idx" ON "IncrementalLineup"("saveId");
  END IF;
END $$;

-- IncrementalRun: add missing columns
ALTER TABLE "IncrementalRun" ADD COLUMN IF NOT EXISTS "level" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "IncrementalRun" ADD COLUMN IF NOT EXISTS "nodeClearances" JSONB;

-- =============================================
-- 6. FOREIGN KEYS FOR INCREMENTAL TABLES
-- =============================================
-- Use DO blocks to skip if FK already exists

DO $$ BEGIN
  ALTER TABLE "IncrementalSave" ADD CONSTRAINT "IncrementalSave_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "IncrementalBankCurrency" ADD CONSTRAINT "IncrementalBankCurrency_saveId_fkey"
    FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "IncrementalBankItem" ADD CONSTRAINT "IncrementalBankItem_saveId_fkey"
    FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- IncrementalLineup: drop old FK (to User) if it exists, add new one (to IncrementalSave)
ALTER TABLE "IncrementalLineup" DROP CONSTRAINT IF EXISTS "IncrementalLineup_userId_fkey";
DO $$ BEGIN
  ALTER TABLE "IncrementalLineup" ADD CONSTRAINT "IncrementalLineup_saveId_fkey"
    FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- These FKs already exist on production but use DO blocks for safety
DO $$ BEGIN
  ALTER TABLE "IncrementalRun" ADD CONSTRAINT "IncrementalRun_lineupId_fkey"
    FOREIGN KEY ("lineupId") REFERENCES "IncrementalLineup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "IncrementalMapNode" ADD CONSTRAINT "IncrementalMapNode_runId_fkey"
    FOREIGN KEY ("runId") REFERENCES "IncrementalRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "IncrementalActionState" ADD CONSTRAINT "IncrementalActionState_saveId_fkey"
    FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "IncrementalActionSlot" ADD CONSTRAINT "IncrementalActionSlot_saveId_fkey"
    FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "IncrementalRosterHero" ADD CONSTRAINT "IncrementalRosterHero_saveId_fkey"
    FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "IncrementalConvertedMatch" ADD CONSTRAINT "IncrementalConvertedMatch_saveId_fkey"
    FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "IncrementalHeroTraining" ADD CONSTRAINT "IncrementalHeroTraining_saveId_fkey"
    FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "IncrementalTalentNode" ADD CONSTRAINT "IncrementalTalentNode_saveId_fkey"
    FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "IncrementalUpgrade" ADD CONSTRAINT "IncrementalUpgrade_saveId_fkey"
    FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "IncrementalSaveHeroModification" ADD CONSTRAINT "IncrementalSaveHeroModification_saveId_fkey"
    FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "IncrementalSaveQuest" ADD CONSTRAINT "IncrementalSaveQuest_saveId_fkey"
    FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "IncrementalActionHistory" ADD CONSTRAINT "IncrementalActionHistory_saveId_fkey"
    FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
