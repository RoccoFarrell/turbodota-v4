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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncrementalHeroBaseStat_pkey" PRIMARY KEY ("heroId")
);

-- CreateTable
CREATE TABLE "IncrementalHeroAbility" (
    "id" TEXT NOT NULL,
    "abilityName" TEXT NOT NULL,
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

-- CreateIndex
CREATE INDEX "IncrementalHeroBaseStat_heroId_idx" ON "IncrementalHeroBaseStat"("heroId");

-- CreateIndex
CREATE INDEX "IncrementalHeroAbility_id_idx" ON "IncrementalHeroAbility"("id");
