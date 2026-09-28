# Owner Firebase deployment

Project: lexicon-aguet-20260928
Website: https://lexicon-aguet-20260928.web.app
Dashboard: https://lexicon-aguet-20260928.web.app/dashboard/

The landing page retains its design and content from main commit 4373bc2, with user-requested autoplay enabled for its demos and muted promotional video.
Only the dashboard is restored to the original Python API study flow.

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

Use a fresh hosting-dist folder when rebuilding to avoid retaining obsolete assets.

The dashboard connects directly over HTTPS to the Python service on Cloud Run
in europe-west1. The landing page remains public. The dashboard opens without a passcode at the owner's request. This is one shared
workspace: anyone with the URL can access or delete materials and use the shared
daily allowance. Individual accounts and private libraries are not implemented.

Cloud Run uses the lexicon-api service account and Firestore for materials,
quizzes, attempts and practice sessions. OPENAI_API_KEY comes from Secret Manager. Never put it in frontend environment
variables. The old preview-access secret is no longer used by the app.

The preview allows 20 upload attempts and 30 generation requests per UTC day,
plus 100 practice/quiz submissions. Failed attempts also count. Saved lectures
are limited to 60,000 readable characters and the library lists the newest 100.
Generation results are still held in the browser for the current visit, except
saved quizzes and practice sessions. Scaling is configured for zero idle
instances and one maximum instance; these settings are not a monetary cap.
