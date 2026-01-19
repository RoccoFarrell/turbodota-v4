# Safe Migration Reset - No Data Loss

This guide shows how to reset Prisma migrations **without losing any database data**.

## The Problem

When running `prisma migrate dev` without `--create-only`, Prisma may ask to reset the database, which **will delete all data**. We want to avoid this.

## Safe Approach (Recommended)

### If Prisma Still Prompts to Reset (Even with --create-only)

If Prisma is still asking to reset even with `--create-only`, use this alternative approach:

### Option 1: Use `prisma migrate diff` (Safest)

This generates the migration SQL without any database changes:

```bash
# Generate SQL that represents current database state
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_init_baseline/migration.sql

# Create the migration folder structure
mkdir -p prisma/migrations/0_init_baseline

# Then mark it as applied
npx prisma migrate resolve --applied 0_init_baseline
```

### Option 2: Create Baseline Migration Manually

1. **Create the migration folder**:
   ```powershell
   New-Item -ItemType Directory -Path "prisma\migrations\0_init_baseline"
   ```

2. **Create an empty or minimal migration file**:
   ```sql
   -- This migration represents the current state of the database
   -- All tables already exist, this is just for migration history
   ```

3. **Mark it as applied**:
   ```bash
   npx prisma migrate resolve --applied 0_init_baseline
   ```

### Option 3: Use `prisma db push` Instead (Development Only)

If migrations are causing issues, use `db push` for now:

```bash
# This syncs schema without migrations (dev only)
npx prisma db push

# Later, when ready for migrations, you can baseline
```

### Step 1: Create Migration File Only (No Database Changes)

**Try this first** - if it still prompts, use Option 1 above:

```bash
# This creates the migration file but DOES NOT apply it
npx prisma migrate dev --name init_card_battler --create-only
```

**If it still prompts to reset**:
- Press **N** to cancel
- Use Option 1 (migrate diff) instead

**What this does**:
- ✅ Creates migration file in `prisma/migrations/`
- ✅ Does NOT touch your database
- ✅ Does NOT delete any data
- ✅ Safe to run

### Step 2: Review the Migration File

Check the created migration file:
```
prisma/migrations/[timestamp]_init_card_battler/migration.sql
```

Verify it includes all your existing models. If it's missing anything, you can edit it.

### Step 3: Mark Migration as Applied (Since Schema Already Exists)

Since your database already has the schema, tell Prisma the migration is already applied:

```bash
# Replace [timestamp] with the actual timestamp from the folder name
npx prisma migrate resolve --applied [timestamp]_init_card_battler
```

**Example**:
```bash
npx prisma migrate resolve --applied 20240115120000_init_card_battler
```

**What this does**:
- ✅ Marks migration as applied in Prisma's migration history
- ✅ Does NOT run any SQL
- ✅ Does NOT change your database
- ✅ Safe to run

### Step 4: Verify Everything Works

```bash
# Check migration status
npx prisma migrate status

# Should show: "Database schema is up to date!"
```

### Step 5: Test Creating a New Migration

Now test that migrations work by creating a dummy migration:

```bash
# Add a comment to your schema (temporary)
# Then create a test migration
npx prisma migrate dev --name test_migration --create-only

# Review it, then delete it if you want
# Or mark it as applied if it's empty
```

## Alternative: Use `prisma db push` for Development

If you want to avoid migrations entirely for now:

```bash
# This syncs schema to database without migrations
npx prisma db push

# Then later, when ready for migrations:
npx prisma migrate dev --name init
```

**Note**: `db push` is for development only. Use migrations for production.

## What NOT to Do

❌ **Don't run** `prisma migrate dev` without `--create-only` if it asks to reset  
❌ **Don't run** `prisma migrate reset` (this deletes all data)  
❌ **Don't answer "y"** to "All data will be lost" prompts

## If You Already Answered "y" to Reset

If you accidentally reset the database:

1. **Stop the process** if still running (Ctrl+C)
2. **Restore from backup**:
   ```bash
   psql $DATABASE_URL < backup.sql
   # Or if using custom format:
   pg_restore --disable-triggers -d $DATABASE_URL backup.dump
   ```
3. **Then follow the safe approach above**

## Summary

The key is using `--create-only` to create migration files without applying them, then using `migrate resolve --applied` to mark them as applied since your database already has the schema.

This way:
- ✅ No data loss
- ✅ Migration history is created
- ✅ Future migrations will work correctly
- ✅ Safe and reversible
