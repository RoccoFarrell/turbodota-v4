-- Rename the "value" column to "totalPoints" in IncrementalHeroTraining.
-- This preserves all existing data (raw training XP points).
-- The effective stat bonus is now computed at read-time via pointsToEffectiveStat().
ALTER TABLE "IncrementalHeroTraining" RENAME COLUMN "value" TO "totalPoints";
