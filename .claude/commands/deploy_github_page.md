---
description: Deploy this Vite app to GitHub Pages via GitHub Actions
---

Deploy the current project to GitHub Pages. Follow these steps in order, checking state before acting so the command is safe to re-run.

## 1. Check GitHub CLI auth

Run `gh auth status`. If not logged in, tell the user to run `gh auth login` themselves (interactive, cannot be automated) and wait for confirmation before continuing. If multiple accounts are present, confirm which account should own the repo.

## 2. Check for a local git repo

Run `git status`. If it fails with "not a git repository", run `git init` and create an initial commit of the current working tree (respecting `.gitignore`).

## 3. Check for a GitHub remote / repo

Run `git remote -v`. If there is no `origin`, ask the user for:
- the repo name (default: current directory's basename)
- visibility: public (required for GitHub Pages on free personal accounts) or private (only works with GitHub Pro/Team/Enterprise Pages)

Then create it with:
```
gh repo create <owner>/<repo> --<public|private> --source=. --remote=origin
```
Do not push yet — Pages config needs to land first.

## 4. Set the Vite `base` path

GitHub Pages serves project sites at `https://<owner>.github.io/<repo>/`, so asset URLs must be rooted at `/<repo>/`, not `/`. Edit `vite.config.ts` and set:
```ts
export default defineConfig({
  base: '/<repo>/',
  // ...rest of existing config
});
```
Use the actual repo name from step 3 (or the existing remote if one already existed).

## 5. Add a GitHub Actions workflow

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```
Adjust `branches` to match the repo's default branch if it isn't `main`, and `path` to match `build.outDir` in `vite.config.ts`.

## 6. Enable Pages (build type = GitHub Actions)

```
gh api -X PUT repos/<owner>/<repo>/pages -f build_type=workflow
```
If that 404s because Pages isn't initialized yet, create it first:
```
gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow
```

## 7. Commit and push

Stage the `vite.config.ts` change and the new workflow file (plus the initial commit if this was a brand new repo), commit, and push to `origin main`. Set upstream if needed: `git push -u origin main`.

## 8. Watch the deployment

```
gh run watch $(gh run list --workflow=deploy.yml -L1 --json databaseId -q '.[0].databaseId')
```
Wait for it to succeed. If it fails, read the logs with `gh run view --log-failed` and fix the issue (common ones: wrong `outDir`/`path` mismatch, wrong branch name, missing `permissions` block).

## 9. Report the URL

Once the deploy job succeeds, tell the user their site is live at:
```
https://<owner>.github.io/<repo>/
```
