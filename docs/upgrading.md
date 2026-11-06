# Upgrading an existing installation

Back up PostgreSQL and retain the previous deployment before applying schema changes.

## Database

The initial migration represents the original repository schema (User, AppItem, UserFavorite, and Notification). The next migration creates the shared RateLimit table.

For a fresh database, run:

```sh
npm run db:migrate
```

For a database previously initialized using the original repository's `prisma db push`:

1. Confirm the existing tables match the original schema. Review custom schema changes separately.
2. Mark the original baseline as applied, without creating or replacing its tables:

```sh
node --env-file=.env node_modules/prisma/build/index.js migrate resolve --applied 20261106000000_initial --schema=apps/hub/prisma/schema.prisma
```

3. Apply the additive RateLimit migration:

```sh
npm run db:migrate
```

If the database already contains a RateLimit table from local development, inspect that schema and baseline the additive migration only after confirming it matches. Production rollouts should use committed migrations, not `db push`.

## Accounts and sessions

- Replace the old public JWT secret with a freshly generated key of at least 32 random bytes.
- Set the same key on the Hub and every trusted SSO server.
- Previous JWTs lack the new issuer/audience requirements. Existing users must sign in again.
- Rotate or remove the original seeded demo accounts (`admin@monolith.local` and `user@monolith.local`) if they exist. Their old passwords were public.
- The new seed preserves existing records and never resets user credentials.
- Registration now always creates Members. Administrator provisioning is an explicit local command.

## Applications

All Hub entry points now launch through a server-side role and status check. Configure each registry record's `minRole`, `status`, and destination URL. Maintenance governs navigation from the Hub; separate services must enforce their own policies.

The reworked Admin portal supports editing the entire record. URLs accept HTTP(S) URLs and local paths. Arbitrary schemes, credentials embedded in URLs, malformed slugs, and unknown update fields are rejected.

## Notification senders

The previous anonymous endpoint is closed. Configure per-service credentials in `MONOLITH_SERVICE_TOKENS`, update each sender to use a Bearer credential from its server, and remove direct cross-origin browser POSTs. The Demo now provides a same-origin authenticated forwarding endpoint.

## Verification and rollback

Run `npm run check` and `npm run test:e2e` against a dedicated test database before deploying. The database addition is separate from the original baseline, and the code can be rolled back while retaining the unused RateLimit table. Restore credentials deliberately; do not reinstate the public fallback signing key.
