# Lexicon landing page

The existing Lexicon marketing site, imported from the standalone landing-page project. It uses Next.js, Manrope and DM Sans, with bundled images and fonts.

## Local development

From this directory, run `npm ci`, then `npm run dev`. Open http://localhost:3000.

## Build

Run `npm run build:hosting` to produce the static site in `out/`.
The shared Firebase configuration lives at the repository root. From the root,
run `node scripts/build-hosting.mjs` to build both the landing page and dashboard.
Then run `firebase deploy --only hosting --project lexicon-study-20260923` from the root.

The landing page's Get started and Open student dashboard links open `/dashboard/`.
The public dashboard is explicitly a navigation preview: uploads and AI generation
are disabled until an authenticated online API is available. Local dashboard
builds keep the existing API behavior.

## Repository structure

- `landing/`: this marketing website.
- `../frontend/`: the React study dashboard.
- `../app/`: the Python API.

These are separate applications hosted together; authentication and billing are not connected. Hosting is not automatically deployed by a Git push.

Keep dependencies, build output, Firebase caches and local environment files out of commits. Use a task branch and pull request for future changes, following the root CONTRIBUTING.md.
