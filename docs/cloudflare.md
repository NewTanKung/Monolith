# Deploy Monolith Hub to Cloudflare Workers

The Monolith Hub portal can be built and deployed directly to Cloudflare Workers using OpenNext.

## Workers Builds settings

| Setting         | Monolith Hub              |
| --------------- | ------------------------- |
| Worker name     | `monolith-hub`            |
| Root directory  | repository root           |
| Build command   | `npm run cf:build:hub`    |
| Deploy command  | `npm run cf:deploy:hub`   |
| Wrangler config | `apps/hub/wrangler.jsonc` |

Use Node.js 24 in Workers Builds. Commit the lockfile and use `npm ci`.

## Runtime configuration

Set these in your Worker's **Settings → Variables and Secrets**:

| Variable                  | Description                                                  |
| ------------------------- | ------------------------------------------------------------ |
| `DATABASE_URL`            | Required secret: reachable PostgreSQL connection string      |
| `MONOLITH_JWT_SECRET`     | Required secret, at least 32 random bytes for SSO signing    |
| `MONOLITH_SERVICE_TOKENS` | Secret JSON map for service tokens, e.g. `{"App":"<token>"}` |
| `HUB_URL`                 | Public HTTPS Hub origin (e.g. `https://hub.yourdomain.com`)  |
| `SESSION_COOKIE_DOMAIN`   | Shared custom-domain parent, e.g. `.yourdomain.com`          |
| `ALLOW_REGISTRATION`      | `true` or `false`                                            |

Use trusted subdomains such as `hub.example.com` for shared-cookie SSO. Never set a public hosting suffix such as `.workers.dev` as the cookie domain.

## Database runtime

Prisma uses `engineType = "client"` and `@prisma/adapter-pg`, so no Rust query engine binary is shipped to Workers.

Node servers keep a shared Prisma client. Workers keep a client within the current execution context and use PostgreSQL connections efficiently. The Hub accepts an optional `HYPERDRIVE` binding and uses its connection string when present; otherwise it uses the `DATABASE_URL` secret.

## Verify locally

```sh
npm ci
npm run setup
docker compose up -d --wait
npm run db:migrate
npm run db:seed
npm run check
npm run cf:build
npm run cf:check
```

- `cf:build` builds the OpenNext Worker output for the Hub.
- `cf:check` bundles the Worker with Wrangler's dry-run deployment.

## References

- [Cloudflare OpenNext configuration](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/)
- [OpenNext database guidance](https://opennext.js.org/cloudflare/howtos/db)
- [Prisma 6 on Cloudflare](https://www.prisma.io/docs/orm/v6/prisma-client/deployment/edge/deploy-to-cloudflare)
