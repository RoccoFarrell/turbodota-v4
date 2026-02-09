# Start migration history from scratch (without clearing production DB)

Follow these steps **in order**. No data is dropped.

## 1. Generate the baseline migration SQL (local)

From the project root, run **one** of these (Prisma 7 may use `--to-schema`):

```bash
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script --output prisma/migrations/20250208120000_baseline/migration.sql
```

If that fails, try:

```bash
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/20250208120000_baseline/migration.sql
```

That writes the full “create everything from empty” SQL into the baseline migration file.

## 2. Clear migration history in production (SQL only)

Connect to your **production** database and run:

```sql
TRUNCATE TABLE "_prisma_migrations";
```

(Only the migration table is cleared; all app data stays.)

## 3. Mark the baseline as applied (no SQL run on DB)

With `DATABASE_URL` pointing at **production**:

```bash
npx prisma migrate resolve --applied 20250208120000_baseline
```

This only inserts a row in `_prisma_migrations`. It does **not** run the migration SQL, so the existing production schema is left as-is.

## Result

- Migration history is “from scratch” with a single baseline migration.
- Production DB is unchanged (no reset, no data loss).
- Future changes: add migrations with `npx prisma migrate dev` and deploy with `npx prisma migrate deploy`.
