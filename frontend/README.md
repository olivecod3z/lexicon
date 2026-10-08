# Lexycon frontend

This is the frontend deployed at https://dashboard.lexycon.site, including the
account-backed onboarding, study workspace, and branded loading screen.

## Backend boundary

Production requests go to the existing authenticated API at
https://lexicon-api-600311691439.europe-west1.run.app. Firebase web configuration
in `src/firebase.js` identifies the public app; it does not contain a server key.

This frontend-only publication does not update the Python code on main or deploy
backend services, Firestore rules, or indexes. The older Python checkout on main
does not provide all of this frontend's account/profile/review endpoints.
Use a compatible development API through `VITE_API_BASE_URL` for integration work.
Never put OpenAI keys or other server secrets into Vite environment variables.

## Development and checks

From this folder, run `npm ci` and `npm run dev`.
The isolated `/tests/fixtures/study-loading-preview.html` page displays the actual
loading component without sign-in or API calls.

Run `npm run lint` and
`node --test tests/browser-library.test.mjs tests/onboarding.test.mjs tests/study-loading.test.mjs`.
The browser-library and legacy onboarding tests cover retained utilities;
they are not authenticated end-to-end tests. The old Python preview server does
not simulate Firebase authentication or the account-backed dashboard.

## Frontend publishing

Use an authorized Firebase account and an explicit project; do not rely on the
repository's legacy default project.

From the repository root:

```sh
node scripts/build-hosting.mjs
firebase deploy --only hosting --project lexicon-aguet-20260928 --config firebase.json
npm run build --prefix frontend
firebase deploy --only hosting --project lexicon-aguet-20260928 --config firebase.dashboard.json
```

The first build packages the landing page and the legacy `/dashboard/` bundle.
The second builds dashboard assets for the subdomain root. Always keep
`--only hosting`; publishing this frontend does not require a backend deployment.
