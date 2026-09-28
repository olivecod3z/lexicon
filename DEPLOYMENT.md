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
npm.cmd run build
Pop-Location
New-Item -ItemType Directory -Force hosting-dist
Copy-Item landing/out/* hosting-dist -Recurse -Force
New-Item -ItemType Directory -Force hosting-dist/dashboard
Copy-Item frontend/dist/* hosting-dist/dashboard -Recurse -Force
firebase deploy --only hosting --project lexicon-aguet-20260928
```

Use a fresh hosting-dist folder when rebuilding to avoid retaining obsolete assets.

This deployment publishes the website only. The Python API is not deployed or
routed by the current Firebase configuration. Uploads and AI generation cannot
work online until that backend is connected. They still use the existing local
backend during local development. No paid backend services are enabled here.