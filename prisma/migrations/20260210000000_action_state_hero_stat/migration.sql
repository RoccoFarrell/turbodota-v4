-- Phase 13: training action – which hero and stat
ALTER TABLE "IncrementalActionState" ADD COLUMN "actionHeroId" INTEGER;
ALTER TABLE "IncrementalActionState" ADD COLUMN "actionStatKey" TEXT;
