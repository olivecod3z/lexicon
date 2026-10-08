# Owner Firebase deployment

## Brand name and compatibility

The product name is now **Lexycon**. Existing Firebase project/site identifiers,
Cloud Run URLs, the authentication environment variable, and database/browser
storage keys retain their original names to preserve access and existing data.
Changing these requires a separate infrastructure or data migration; a text
replacement does not create a new domain or cloud project.

Local media filenames and references use the new spelling. Prerecorded audio,
video frames and the unused raster logo have not been re-created by this text
rename. The original survey export and Git history remain historical evidence.

The branding changes must be built and deployed before appearing on the website.

Project: lexicon-aguet-20260928
Website: https://lexycon.site
Dashboard: https://dashboard.lexycon.site
Legacy dashboard path: https://lexycon.site/dashboard/

## Sign-in and domain launch checklist

The original onboarding now runs within the dashboard after authentication.
`GET/POST /account/profile` stores the name, institution, degree level, goals,
daily minutes, and completion flag against the authenticated account. A course
alone never counts as completed onboarding. Existing accounts without a profile
complete setup while retaining their existing course.

Firestore needs the course/material composite indexes in `firestore.indexes.json`
to combine account ownership filters with newest-first ordering. Deploy them with
`firebase deploy --only firestore:indexes --project lexicon-aguet-20260928` and
wait until they are READY before testing the signed-in dashboard. Missing indexes
cause course/material reads to return 503 even when authentication succeeds.

Before inviting students, complete these steps in this order:

1. In **Firebase Console → Authentication → Sign-in method**, enable the
   **Email/Password** provider and save it. Google sign-in is a separate
   provider, so enabling Google does not enable email account creation.
2. Keep `lexycon.site` and `dashboard.lexycon.site` listed in **Authentication
   → Settings → Authorized domains**. The dashboard subdomain is the canonical
   place for account creation and the study workspace; the root site's
   `/dashboard/` path redirects there.
3. Deploy the API revision before testing a new account. It contains the
   custom-domain CORS rules and Firebase token verification used by the hosted
   dashboard:

   ```powershell
   gcloud run deploy lexicon-api --source . --region europe-west1 --project lexicon-aguet-20260928
   ```

   Do not add `--set-env-vars` or `--set-secrets` to this command unless you
   intend to change the service configuration. The deployed service already
   holds the production settings and OpenAI secret.
4. Build and deploy the dashboard and landing page as described below. Test a
   brand-new email at `https://dashboard.lexycon.site/`: create the account,
   create one course, then sign out and sign back in.
5. If a security product blocks `lexycon.site`, do not instruct students to
   bypass it. Verify the live deployment, then send the URL and the false
   positive evidence to the security provider for reclassification.

The landing page retains its design and content from main commit 4373bc2, with user-requested autoplay enabled for its demos and muted promotional video. The root Firebase Hosting site serves the landing page and retains the old `/dashboard/` path. A second Hosting site serves the dashboard app at the root of `dashboard.lexycon.site`.

Build on Windows from the repository root:

```powershell
Push-Location landing
npm.cmd ci
$env:FIREBASE_HOSTING='true'
npm.cmd run build
Pop-Location
Push-Location frontend
npm.cmd ci
$env:VITE_BASE_PATH='/dashboard/'
$env:VITE_API_BASE_URL='https://lexicon-api-600311691439.europe-west1.run.app'
npm.cmd run build
Pop-Location
New-Item -ItemType Directory -Force hosting-dist
Copy-Item landing/out/* hosting-dist -Recurse -Force
New-Item -ItemType Directory -Force hosting-dist/dashboard
Copy-Item frontend/dist/* hosting-dist/dashboard -Recurse -Force
firebase deploy --only hosting --project lexicon-aguet-20260928
```

Build and deploy the dashboard subdomain separately:

```powershell
Push-Location frontend
$env:VITE_BASE_PATH='/'
$env:VITE_API_BASE_URL='https://lexicon-api-600311691439.europe-west1.run.app'
npm.cmd run build
Pop-Location
firebase deploy --only hosting --config firebase.dashboard.json --project lexicon-aguet-20260928
```

Use a fresh hosting-dist folder when rebuilding to avoid retaining obsolete assets.

The dashboard connects directly over HTTPS to the Python service on Cloud Run
in europe-west1. The landing page remains public. The dashboard requires a
Firebase account, and the API verifies the caller's Firebase ID token. Courses,
materials, generated resources, recall cards and practice sessions are scoped to
the signed-in account. Hosted AI generation additionally requires a verified
email address.

Cloud Run uses the lexicon-api service account and Firestore for materials,
quizzes, attempts and practice sessions. OPENAI_API_KEY comes from Secret Manager. Never put it in frontend environment
variables. The old preview-access secret is no longer used by the app.

The free plan allows one course and three unique lecture packs per account per UTC
month. Each pack can produce notes, flashcards and mixed practice; reopening a
successful cached result does not consume another pack. Per-account and shared
generation-attempt caps provide additional beta cost protection. The preview also
limits upload and practice/quiz submission attempts. Failed billable attempts
still count toward attempt caps, while a failed first generation releases its
unused pack reservation. Saved lectures are limited to 60,000 readable characters
and the library lists the newest 100. Scaling is configured for zero idle instances
and one maximum instance; these settings are not a monetary cap.
