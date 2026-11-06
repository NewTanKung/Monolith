# Deploy Monolith to Cloudflare Workers

Monolith has two independent Next.js applications. Build and deploy each one explicitly. Running auto-detection at the npm workspace root is ambiguous; the root Wrangler configuration now explicitly targets the Hub.

## Workers Builds settings

Create/connect one Cloudflare Worker per application. Keep the build root at the repository root so npm can resolve the workspaces and the shared lockfile.

| Setting         | Hub                       | Cyber Arena                        |
| --------------- | ------------------------- | ---------------------------------- |
| Worker name     | `monolith-hub`            | `monolith-demo`                    |
| Root directory  | repository root           | repository root                    |
| Build command   | `npm run cf:build:hub`    | `npm run cf:build:demo`            |
| Deploy command  | `npm run cf:deploy:hub`   | `npm run cf:deploy:demo`           |
| Wrangler config | `apps/hub/wrangler.jsonc` | `apps/demo-sub-app/wrangler.jsonc` |

Deploy the Hub first. Arena has an explicit `HUB` service binding pointing to `monolith-hub`. If you use different Worker names, update the Hub's name in both Wrangler configs (root and app) and the Arena's service binding. Update the Arena's own name in its config.

The old root-level `npm run build` followed by `npx wrangler deploy` also works for the Hub: Wrangler runs its explicit custom build to produce the Hub Worker. The targeted commands above avoid building both Node apps and then rebuilding the Hub.

Use Node.js 24 in Workers Builds. Commit the lockfile and use `npm ci`.

## Runtime configuration

Set these in each Worker's **Settings → Variables and Secrets**. Build secrets alone do not configure the running Worker. The committed configuration preserves dashboard variables during deploys.

| Variable                  | Hub                                                                          | Arena                                   |
| ------------------------- | ---------------------------------------------------------------------------- | --------------------------------------- |
| `DATABASE_URL`            | Required secret: reachable PostgreSQL connection string                      | Not needed                              |
| `MONOLITH_JWT_SECRET`     | Required secret, at least 32 random bytes                                    | Same signing secret                     |
| `MONOLITH_SERVICE_TOKENS` | Secret JSON map, for example `{"Cyber Arena":"<random service credential>"}` | Not needed                              |
| `MONOLITH_SERVICE_TOKEN`  | Not needed                                                                   | Matching Cyber Arena service credential |
| `HUB_URL`                 | Public HTTPS Hub origin                                                      | Same public Hub origin                  |
| `DEMO_URL`                | Not needed                                                                   | Public HTTPS Arena origin               |
| `SESSION_COOKIE_DOMAIN`   | Shared trusted custom-domain parent, e.g. `.example.com`                     | Not needed                              |
| `ALLOW_REGISTRATION`      | `true` or `false`                                                            | Not needed                              |

Use trusted subdomains such as `hub.example.com` and `arena.example.com` for shared-cookie SSO. Never set a public hosting suffix such as `.workers.dev` as the cookie domain. Update the Cyber Arena URL in the app registry to its deployed destination.

All application pages that access PostgreSQL are dynamic. These builds do not require production database or signing credentials. If you later add static generation that needs secrets, configure those separately under **Build variables and secrets**.

Apply migrations to the target database from a trusted development/CI environment before serving traffic. Run `npm run db:migrate` with the root `.env` pointing at that database. Provision the administrator using `npm run admin:create`; neither action is run during Worker deployment.

Do not use the local Docker hostname or localhost in production `DATABASE_URL`. Use a PostgreSQL provider reachable from Workers, with its required TLS parameters.

## Database runtime

Prisma uses `engineType = "client"` and `@prisma/adapter-pg`, so no Rust query engine binary is shipped to Workers. The same factory is used by Node servers, seed/admin scripts, and integration tests.

Node servers keep a shared Prisma client. Workers keep a client only within the current execution context and use PostgreSQL connections once, preventing socket reuse across requests. The Hub accepts an optional `HYPERDRIVE` binding and uses its connection string when present; otherwise it uses the `DATABASE_URL` secret. To use Hyperdrive, create it in your account and add the real binding to both Hub configurations. No placeholder resource IDs are committed.

## Communication between the Workers

Arena sends profile lookups and notification events through the `HUB` service binding. Credentials remain server-only. Ordinary Node development uses `HUB_URL` over HTTP instead. This also avoids depending on a public Worker-to-Worker fetch path in production.

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
npx playwright install chromium
npm run test:e2e
npm run test:e2e:workers
```

- `cf:build` builds both OpenNext Worker outputs.
- `cf:check` bundles both Workers with Wrangler's dry-run deployment. It does not publish resources.
- `test:e2e:workers` starts both OpenNext previews on isolated ports 18787/18788 and runs the desktop/mobile suite in the Workers runtime. The preview commands set their Hub/Arena origins through Wrangler variables; local credentials and the database URL come from the app environment files generated by `setup`. The Windows preview test uses a 30-second Hub deadline.
- The manual preview commands use ports 3000/3001 to match the generated local origins. To preview one Worker manually, run `npm run cf:preview:hub` or `npm run cf:preview:demo`. OpenNext loads the app's Next.js environment files for local preview. Copy the adjacent `.dev.vars.example` if you need to select a different `NEXTJS_ENV`.
- Linux and WSL are recommended for OpenNext build tooling. CI runs on Linux.

Production deploy commands publish to your Cloudflare account and require your own authentication. Configuring support and running dry-runs do not create a production database, domain, or Worker deployment.

## References

- [Cloudflare OpenNext configuration](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/)
- [OpenNext database guidance](https://opennext.js.org/cloudflare/howtos/db)
- [Prisma 6 on Cloudflare](https://www.prisma.io/docs/orm/v6/prisma-client/deployment/edge/deploy-to-cloudflare)
