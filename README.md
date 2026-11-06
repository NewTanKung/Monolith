# Monolith Hub 🔮

> A centralized ecosystem portal & application launcher for **Lifestyle, Work, and Gaming** with seamless **Single Sign-On (SSO)**, built with an **iOS LiquidGlass Dark Mode** aesthetic.

![Monolith Hub Architecture](https://img.shields.io/badge/Architecture-Central%20Hub%20%2B%20SSO-indigo)
![Next.js 15](https://img.shields.io/badge/Next.js-15%20(App%20Router)-black)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-LiquidGlass-cyan)
![Prisma](https://img.shields.io/badge/Prisma-PostgreSQL-emerald)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)

---

## 🌟 Key Features

1. **Central App Launcher & Categorization**:
   - Organize applications across **Lifestyle**, **Work**, and **Game** categories.
   - Google / Microsoft 365 style **9-dot Waffle Menu** for instant access anywhere.
   - **Pinned Favorites** system allowing users to bookmark their top tools.
   - Live system health telemetry (**Online**, **Beta**, **Maintenance** indicators).

2. **iOS LiquidGlass Dark Mode Design**:
   - Translucent frosted glass layers (`backdrop-blur-2xl`), multi-specular highlights, and liquid glow reflections.
   - Ambient fluid aurora lighting spots and responsive hover micro-interactions.

3. **Zero-Redirect Single Sign-On (SSO)**:
   - Shared domain cookie architecture (`Domain=.yourdomain.com`) combined with Signed JWTs (`jose`).
   - Child systems on subdomains (e.g., `game.yourdomain.com`, `work.yourdomain.com`) verify the user session instantly without redirect flashing or re-authentication.

4. **Global Spotlight (Cmd+K / ⌘K)**:
   - Fast fuzzy search across applications, workflows, categories, and quick actions.

5. **Unified Notification Center**:
   - Central notification dropdown on the hub header.
   - Child sub-apps can push in-app events, achievements, and tasks directly to the Hub via `POST /api/notifications`.

6. **Admin Management Portal**:
   - Register new ecosystem apps with custom URLs, icons, colors, and role permissions.
   - 1-click **Maintenance Mode** switch to temporarily block traffic to sub-apps with a notification banner.

7. **Demo Sub-App & SDK Included**:
   - `@monolith/auth-client`: Universal JWT verifier and cookie parser for child apps.
   - `@monolith/demo-sub-app` ("Cyber Arena"): Fully functional sub-app demonstrating zero-redirect SSO session reading and event push.

---

## 📂 Repository Structure

```text
Monolith/
├── apps/
│   ├── hub/                  # Central Monolith Hub Portal (Next.js 15, Prisma, Tailwind)
│   │   ├── prisma/           # PostgreSQL Schema & Seed script
│   │   └── src/
│   │       ├── app/          # App router pages (Home, Login, Admin, APIs)
│   │       ├── components/   # LiquidGlass Navbar, WaffleMenu, AppCard, Spotlight
│   │       └── lib/          # Prisma client and session managers
│   └── demo-sub-app/         # Example Sub-App: "Cyber Arena" (Port 3001)
│       └── src/              # Reads hub_session cookie & pushes notifications to hub
├── packages/
│   └── auth-client/          # Shared SSO Verification SDK (@monolith/auth-client)
├── docker-compose.yml        # PostgreSQL container setup
└── package.json              # Monorepo workspaces configuration
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18+ (Node 24 recommended)
- **PostgreSQL**: Local Postgres or via `docker compose up -d`

### 2. Environment Setup
Copy `.env.example` to `.env`:
```env
DATABASE_URL="postgresql://monolith:monolith_password@localhost:5432/monolith_db"
MONOLITH_JWT_SECRET="monolith_super_secret_jwt_key_change_in_production_2026"
SESSION_COOKIE_DOMAIN="" # Leave empty for localhost, or set to ".yourdomain.com"
PORT=3000
```

### 3. Install & Seed Database
```bash
# Install all dependencies across monorepo
npm install

# Build shared auth SDK
npm run build --workspace=@monolith/auth-client

# Sync schema and populate seed data
npx prisma db push --schema=apps/hub/prisma/schema.prisma
npx tsx apps/hub/prisma/seed.ts
```

### 4. Run Development Servers
```bash
# Run Central Hub (Port 3000)
npm run dev:hub

# In a second terminal, run Demo Sub-App (Port 3001)
npm run dev:demo
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Accounts

The database comes pre-seeded with two accounts:

| Role | Email | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@monolith.local` | `admin1234` | Full access, Admin Portal, App Registry CRUD, Maintenance switch |
| **Member** | `user@monolith.local` | `user1234` | Standard member access, Pinned favorites, Notification center |

*(You can also click the quick one-click demo login buttons directly on the `/login` page).*

---

## 🔌 Integrating a New Sub-App with Monolith SSO

To connect your own sub-app (e.g. `lifestyle.yourdomain.com` or `work.yourdomain.com`):

1. **Install `@monolith/auth-client`**:
   ```bash
   npm install @monolith/auth-client
   ```

2. **Verify Session in your Sub-App (Next.js / Node.js / Express)**:
   ```typescript
   import { verifyHubSession } from "@monolith/auth-client";

   // Next.js Server Component or Route Handler:
   const user = await verifyHubSession(req.headers.get("cookie"));

   if (!user) {
     // User is not logged into Monolith Hub
     return redirect("https://hub.yourdomain.com/login");
   }

   console.log("Logged in user:", user.name, user.email, user.role);
   ```

3. **Push Notification to Central Hub**:
   ```typescript
   await fetch("https://hub.yourdomain.com/api/notifications", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
       userId: user.id,
       title: "New Task Assigned",
       message: "Sprint task #42 is ready for review.",
       sourceApp: "Task Studio",
       linkUrl: "https://work.yourdomain.com/task/42",
     }),
   });
   ```

---

## 🛡️ License

MIT License. Designed with ❤️ for next-generation lifestyle, work & game ecosystems.
