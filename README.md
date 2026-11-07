# Monolith Hub

A shared workspace for lifestyle, work, and gaming applications. The monorepo contains the Next.js Monolith Hub and a server-side SSO SDK.

## Requirements

- Node.js 22.13 LTS or Node.js 24 or later
- npm
- PostgreSQL 16 or later (Docker Compose configuration included)

## Local setup

Run commands from the repository root:

```sh
npm ci
npm run setup
docker compose up -d --wait
npm run db:migrate
npm run db:seed
npm run dev
```

Open the Hub at http://localhost:3000.

`setup` generates random JWT and service credentials and writes root `.env` and `apps/hub/.env.local`. It preserves existing environment files. If files already exist, configure them using the adjacent `.env.example` templates.

Prisma commands read the root `.env`. Next.js reads `apps/hub/.env.local`. Keep the database URL and shared signing key consistent across the appropriate files.

The service registry starts empty. Add your real services through `/admin` after creating an administrator. The seed command does not add example services or change existing services, accounts, or notifications.

## Create the administrator

Public registration always creates a Member. Provision administrators explicitly from a trusted terminal:

PowerShell:

```powershell
$env:ADMIN_EMAIL = "admin@example.com"
$env:ADMIN_PASSWORD = "<a unique password of at least 12 characters>"
npm run admin:create
Remove-Item Env:ADMIN_PASSWORD
```

POSIX shell:

```sh
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='<unique password>' npm run admin:create
```

The command refuses to overwrite or promote an existing account. An administrator account is provisioned explicitly.

## Commands

| Command                                   | Purpose                                                         |
| ----------------------------------------- | --------------------------------------------------------------- |
| `npm run dev`                             | Start the Hub in development mode                               |
| `npm run dev:hub`                         | Start the Hub development server                                |
| `npm run build`                           | Build SDK and production Hub                                    |
| `npm run start --workspace=@monolith/hub` | Start production Hub                                            |
| `npm run lint`                            | ESLint                                                          |
| `npm run typecheck`                       | Generate Prisma client and check workspaces                     |
| `npm test`                                | Authentication, validation, request-policy, and singleton tests |
| `npm run check`                           | Lint, types, unit tests, and production builds                  |
| `npm run test:e2e`                        | Desktop and mobile browser/integration tests                    |
| `npm run db:migrate`                      | Apply committed SQL migrations                                  |
| `npm run db:push`                         | Synchronize schema during disposable local development          |
| `npm run db:seed`                         | No default services; preserve existing data                     |
| `npm run admin:create`                    | Provision an administrator                                      |

For browser tests, prepare the local database and build the app first, then run:

```sh
npx playwright install chromium
npm run test:e2e
```

The suite starts production servers automatically. To use an installed Chrome/Edge browser locally, set `PLAYWRIGHT_CHANNEL=chrome` or `msedge`. Test fixtures use unique identifiers and remove only the records they create. Run against a dedicated development/test database.

## Architecture

```text
apps/hub                 Portal, account APIs, app registry, notifications
packages/auth-client     JWT signing/verification, roles, cookie parsing
scripts                  Local setup and administrator provisioning
tests                    Unit/security tests and browser integration tests
.github/workflows        CI with PostgreSQL, checks, and browser tests
```

- Guests see Guest applications. Members see Guest and Member applications. Administrators see all permitted applications.
- All Hub launchers route through `/apps/:slug/launch`. The server rechecks current role, disabled status, maintenance status, and the destination URL.
- Maintenance redirects to the app status page. It controls launching from the Hub; separate services must enforce their own authorization and maintenance policy at its own endpoints.
- Favorites have a single shared source of state. Failed saves remain visible as errors rather than appearing saved.
- Search supports Ctrl/Cmd+K, arrow keys, Enter, Escape, focus containment, and category selection.
- Notifications refresh when opened and every 30 seconds while the document is visible.

## SSO configuration

Set `MONOLITH_JWT_SECRET` to at least 32 random bytes on every trusted server. There is no fallback key. Set `SESSION_COOKIE_DOMAIN=.example.com` on the Hub to share the HttpOnly cookie with trusted subdomains. Leave it blank for localhost.

Production cookies use Secure, HttpOnly, SameSite=Lax, and a seven-day lifetime. Tokens require the expected algorithm, issuer, audience, subject, role, issue time, and expiry.

Hub requests resolve the token subject against the database, so deleted users and updated roles take effect immediately. Offline SDK consumers validate a signed snapshot until its expiry and should perform an authoritative profile check when immediate revocation is required.

All servers holding the shared HMAC key are trusted to mint sessions. Keep this SDK and the key on trusted servers; never expose the key through `NEXT_PUBLIC_*` variables, browser bundles, or untrusted sub-apps. Use an asymmetric identity provider if sub-app servers must not share session-signing authority.

Example server integration:

```ts
import { verifyHubSession, hasRequiredRole } from "@monolith/auth-client";

const user = await verifyHubSession(request.headers.get("cookie"));
if (!user || !hasRequiredRole(user.role, "MEMBER")) {
  return new Response("Unauthorized", { status: 401 });
}
```

The SDK exports compiled JavaScript and TypeScript declarations. Build it with `npm run build:packages` before using it outside the Next.js workspaces.

## Notification integration

Set a separate random service token for each trusted application in the Hub environment:

```dotenv
MONOLITH_SERVICE_TOKENS='{"External App":"<random credential of at least 32 bytes>"}'
```

External servers send authenticated requests to the Hub using Bearer tokens:

```ts
await fetch(new URL("/api/notifications", process.env.HUB_URL), {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer " + process.env.MONOLITH_SERVICE_TOKEN,
  },
  body: JSON.stringify({
    userId,
    title: "Task assigned",
    message: "A new task is ready.",
    linkUrl: "https://work.example.com/tasks",
  }),
});
```

Service identity comes from the configured credential. User-authenticated requests may notify only their own account, and their source is labeled Monolith. Notification links accept only HTTP(S) URLs or local paths. All read/update operations remain scoped to the current account.

## Cloudflare Workers

For Cloudflare, follow [docs/cloudflare.md](docs/cloudflare.md). The Hub has OpenNext/Wrangler configurations, explicit build/deploy commands, and Workers-compatible PostgreSQL access.

## Deployment

1. Create a PostgreSQL database and set production environment variables on each server.
2. Set `HUB_URL` to the externally visible HTTPS origin. Configure the cookie domain for your trusted subdomains.
3. Generate fresh signing/service credentials. Provision the administrator and add your real service destinations through `/admin`.
4. Run `npm ci`, `npm run db:migrate`, and `npm run build`.
5. Start each production workspace behind your HTTPS reverse proxy.
6. Set `ALLOW_REGISTRATION=false` if registration should be closed.

Login and notification rate limits use shared PostgreSQL counters. Registration also has a shared traffic ceiling. Set stricter IP limits at your ingress when exposing the service publicly; the application does not trust arbitrary forwarded-IP headers.

The initial migration is for new databases. For an existing installation whose schema already matches the original repository, back up the database and baseline the original tables before applying schema changes. Do not apply an initial create-tables migration blindly to a populated database. See `docs/upgrading.md`.

Dependency overrides upgrade Prisma's transitive `deepmerge-ts` and the lint tools' `minimatch` to patched versions. Keep these overrides until the upstream dependency ranges include the fixes, and verify updates with `npm run check`.

The provided Docker database password is for localhost development only. Production configuration must use its own database credentials.

MIT License.
