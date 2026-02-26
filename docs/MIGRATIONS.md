# Database Migrations

This project uses Prisma migrations for schema changes.

## Development workflow

1. Update `prisma/schema.prisma`.
2. Create migration:

```bash
npx prisma migrate dev --name <descriptive_name>
```

3. Review generated SQL in `prisma/migrations`.
4. Test application paths impacted by the schema change.
5. Commit both schema and migration files.

## Production workflow

Apply pending migrations in non-interactive mode:

```bash
npx prisma migrate deploy
```

Recommended order during release:

1. Backup database (provider snapshot or SQL dump)
2. Deploy code
3. Run `prisma migrate deploy`
4. Run smoke tests

## Safe migration patterns

Preferred first:

- Additive table/column changes
- Nullable fields before backfill
- New indexes for known query paths

For breaking changes, use multi-step rollout:

1. Add new nullable structure
2. Backfill data
3. Switch application reads/writes
4. Remove old fields in later migration

## Troubleshooting

Check migration state:

```bash
npx prisma migrate status
```

Resolve migration state only when you fully understand the DB state:

```bash
npx prisma migrate resolve --applied <migration_name>
npx prisma migrate resolve --rolled-back <migration_name>
```

## Notes for this repository

- Keep migration names explicit and readable.
- Test migration effects against tenant-scoped queries.
- Do not run destructive reset commands in production.

