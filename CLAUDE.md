# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Interactive Treasure Box Game** — A React-based web game where players click on treasure chests to find treasure and avoid skeletons. Players can sign up/sign in to persist their scores and appear on a leaderboard, or play as a guest with nothing stored.

The repo contains **two independently deployed projects**:

- **Frontend** (repo root): React + TypeScript + Vite SPA, deployed statically to GitHub Pages.
- **Backend** (`server/`): a standalone Express + SQLite API, deployed separately to Render, since GitHub Pages cannot run server code.

They communicate over a cross-origin REST API (`*.github.io` → `*.onrender.com`) — see "Auth & data model" below for why that shapes several design decisions.

## Development Setup

### Frontend

```bash
npm install
npm run dev          # http://localhost:3000/treasure-box-game/ (Vite base path is set for GitHub Pages)
npm run build         # outputs to /build
```

For the sign-in flow to work locally, copy `.env.example` to `.env.local` (already gitignored) so `VITE_API_BASE_URL` points at your local backend (`http://localhost:8080` by default).

### Backend (`server/`)

```bash
cd server
npm install
cp .env.example .env   # fill in JWT_SECRET (any random string works for local dev)
npm run dev             # tsx watch, http://localhost:8080
npm run build            # tsc -> dist/, then copies db/migrations into dist/
npm start                 # runs the compiled dist/index.js
```

`server/` is its own npm project with its own `package.json`/lockfile — it is intentionally not a workspace of the root project, so the frontend's dependency tree stays free of backend packages (and Render's build only installs what it needs).

Note: `server/package.json` pins `engines.node` to `24.x` (matching what's deployed on Render), while the frontend and CI currently run on Node 20 — if `better-sqlite3`'s native binary misbehaves locally, check `node --version` against that pin first.

There is no test suite configured for either project.

## Technology Stack

**Frontend**: React 18 + TypeScript, Vite 6.3 (dev port 3000), Tailwind CSS v4, Radix UI component library (not shadcn, imported directly), Motion for animations, React Hook Form + Zod for form validation, Sonner for toasts.

**Backend**: Express, `better-sqlite3` (synchronous SQLite), `bcrypt` for password hashing, `jsonwebtoken` for auth tokens, `express-rate-limit` on auth routes, `cors`.

## Code Architecture

### Frontend (`src/`)

- **`src/App.tsx`** — Main game component, branches on `useAuth().status`:
  - `loading` → skeleton placeholder while a stored token is validated in the background
  - `unauthenticated` → renders `AuthScreen` only (game grid not mounted)
  - `guest` / `authenticated` → renders the game
  - Game state: `boxes[]` (id, isOpen, hasTreasure), `score`, `gameEnded`. `initializeGame()` randomizes treasure placement, `openBox()` handles a click (+$100 treasure, -$50 skeleton), ends when treasure is found or all boxes are opened.
  - A `useEffect` keyed on `gameEnded` calls `saveScore()` **only** when `status === 'authenticated'` — this is what keeps guest mode from ever touching the backend, enforced structurally rather than just by UI convention.
  - Assets: `src/assets/*.png` (chest states), `src/audios/*.mp3` (open sound, skeleton laugh).

- **`src/context/AuthContext.tsx`** — the auth state machine. `status` is one of `'loading' | 'guest' | 'authenticated' | 'unauthenticated'`. On mount, a stored token (if any) is trusted optimistically, then validated against `GET /api/me` in the background; an invalid/expired token falls back to `unauthenticated` and clears storage. Exposes `signUp`, `signIn`, `signOut`, `continueAsGuest`, `saveScore`.

- **`src/lib/api.ts`** — thin fetch wrapper (`apiFetch`) reading `VITE_API_BASE_URL` from `import.meta.env`, attaching `Authorization: Bearer <token>`, and typed functions per backend route (`signUp`, `signIn`, `fetchMe`, `postScore`, `fetchLeaderboard`).

- **`src/lib/auth-storage.ts`** — persists `{token, user}` as one JSON blob under a single versioned `localStorage` key.

- **`src/lib/cold-start-notice.ts`** — wraps a promise to show a "waking up the server…" toast if it takes >3s, since Render's free tier spins the backend down after ~15 min idle (first request after that can take up to ~50s).

- **`src/components/auth/`** (`AuthScreen`, `SignInForm`, `SignUpForm`) and **`src/components/leaderboard/LeaderboardPanel.tsx`** — built from the existing Radix primitives in `src/components/ui/` (`form.tsx`, `tabs.tsx`, `dialog.tsx`, `card.tsx`, `input.tsx`, `sonner.tsx`, `skeleton.tsx`) rather than new UI components. `src/lib/auth-schema.ts` holds the shared Zod schema for username/password.

- **`src/components/ui/`** — Radix UI + Tailwind component library (pre-built, do not modify unless necessary).

### Backend (`server/src/`)

- **`index.ts`** — Express app bootstrap: CORS (origin allow-list from `CORS_ORIGIN` env var, no credentials since auth uses bearer tokens not cookies), rate limiting on `/api/auth/*`, route mounting, `/api/health` for Render's health check.
- **`db/client.ts`** + **`db/migrations/001_init.sql`** — opens the `better-sqlite3` connection at `DB_PATH` and runs the (idempotent, `IF NOT EXISTS`) migration on boot. Schema: `users` (id, username, password_hash) and `game_results` (id, user_id, score, result, treasure_found, boxes_opened, created_at).
  - **Score model**: `game_results` is a history table, not a denormalized "best score" column — best score is computed on read via `MAX(score)`. This avoids cache-drift bugs and is what the leaderboard query reads from.
- **`routes/auth.ts`** — `POST /api/auth/signup`, `POST /api/auth/signin`. Server-side validation (username 3–20 chars `[a-zA-Z0-9_]`, password 8–72 chars) is enforced regardless of client-side Zod checks.
- **`routes/scores.ts`** — `GET /api/me` (user + bestScore + gamesPlayed), `POST /api/scores` (persist a finished game), `GET /api/scores/me` (full history).
- **`routes/leaderboard.ts`** — `GET /api/leaderboard`, public (no auth), top 10 by best score per user.
- **`lib/jwt.ts`** / **`lib/password.ts`** — JWT sign/verify (`HS256`, 30-day expiry) and bcrypt hash/compare.
- **`middleware/requireAuth.ts`** — verifies the bearer token and sets `req.userId`/`req.username`.

### Auth & data model — why it's shaped this way

- **JWT bearer token in `localStorage`, not cookies.** The frontend (`*.github.io`) and backend (`*.onrender.com`) are different top-level domains, so a `SameSite=None; Secure` cookie would be fragile (Safari/Firefox third-party-cookie restrictions) and adds CORS complexity (`credentials: include`) for no real benefit here. The trade-off (token readable by injected JS) is accepted since the only asset at risk is a game score.
- **Render free tier** hosts the backend: no persistent disk, service sleeps after ~15 min idle. This means the SQLite file can be wiped by a redeploy or restart — a deliberate cost-vs-durability choice, not a bug. `DB_PATH` is env-configurable so upgrading to a paid plan + persistent disk later is a config change, not a redesign.

## Deployment

- **Frontend → GitHub Pages**, via `.github/workflows/deploy.yml`. `VITE_API_BASE_URL` is injected at build time from the repo's Actions variable (`vars.VITE_API_BASE_URL`) since Vite bakes `VITE_*` vars into the static bundle — it must point at the live Render URL, not localhost, for production builds. The custom command `.claude/commands/deploy_github_page.md` automates the full setup (GitHub auth, repo creation, Vite `base` path, Pages-via-Actions config).
- **Backend → Render**, via `render.yaml` (Blueprint) at the repo root — free plan, root directory `server`, health check at `/api/health`. `JWT_SECRET` is `sync: false` (set manually in the Render dashboard, never committed).

## Code Style & Conventions

- **Comments** — Add one-line comments on new functions explaining their purpose and documenting input/output parameters; keep existing comment style.
- **Component structure** — Functional components with hooks; avoid class components.
- **Imports** — Use absolute paths with `@` alias for `src/` (configured in `vite.config.ts`). Note: components under `src/components/ui/` import Radix packages with version-suffixed specifiers (e.g. `@radix-ui/react-dialog@1.1.6`) that are remapped via `vite.config.ts`'s `resolve.alias` — this is an artifact of how those files were generated, not a convention to imitate in new files. New frontend code should use plain unversioned imports.
- **File organization** — Keep helper functions in separate files if logic grows beyond ~50 lines.
- **Tailwind** — Prefer utility classes; avoid custom CSS unless impossible with utilities. Colors use the amber palette (`text-amber-900`, `bg-amber-200`, etc.) for the game theme.
