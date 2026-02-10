-- Hero training value: support fractional stats (3 decimal places)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'IncrementalHeroTraining') THEN
    ALTER TABLE "IncrementalHeroTraining" ALTER COLUMN "value" TYPE DOUBLE PRECISION USING "value"::double precision;
  END IF;
END $$;
