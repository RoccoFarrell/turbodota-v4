# Prisma Migration Reset Guide

This guide explains how to reset the Prisma migration system to begin using proper migrations for the card battler feature.

## Current State

- Prisma schema has been committed directly (no migrations)
- One migration exists: `prisma/migrations/0_init/migration.sql`
- Need to reset and create proper migration structure

## Steps to Reset Migration System

### Option 1: Reset and Create Initial Migration (Recommended)

This approach creates a clean migration history starting from the current schema state.

1. **Backup your database** (if needed):
   ```bash
   # Export current database state
   pg_dump $DATABASE_URL > backup.sql
   
   # If you see warnings about circular foreign-key constraints (this is normal):
   # The backup will still work. If you need to restore, use:
   pg_restore --disable-triggers backup.sql
   # Or use a full dump instead:
   pg_dump --format=custom $DATABASE_URL > backup.dump
   ```
   
   **Note**: The circular foreign-key constraint warning is normal and not critical. 
   Your backup is still valid. The warning just means some tables reference each other 
   in both directions, which is common in database schemas.

2. **Reset migration history**:
   
   **If you get "Access Denied" error on Windows:**
   - Close any editors/IDEs that might have migration files open
   - Close any Prisma processes
   - Try alternative approach below
   
   **Option A: Rename folder (if not locked)**:
   ```powershell
   # PowerShell
   Rename-Item -Path "prisma\migrations" -NewName "migrations_backup"
   New-Item -ItemType Directory -Path "prisma\migrations"
   ```
   
   **Option B: Create new folder (if folder is locked)**:
   ```powershell
   # Just create a new migrations folder - Prisma will use the new one
   New-Item -ItemType Directory -Path "prisma\migrations_new"
   # Then manually update Prisma to use migrations_new, or
   # After creating first migration, Prisma will use the new structure
   ```
   
   **Option C: Workaround - Keep old, create new**:
   ```powershell
   # Create new migrations folder
   New-Item -ItemType Directory -Path "prisma\migrations"
   # Old migrations in 0_init will be ignored once you create new migrations
   ```

3. **Create baseline migration from current schema** (SAFE - won't reset database):
   ```bash
   # Create migration file WITHOUT applying it (--create-only)
   npx prisma migrate dev --name init_card_battler --create-only
   ```
   
   **IMPORTANT**: Use `--create-only` flag to avoid resetting your database!
   This creates the migration file but doesn't apply it.

4. **Review the migration**:
   - Check `prisma/migrations/[timestamp]_init_card_battler/migration.sql`
   - Ensure it includes all existing models
   - Add card battler models to schema first if not already there

5. **Mark migration as applied** (since database already has the schema):
   ```bash
   # Get the migration name from the folder that was created
   # It will be something like: 20240115120000_init_card_battler
   npx prisma migrate resolve --applied [timestamp]_init_card_battler
   ```
   
   This tells Prisma "this migration is already applied" without touching your data.

6. **Verify migration status**:
   ```bash
   npx prisma migrate status
   ```
   
   Should show all migrations as applied.

### Option 2: Keep Existing Migration, Add Card Battler

This approach keeps existing migrations and adds card battler models incrementally.

1. **Add card battler models to schema**:
   - Add all BattlerCard models to `prisma/schema.prisma`
   - See [../planning/PLANNING.md](../planning/PLANNING.md) for schema definitions

2. **Create migration for card battler**:
   ```bash
   npx prisma migrate dev --name add_card_battler_models
   ```

3. **Review and apply**:
   - Review the generated migration
   - Apply: `npx prisma migrate dev`

## Recommended Approach for Card Battler

Since we're adding a new feature, we recommend **Option 2**:

1. Keep existing migrations intact
2. Add card battler models to schema
3. Create a new migration: `add_card_battler_models`
4. This maintains history and is safer

## Migration Workflow Going Forward

After reset, follow this workflow:

1. **Make schema changes** in `prisma/schema.prisma`
2. **Create migration**:
   ```bash
   npx prisma migrate dev --name descriptive_name
   ```
3. **Review migration** before applying
4. **Test migration** on development database first
5. **Apply to production** after testing

## Test Database Setup

For testing, you'll need a separate test database:

1. **Create test database** (if using Supabase locally):
   ```bash
   # In Supabase, create a test database
   # Or use a separate PostgreSQL instance
   ```

2. **Set TEST_DATABASE_URL** in `.env`:
   ```env
   TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres_test"
   ```

3. **Run migrations on test database**:
   ```bash
   DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy
   ```

## Verification

After reset, verify:

1. ✅ Migration folder structure is clean
2. ✅ Schema matches database state
3. ✅ Can create new migrations
4. ✅ Test database works correctly
5. ✅ All existing models still work

## Common Warnings/Issues

### Circular Foreign Key Constraints Warning

If you see this warning during backup:
```
pg_dump: warning: there are circular foreign-key constraints on this table
```

**This is normal and not critical!** It just means some tables have bidirectional 
foreign key relationships. Your backup is still valid. 

**If you need to restore**:
- Use `pg_restore --disable-triggers` for data-only restores
- Or use `pg_dump --format=custom` for a full dump that handles this automatically
- Prisma migrations handle this automatically, so you won't encounter this during normal migration operations

## Notes

- **Never delete migrations** that have been applied to production
- **Always test migrations** on development first
- **Backup before major changes**
- **Use descriptive migration names**

## Next Steps

After resetting migrations:

1. Add card battler models to schema
2. Create initial card battler migration
3. Set up test database
4. Begin Phase 1 development
