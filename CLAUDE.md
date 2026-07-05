# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Interactive Treasure Box Game** — A React-based web game where players click on treasure chests to find treasure and avoid skeletons. Built with TypeScript, Vite, Tailwind CSS, and Radix UI components.

## Development Setup

### Quick Start

```bash
npm install
npm run dev          # Start dev server on http://localhost:3000
npm run build        # Build for production (outputs to /build)
```

## Technology Stack

- **React 18** with TypeScript
- **Vite 6.3** for build tooling (dev server runs on port 3000)
- **Tailwind CSS v4** for styling
- **Radix UI** component library (not shadcn)
- **Motion** for animations
- **React Hook Form** for form handling
- **Lucide React** for icons
- Build output: `/build` directory

## Code Architecture

### Key Files & Responsibilities

- **`src/App.tsx`** — Main game component
  - State: `boxes[]` (id, isOpen, hasTreasure), `score`, `gameEnded`
  - Logic: `initializeGame()` (randomize treasure position), `openBox()` (handle clicks), `resetGame()`
  - Game rules: +$100 for treasure, -$50 for skeleton, ends when treasure found or all boxes opened
  - Assets loaded: closed chest image, treasure chest, skeleton chest, two sound effects (chest_open.mp3, chest_open_with_evil_laugh.mp3)

- **`src/components/ui/`** — Radix UI + Tailwind component library (pre-built, do not modify unless necessary)
  - Includes: button, card, dialog, form, select, tabs, tooltip, etc.
  - Button component at `src/components/ui/button.tsx` — used for "Play Again" action

- **`src/assets/`** — Game images (PNG files)
  - `treasure_closed.png` — Unopened chest
  - `treasure_opened.png` — Treasure inside
  - `treasure_opened_skeleton.png` — Skeleton inside
  - `key.png` — Available for cursor hover effects

- **`src/audios/`** — Sound effects (MP3 files)
  - `chest_open.mp3` — Normal chest opening sound
  - `chest_open_with_evil_laugh.mp3` — Skeleton discovery sound

- **`src/guidelines/Guidelines.md`** — Template for project guidelines (mostly empty; customize as needed)

- **`src/index.css`** — Compiled Tailwind CSS (generated; do not edit directly)

### Design Patterns

- **Motion animations** — Uses `motion/react` for chest flip (rotateY), scale, and result popups
- **State management** — Simple React hooks; game state resets with `initializeGame()`
- **Styling** — Tailwind utility classes; amber/gold color scheme for game theme (amber-50 to amber-900)
- **Responsive layout** — `grid-cols-1 md:grid-cols-3` for 1 column on mobile, 3 on desktop

## Common Development Tasks

### Add a Sound Effect

1. Place MP3 file in `src/audios/`
2. Import at top of `App.tsx`: `import soundFile from './audios/file.mp3'`
3. Play with: `new Audio(soundFile).play()`

### Modify Game Rules

- Treasure value: `src/App.tsx` line 46 (`score + 100`)
- Skeleton penalty: `src/App.tsx` line 46 (`score - 50`)
- Number of boxes: `src/App.tsx` line 23 (change `3` in `Array.from({ length: 3 }, ...)`)

### Update Styling

- Colors use Tailwind's amber palette: `text-amber-900`, `bg-amber-200`, etc.
- Spacing uses Tailwind units: `mb-8` = margin-bottom, `px-8` = padding left/right
- Responsive: prefix with `md:` for medium breakpoint (e.g., `md:grid-cols-3`)

### Test Locally

- Dev server auto-opens at `http://localhost:3000` with HMR (hot module reload)
- Changes to `.tsx` files reflect immediately

## Code Style & Conventions

- **Comments** — Add one-line comments on new functions explaining their purpose and documenting input/output parameters; keep existing comment style
- **Component structure** — Functional components with hooks; avoid class components
- **Imports** — Use absolute paths with `@` alias for `src/` (configured in vite.config.ts)
- **File organization** — Keep helper functions in separate files if logic grows beyond ~50 lines
- **Tailwind** — Prefer utility classes; avoid custom CSS unless impossible with utilities

## Deployment Notes

README mentions custom deployment commands:

- `.claude/commands/deploy_vercel.md` — Vercel deployment
- `.claude/commands/deploy_github_page.md` — GitHub Pages deployment

Create these files in `.claude/commands/` as needed and restart Claude Code session for new commands to appear.
