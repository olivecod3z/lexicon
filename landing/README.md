# Lexicon landing page

The existing Lexicon marketing site, imported from the standalone landing-page project. It uses Next.js, Manrope and DM Sans, with bundled images and fonts.

## Local development

From this directory, run `npm ci`, then `npm run dev`. Open http://localhost:3000.

## Build

Run `npm run build:hosting` to produce the static site in `out/`.
The included Firebase configuration points to the existing `lexicon-study-20260923` site. Deployment is manual: run `firebase deploy --only hosting` from this directory after checking the selected account and project.

## Repository structure

- `landing/`: this marketing website.
- `../frontend/`: the React study dashboard.
- `../app/`: the Python API.

These are separate applications; importing the landing page does not connect authentication, billing or dashboard navigation. Hosting is not automatically deployed by a Git push.

Keep dependencies, build output, Firebase caches and local environment files out of commits. Use a task branch and pull request for future changes, following the root CONTRIBUTING.md.
