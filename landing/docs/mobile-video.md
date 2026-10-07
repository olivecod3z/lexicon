# Landing Video

The mobile media files were recovered unchanged from the existing
`lexicon-study-20260923.web.app` deployment on 7 October 2026. They contain
the same 58-second `Lexicon-Final.mp4` replacement already used on the site.
The full-size video and the glossy flip-card artwork are unchanged.

- Desktop fallback: `public/videos/lexicon-story.mp4`, 720 x 1280.
- Mobile fallback: `public/videos/lexicon-story-mobile.mp4`, 540 x 960,
  7,742,712 bytes instead of the desktop file's 25,016,641 bytes.
- Native streaming: `public/videos/lexicon-story-mobile-hls/index.m3u8`
  and all 30 adjacent transport-stream segments.
- Mobile MP4 SHA-256:
  `71d056fa86bf3c5891f143c101175a0a8d76931693bc63c8791b17d51ef233da`.

`app/story-video.tsx` chooses native HLS where supported, otherwise the
appropriate MP4. HLS errors fall back to MP4. The selected source stays
stable when the phone rotates. Media loads near the viewport and plays
muted and inline while visible, loops, and resumes on return. Offscreen
and background playback is suspended. Reduced-motion preferences prevent
autoplay and video downloads. No play or pause controls are added.

HLS playlists use `application/vnd.apple.mpegurl` and segments use
`video/mp2t`. Hosting configuration is owned separately and is not changed
by this frontend update. The MP4 fallback remains available if a host
cannot serve the stream. `tsconfig.json` excludes static assets and build
output so transport-stream `.ts` files are not treated as TypeScript.

Visible branding is **Lexycon**. Existing asset paths and storage keys
intentionally retain `lexicon` so saved work and deployed URLs keep working.

## Verification

Verified the production builds on 7 October 2026:

- Landing static export and dashboard standard/hosting builds pass.
- All 10 existing browser-library and onboarding tests pass.
- Chromium at 320, 390, 430 and 1440 pixels: no horizontal overflow,
  full-bleed card artwork, mouse and keyboard flipping, no playback buttons,
  muted inline autoplay, looping, scroll-away/resume and stable rotation.
- WebKit with the iPhone 13 profile: native HLS autoplay and looping pass.
- Missing HLS playlist: automatic mobile MP4 fallback passes.
- Reduced motion: no video download and instant card flips.
- Get started completes onboarding and hands saved setup to the dashboard
  using the unchanged storage key.

These are automated browser checks, not a test on a physical phone.
Dashboard lint passes with one pre-existing effect/state warning.
Backend code, API behavior and deployment configuration are unchanged.
