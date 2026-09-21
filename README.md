# CampusLaunch

A premium, trustworthy web platform connecting **startup founders** with **college placement cells** — founders post jobs/part-time roles/tasks, colleges request and negotiate fee & terms, and once agreed, the college distributes the work to specific students on its roster.

Two dedicated logins: **Founder Login** and **College Login**.

---

## Why this has zero npm dependencies

This app is built entirely on Node.js built-ins — no Next.js, no Express, no Prisma, no `npm install` step at all. That was a deliberate choice: it means there is nothing that can fail to install, no version drift, no supply-chain surface. You just run `node server.js`.

Under the hood:
- **Server**: plain `node:http`, with a small hand-written router
- **Database**: `node:sqlite` (built into Node 22.5+), a real embedded SQL database — no separate DB server to install or run
- **Auth**: `node:crypto` scrypt password hashing + signed session cookies (no third-party auth library)
- **Frontend**: server-rendered HTML + a small vanilla JS helper for forms/toasts — no build step, no bundler
- **Styling**: hand-crafted CSS with a light, premium visual system (see `public/styles.css`) — no Tailwind/CSS framework, so there's nothing to compile

## Requirements

- **Node.js 22.5 or newer** (for `node:sqlite`). Check with `node -v`.
  - If you're on an older Node, install the latest LTS from [nodejs.org](https://nodejs.org).

## Running it

```bash
# 1. Unzip and enter the folder
cd campus-launch

# 2. (Optional but recommended) seed demo data — founders, colleges, listings, students
npm run seed

# 3. Start the server
npm start
```

Then open **http://localhost:3000**.

To change the port: `PORT=4000 npm start`.

For auto-restart on file changes during development: `npm run dev`.

### Demo accounts (after `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Founder — Loopwave Labs | `ananya@loopwave.io` | `founder123` |
| Founder — FinPilot | `karthik@finpilot.in` | `founder123` |
| College — SVCE, Bengaluru | `placements@svce.edu` | `college123` |
| College — NIT Calicut | `tpo@nitc-alumni.edu` | `college123` |

The SVCE account already has one fully **agreed** request with students assigned, so you can see the whole lifecycle immediately. The NIT Calicut account has one **pending** request, so you can walk through negotiating it yourself.

Running `npm run seed` again wipes and re-seeds all data — safe to re-run any time.

## How the flow works

1. **Founder** signs up, creates a company profile, and posts an opportunity (Job / Part-time / Task) with a description, skills, budget hint and headcount.
2. **College** signs up, browses open opportunities, and sends a request with a proposed fee and a short note.
3. Both sides **negotiate in a shared message thread** attached to that request.
4. Either side can **finalize the agreement** — entering the final fee and terms. Status moves to `AGREED`.
5. The **college assigns the work to specific students** from its own roster (added under "Students"), one task per student, and tracks each assignment through `Assigned → In Progress → Submitted → Approved`. The founder sees this distribution read-only.

## Project structure

```
server.js              — HTTP server, routing, all page & API handlers
src/db/                — SQLite schema (index.js) and data-access functions (repo.js)
src/lib/                — router, auth (hashing/sessions), HTTP helpers
src/render/             — server-side HTML rendering (layout, pages, small helpers)
public/                 — styles.css (design system) and app.js (client-side form/toast helpers)
scripts/seed.js         — demo data seeder
data/                   — created automatically; holds campuslaunch.db (SQLite file)
```

The database file lives at `data/campuslaunch.db`. Delete the `data/` folder any time to reset to a completely empty state (or run `npm run seed` to reset with demo data).

## Design notes

- **Light theme**, warm off-white background with a deep navy/indigo primary and a muted gold accent — meant to read as premium and trustworthy rather than "startup neon."
- Serif headings (system font stack, no external font loading) paired with clean system sans body text, for an elegant, editorial feel.
- Every state — open/pending/negotiating/agreed/declined, assignment status — has a clear colored badge so both sides always know where things stand.
- Fully responsive down to mobile widths.

## Recommendation: is this the best stack for it?

For a **real product you intend to grow and eventually scale to many colleges/founders**, I'd recommend moving to:

- **Next.js (App Router) + TypeScript** — for a richer, more interactive UI (live-updating negotiation threads, optimistic UI, etc.) and a large hiring/ecosystem pool
- **PostgreSQL + Prisma** — SQLite (used here) is genuinely fine up to moderate traffic and is zero-ops, but Postgres gives you concurrent writes at scale, managed hosting (Supabase/Neon/Railway), and easier backups
- **NextAuth / Auth.js** for auth, or Clerk if you want hosted auth with less code
- **Deploy on Vercel** (frontend/API) with a managed Postgres — the standard, low-friction path for this shape of app

That's the stack I'd normally reach for. I built this version dependency-free specifically because this sandbox has no access to the npm registry (blocked by network policy) — so a Next.js/Prisma project literally could not be installed or verified here. What you have now is a **fully working, real app** you can run immediately; migrating it to Next.js + Postgres later is a straightforward rewrite since the data model and flows are already proven out.
