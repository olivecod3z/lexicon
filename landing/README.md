# Lexycon landing page

The existing Lexycon marketing site, imported from the standalone landing-page project. It uses Next.js, Manrope and DM Sans, with bundled images and fonts.

## Local development

From this directory, run `npm ci`, then `npm run dev`. Open http://localhost:3000.

## Build

Run `npm run build:hosting` to produce the static site in `out/`.
The shared Firebase configuration lives at the repository root. From the root,
run `node scripts/build-hosting.mjs` to build both the landing page and dashboard.
Then run `firebase deploy --only hosting --project lexicon-aguet-20260928 --config firebase.json` from the root using an authorized Firebase account. Keep the explicit project; the repository's legacy default is not this live site.

The landing page's Get started links open `https://dashboard.lexycon.site/`.
That frontend uses the existing Firebase sign-in and hosted study API. The legacy
`/dashboard/` path redirects to the dashboard subdomain after deployment.
See `../frontend/README.md` for the separate dashboard Hosting build and the
frontend/backend boundary on main.

## Repository structure

- `landing/`: this marketing website.
- `../frontend/`: the React study dashboard.
- `../app/`: the Python API.

These are separate frontend applications. Publishing them does not modify or deploy the Python API. Hosting is not automatically deployed by a Git push.

Keep dependencies, build output, Firebase caches and local environment files out of commits. Use a task branch and pull request for future changes, following the root CONTRIBUTING.md.
