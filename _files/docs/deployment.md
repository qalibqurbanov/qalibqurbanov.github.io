# Deployment (how the site gets online)

## The idea in one picture

```
git push to main
      |
      v
GitHub Actions workflow "Deploy to GitHub Pages"  (.github/workflows/deploy.yml)
      |   installs, lints, builds website/  ->  website/dist
      v
GitHub Pages serves website/dist at https://qalibqurbanov.github.io/
```

## Things to remember

- The site is a React + Vite project in `website/`. The repository root also holds `worker/` (the mail-sending Cloudflare Worker, see mail-sending.md), `scripts/` and `_files/`.
- Every push to `main` deploys automatically. It can also be started by hand: GitHub > Actions > "Deploy to GitHub Pages" > Run workflow.
- GitHub Pages must have its source set to **GitHub Actions** (repo Settings > Pages). With "Deploy from a branch" GitHub builds the README with Jekyll instead and the real site never appears. This was the cause of the live site once showing the wrong page.
- Settings that start with `VITE_` are read **while building**. Changing one on GitHub does nothing until the workflow runs again.
- A new deploy can take a few minutes to show, because of caching. Hard refresh with Ctrl+Shift+R.
- The build must pass lint and type checks, or the deploy stops. Locally: `npm run lint` and `npm run build` inside `website/`.

## Run it locally

```
cd website
npm install
npm run dev
```

The dev server uses port 1337. Local settings go in `website/.env.local` (see `website/.env.example`).
