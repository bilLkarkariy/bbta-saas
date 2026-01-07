# Database Migrations Guide

This document covers database migration procedures for Lumelia SaaS.

## Overview

We use Prisma Migrate for database schema management. All schema changes should be made through migrations.

## Development Workflow

### Creating a Migration

1. Modify `prisma/schema.prisma`
2. Create migration:
   ```bash
   npx prisma migrate dev --name descriptive_name
   ```
3. Review generated SQL in `prisma/migrations/`
4. Test migration locally
5. Commit migration files

### Migration Naming Convention

Use descriptive, snake_case names:
- `add_analytics_daily_model`
- `add_user_role_field`
- `update_conversation_assignment`

## Production Deployment

### Automatic (Vercel)

Migrations run automatically during build:
```bash
prisma generate && next build
```

For production deploy, add to build:
```bash
prisma migrate deploy && prisma generate && next build
```

### Manual

```bash
# Deploy all pending migrations
npx prisma migrate deploy
```

## Migration Checklist

Before deploying a migration:

- [ ] Migration tested locally with seed data
- [ ] Rollback procedure documented (if complex)
- [ ] Breaking changes documented
- [ ] Performance impact assessed (for large tables)
- [ ] Backfill script prepared (if adding NOT NULL column)

## Rollback Procedures

### Simple Rollback

For additive changes (new tables, columns), you can:
1. Deploy a new migration that undoes the change
2. Or manually run SQL to revert

### Complex Rollback

For destructive changes, prepare rollback SQL beforehand:

```sql
-- Example: Rollback add_user_role migration
ALTER TABLE "User" DROP COLUMN "role";
DROP TYPE "UserRole";
```

Store rollback scripts in `prisma/rollbacks/` directory.

## Common Scenarios

### Adding a New Model

```prisma
model NewModel {
  id        String   @id @default(cuid())
  tenantId  String
  // fields...
  
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@index([tenantId])
}
```

Migration: Safe, no data migration needed.

### Adding a Column with Default

```prisma
model User {
  // existing fields...
  newField String @default("default_value")
}
```

Migration: Safe, existing rows get default value.

### Adding a NOT NULL Column

Requires backfill:

1. Add column as nullable:
   ```prisma
   newField String?
   ```

2. Deploy migration

3. Backfill data:
   ```sql
   UPDATE "User" SET "newField" = 'value' WHERE "newField" IS NULL;
   ```

4. Change to NOT NULL:
   ```prisma
   newField String
   ```

5. Deploy second migration

### Renaming a Column

Prisma treats this as drop + add. Use `@map` instead:

```prisma
model User {
  displayName String @map("old_column_name")
}
```

### Dropping a Column

1. Remove all code references first
2. Deploy code change
3. Create migration to drop column
4. Deploy migration

### Adding an Index

```prisma
model Conversation {
  @@index([tenantId, status])
}
```

Migration: Safe, but may lock table briefly on large datasets.
Consider using `CREATE INDEX CONCURRENTLY` manually for production.

## Preview Environments

For preview deployments, consider:

1. **Separate Database**: Each preview uses its own database
   - Pro: Complete isolation
   - Con: More databases to manage

2. **Shared Database**: Previews share a staging database
   - Pro: Simpler management
   - Con: Migrations can conflict

3. **Database Branching** (Neon): Branch from production
   - Pro: Real data, isolated changes
   - Con: Vendor-specific

## Troubleshooting

### Migration Failed Mid-way

1. Check migration status:
   ```bash
   npx prisma migrate status
   ```

2. If partially applied, manually fix:
   ```bash
   npx prisma migrate resolve --applied "migration_name"
   # or
   npx prisma migrate resolve --rolled-back "migration_name"
   ```

### Schema Drift

If production schema doesn't match migrations:

1. Generate current schema:
   ```bash
   npx prisma db pull
   ```

2. Compare with `schema.prisma`

3. Create baseline or fix manually

### Shadow Database Issues

For development, Prisma needs a shadow database. If issues:
```bash
# Use direct URL for migrations
npx prisma migrate dev --skip-seed
```

## Emergency Procedures

### Hotfix Without Migration

For urgent production fixes that can't wait for migration:

1. Apply SQL directly to production
2. Update `schema.prisma` to match
3. Create migration with `--create-only`:
   ```bash
   npx prisma migrate dev --create-only --name hotfix_description
   ```
4. Mark as applied:
   ```bash
   npx prisma migrate resolve --applied "hotfix_description"
   ```

### Database Restore

If migration causes data loss:

1. Stop application
2. Restore from backup
3. Mark failed migration as rolled back
4. Fix migration
5. Redeploy

## Best Practices

1. **Small Migrations**: One logical change per migration
2. **Test Locally**: Always test with representative data
3. **Backup First**: For production, always backup before migrate
4. **Off-Peak**: Run large migrations during low-traffic periods
5. **Monitor**: Watch for locks and slow queries during migration
