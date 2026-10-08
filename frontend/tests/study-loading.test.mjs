import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'

let server
let StudyLoading
before(async () => {
  server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('..', import.meta.url)),
    plugins: [react()],
    server: { middlewareMode: true, watch: null },
    appType: 'custom',
    logLevel: 'silent',
  })
  ;({ default: StudyLoading } = await server.ssrLoadModule('/src/components/StudyLoading.jsx'))
})
after(async () => { await server?.close() })

test('loading screen announces one status and hides decorative artwork', () => {
  const html = renderToStaticMarkup(createElement(StudyLoading))
  assert.equal((html.match(/role="status"/g) || []).length, 1)
  assert.match(html, /Opening your study space/)
  assert.match(html, /class="study-loading__emblem" aria-hidden="true"/)
  assert.match(html, /aria-live="polite" aria-atomic="true"/)
  assert.match(html, /class="study-loading__poster"[^>]*alt=""[^>]*width="960" height="960"/)
  // The server render is a complete still; video waits for the motion preference.
  assert.doesNotMatch(html, /<(button|a|video|canvas)\b/)
})

test('redirects can reuse the loader with a truthful status message', () => {
  const html = renderToStaticMarkup(createElement(StudyLoading, { message: 'Opening your Lexycon dashboard...' }))
  assert.match(html, /Opening your Lexycon dashboard\.\.\./)
  assert.doesNotMatch(html, /Opening your study space/)
})

test('ready content is immediately available without waiting for video completion', () => {
  const html = renderToStaticMarkup(createElement(StudyLoading, { active: false }, createElement('button', null, 'Open lecture')))
  assert.equal(html, '<button>Open lecture</button>')
})

test('pending content does not mount before its existing loading state is ready', () => {
  const html = renderToStaticMarkup(createElement(StudyLoading, { active: true }, createElement('button', null, 'Open lecture')))
  assert.doesNotMatch(html, /Open lecture/)
  assert.match(html, /Opening your study space/)
})

test('loading animation respects reduced motion and introduces no waiting timer', async () => {
  const css = await readFile(new URL('../src/components/StudyLoading.css', import.meta.url), 'utf8')
  const component = await readFile(new URL('../src/components/StudyLoading.jsx', import.meta.url), 'utf8')
  const animatedRules = css.match(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n\}/)?.[0]
  assert.ok(animatedRules)
  assert.equal((animatedRules.match(/animation:/g) || []).length, (css.match(/animation:/g) || []).length)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?display: none/)
  assert.match(component, /window\.matchMedia\('\(prefers-reduced-motion: reduce\)'\)/)
  assert.match(component, /motionAllowed && <video/)
  assert.doesNotMatch(component, /setTimeout|setInterval|fetch\(/)
})

test('media fits portrait, landscape, and desktop without cropping or layout shifts', async () => {
  const css = await readFile(new URL('../src/components/StudyLoading.css', import.meta.url), 'utf8')
  assert.match(css, /width: min\(100%, 560px\)/)
  assert.match(css, /width: min\(100%, 62svh\)/)
  assert.match(css, /aspect-ratio: 1/)
  assert.match(css, /object-fit: contain/)
  assert.match(css, /orientation: landscape/)
  assert.match(css, /env\(safe-area-inset-bottom\)/)
})

test('mobile video is silent, inline, control-free, and has a playback fallback', async () => {
  const component = await readFile(new URL('../src/components/StudyLoading.jsx', import.meta.url), 'utf8')
  assert.match(component, /autoPlay muted playsInline controls=\{false\}/)
  assert.match(component, /disablePictureInPicture disableRemotePlayback tabIndex=\{-1\}/)
  assert.match(component, /player\.defaultMuted = true/)
  assert.match(component, /player\.play\(\)\.catch/)
  assert.match(component, /onPlaying=\{\(\) => setPlaying\(true\)\}/)
  assert.match(component, /onError=\{\(\) => setPlaying\(false\)\}/)
  assert.match(component, /onEnded=\{\(\) => setPlaying\(false\)\}/)
  assert.match(component, /document\.hidden/)
  assert.match(component, /removeEventListener\('visibilitychange'/)
  assert.match(component, /player\.pause\(\)/)
})
