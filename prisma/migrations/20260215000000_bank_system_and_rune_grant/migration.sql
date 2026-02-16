-- CreateTable: IncrementalBankCurrency
CREATE TABLE "IncrementalBankCurrency" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "currencyKey" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "IncrementalBankCurrency_pkey" PRIMARY KEY ("id")
);

-- CreateTable: IncrementalBankItem
CREATE TABLE "IncrementalBankItem" (
    "id" TEXT NOT NULL,
    "saveId" TEXT NOT NULL,
    "itemDefId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "IncrementalBankItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable: IncrementalRuneGrantedMatch
CREATE TABLE "IncrementalRuneGrantedMatch" (
    "id" SERIAL NOT NULL,
    "matchId" BIGINT NOT NULL,
    "account_id" INTEGER NOT NULL,

    CONSTRAINT "IncrementalRuneGrantedMatch_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "IncrementalBankCurrency_saveId_idx" ON "IncrementalBankCurrency"("saveId");
CREATE UNIQUE INDEX "IncrementalBankCurrency_saveId_currencyKey_key" ON "IncrementalBankCurrency"("saveId", "currencyKey");

CREATE INDEX "IncrementalBankItem_saveId_idx" ON "IncrementalBankItem"("saveId");
CREATE UNIQUE INDEX "IncrementalBankItem_saveId_itemDefId_key" ON "IncrementalBankItem"("saveId", "itemDefId");

CREATE INDEX "IncrementalRuneGrantedMatch_account_id_idx" ON "IncrementalRuneGrantedMatch"("account_id");
CREATE UNIQUE INDEX "IncrementalRuneGrantedMatch_matchId_account_id_key" ON "IncrementalRuneGrantedMatch"("matchId", "account_id");

-- Foreign keys
ALTER TABLE "IncrementalBankCurrency" ADD CONSTRAINT "IncrementalBankCurrency_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IncrementalBankItem" ADD CONSTRAINT "IncrementalBankItem_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES "IncrementalSave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: copy essence from IncrementalSave into IncrementalBankCurrency
INSERT INTO "IncrementalBankCurrency" ("id", "saveId", "currencyKey", "amount")
SELECT gen_random_uuid()::text, "id", 'essence', COALESCE("essence", 0)
FROM "IncrementalSave";

-- Drop essence column from IncrementalSave
ALTER TABLE "IncrementalSave" DROP COLUMN "essence";
