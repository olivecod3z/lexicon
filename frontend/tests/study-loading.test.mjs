import { after, afterEach, before, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { act, createElement, StrictMode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'

let server
let StudyLoading
let dom, createRoot, root, container
let reduced, playResult, playCalls, timers, preferenceListeners
before(async () => {
  dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true, url: 'https://lexycon.test/' })
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  ;({ createRoot } = await import('react-dom/client'))
  window.matchMedia = () => ({
    get matches() { return reduced },
    addEventListener: (_, callback) => preferenceListeners.add(callback),
    removeEventListener: (_, callback) => preferenceListeners.delete(callback),
  })
  window.HTMLMediaElement.prototype.play = function () { playCalls.push(this); return playResult() }
  window.HTMLMediaElement.prototype.pause = function () {}
  window.HTMLElement.prototype.scrollIntoView = function () {}
  window.setTimeout = (callback, delay) => { const id = Symbol(); timers.set(id, { callback, delay }); return id }
  window.clearTimeout = id => timers.delete(id)
  server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('..', import.meta.url)),
    plugins: [{
      name: 'isolated-startup-services',
      enforce: 'pre',
      resolveId(id) {
        if (id === 'firebase/auth' || id === '/__test_auth.js') return '\0test-auth'
        if (/^\.\.?\/firebase$/.test(id)) return '\0test-firebase'
        if (/^\.\.?\/api$/.test(id)) return '\0test-api'
      },
      load(id) {
        if (id === '\0test-firebase') return 'export const auth = { currentUser: null };'
        if (id === '\0test-api') return 'export const api = path => globalThis.__startupHarness.api(path);'
        if (id === '\0test-auth') return `
          export class GoogleAuthProvider {}
          export function onAuthStateChanged(auth, callback) {
            globalThis.__startupHarness.emitAuth = callback;
            return () => { globalThis.__startupHarness.emitAuth = null; };
          }
          const unused = () => { throw new Error('No live authentication in this test'); };
          export { unused as createUserWithEmailAndPassword, unused as sendPasswordResetEmail,
            unused as signInWithEmailAndPassword, unused as signInWithPopup, unused as signOut,
            unused as reload, unused as sendEmailVerification };
        `
      },
    }, react()],
    resolve: { alias: [{ find: 'firebase/auth', replacement: '/__test_auth.js' }] },
    server: { middlewareMode: true, watch: null },
    appType: 'custom',
    logLevel: 'silent',
  })
  ;({ default: StudyLoading } = await server.ssrLoadModule('/src/components/StudyLoading.jsx'))
})
beforeEach(() => {
  reduced = false
  playResult = () => Promise.resolve()
  playCalls = []
  timers = new Map()
  preferenceListeners = new Set()
  container = document.createElement('div')
  document.body.append(container)
})
afterEach(async () => {
  if (root) await act(async () => root.unmount())
  root = null
  container.remove()
  assert.equal(timers.size, 0, 'playback deadlines must be cleaned up')
  assert.equal(preferenceListeners.size, 0, 'motion listeners must be cleaned up')
})
after(async () => { await server?.close(); dom?.window.close() })

async function render(active = true, children = createElement('button', null, 'Open lecture')) {
  root ||= createRoot(container)
  const fallback = createElement('p', { 'data-testid': 'pending', role: 'status' }, 'Loading your library...')
  await act(async () => root.render(createElement(StudyLoading, { active, fallback }, children)))
}
async function dispatch(target, type) {
  await act(async () => target.dispatchEvent(new window.Event(type, { bubbles: true })))
}

test('loading screen announces one status and hides decorative artwork', () => {
  const html = renderToStaticMarkup(createElement(StudyLoading))
  assert.equal((html.match(/role="status"/g) || []).length, 1)
  assert.match(html, /Opening your study space/)
  assert.match(html, /class="study-loading__emblem" aria-hidden="true"/)
  assert.match(html, /aria-live="polite" aria-atomic="true"/)
  assert.match(html, /class="study-loading__poster"[^>]*alt=""[^>]*width="960" height="960"/)
  assert.match(html, /lexycon-study-unit/)
  assert.doesNotMatch(html, /lexycon-study-seal/)
  // The first paint is the small unit, never a flash of the completed emblem.
  assert.doesNotMatch(html, /<(button|a|video|canvas)\b/)
})

test('redirects can reuse the loader with a truthful status message', () => {
  const html = renderToStaticMarkup(createElement(StudyLoading, { message: 'Opening your Lexycon dashboard...' }))
  assert.match(html, /Opening your Lexycon dashboard\.\.\./)
  assert.doesNotMatch(html, /Opening your study space/)
})

test('an already-ready screen does not add an intro', () => {
  const html = renderToStaticMarkup(createElement(StudyLoading, { active: false }, createElement('button', null, 'Open lecture')))
  assert.match(html, /<button>Open lecture<\/button>/)
  assert.doesNotMatch(html, /hidden=|inert=|<video|<main/)
})

test('startup children mount behind a hidden, inert boundary so their loading effects can run', () => {
  const html = renderToStaticMarkup(createElement(StudyLoading, { active: true }, createElement('button', null, 'Open lecture')))
  assert.match(html, /hidden="" inert="" aria-hidden="true"/)
  assert.match(html, /Open lecture/)
  assert.match(html, /Opening your study space/)
})

test('loading animation respects reduced motion and keeps a bounded media-failure deadline', async () => {
  const css = await readFile(new URL('../src/components/StudyLoading.css', import.meta.url), 'utf8')
  const component = await readFile(new URL('../src/components/StudyLoading.jsx', import.meta.url), 'utf8')
  const animatedRules = css.match(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n\}/)?.[0]
  assert.ok(animatedRules)
  assert.equal((animatedRules.match(/animation:/g) || []).length, (css.match(/animation:/g) || []).length)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?display: none/)
  assert.match(component, /window\.matchMedia\('\(prefers-reduced-motion: reduce\)'\)/)
  assert.match(component, /motionAllowed && !showStill && <video/)
  assert.match(component, /setTimeout\(\(\) => finish\('fallback'\), 1200\)/)
  assert.match(component, /setTimeout\(\(\) => finish\('fallback'\), 2500\)/)
  assert.doesNotMatch(component, /setInterval|fetch\(/)
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

test('slow media starts on the unit frame, with silent inline playback and no controls', async () => {
  playResult = () => new Promise(() => {})
  await render()
  const video = container.querySelector('video')
  assert.match(video.poster, /lexycon-study-unit/)
  assert.match(container.querySelector('img').src, /lexycon-study-unit/)
  assert.equal(video.muted, true)
  assert.equal(video.defaultMuted, true)
  assert.equal(video.playsInline, true)
  assert.equal(video.controls, false)
  assert.equal(video.tabIndex, -1)
  assert.equal(container.querySelector('main').dataset.phase, 'waiting')
})

test('auth-to-library handoff and early readiness never restart or cut off the same build-up', async () => {
  await render(true, createElement('p', null, 'Checking sign-in'))
  const video = container.querySelector('video')
  await render(true, createElement('p', null, 'Loading library'))
  await render(false)
  assert.equal(container.querySelector('video'), video)
  assert.equal(playCalls.length, 1)
  assert.equal(container.querySelector('.study-loading__destination').hidden, true)
  assert.equal(container.querySelector('main').classList.contains('is-leaving'), false)
  await dispatch(video, 'ended')
  assert.equal(container.querySelector('video'), video, 'hold the actual final video frame')
  assert.equal(video.classList.contains('is-playing'), true)
  assert.equal(container.querySelector('main').dataset.phase, 'complete')
  assert.equal(container.querySelector('.study-loading__destination').hidden, false)
  await dispatch(container.querySelector('main'), 'animationend')
  assert.equal(container.querySelector('main'), null)
  assert.equal(container.querySelector('button').textContent, 'Open lecture')
})

test('a slow API cannot hold the completed emblem on screen', async () => {
  await render()
  assert.equal(container.querySelector('[data-testid="pending"]'), null)
  const video = container.querySelector('video')
  await dispatch(video, 'ended')
  await dispatch(video, 'canplay')
  assert.equal(playCalls.length, 1)
  assert.equal(video.loop, false)
  assert.equal(container.querySelector('.study-loading__destination').hidden, true)
  assert.equal(container.querySelector('main').classList.contains('is-leaving'), true)
  assert.ok(container.querySelector('[data-testid="pending"]'))
  assert.equal(timers.size, 0, 'there is no extra hold after assembly')
  await dispatch(container.querySelector('main'), 'animationend')
  assert.equal(container.querySelector('main'), null, 'intro leaves while the API is still pending')
  assert.ok(container.querySelector('[data-testid="pending"]'))
  await render(false)
  assert.equal(container.querySelector('[data-testid="pending"]'), null)
  assert.equal(container.querySelector('.study-loading__destination').hidden, false)
  assert.equal(container.querySelector('video'), null)
})

test('retries during and after the exit use the page without replaying the intro', async () => {
  await render()
  const previous = container.querySelector('video')
  await dispatch(previous, 'ended')
  await render(false)
  await render(true)
  assert.equal(container.querySelector('video'), previous)
  assert.equal(container.querySelector('main').classList.contains('is-leaving'), true)
  assert.equal(timers.size, 0)
  await dispatch(container.querySelector('main'), 'animationend')
  await render(false)
  await render(true)
  assert.equal(container.querySelector('video'), null)
  assert.equal(playCalls.length, 1)
  assert.ok(container.querySelector('[data-testid="pending"]'))
  await render(false)
  assert.equal(container.querySelector('.study-loading__destination').hidden, false)
})

test('blocked mobile autoplay falls back cleanly and allows the ready screen through', async () => {
  playResult = () => Promise.reject(new DOMException('Autoplay blocked', 'NotAllowedError'))
  await render()
  assert.equal(container.querySelector('video'), null)
  assert.match(container.querySelector('img').src, /lexycon-study-seal/)
  await render(false)
  assert.equal(container.querySelector('main').classList.contains('is-leaving'), true)
  assert.equal(container.querySelector('.study-loading__destination').hidden, false)
})

test('media errors immediately release the intro even while data is pending', async () => {
  await render()
  const video = container.querySelector('video')
  await dispatch(video, 'error')
  assert.equal(container.querySelector('main').dataset.phase, 'fallback')
  assert.equal(container.querySelector('main').classList.contains('is-leaving'), true)
  assert.ok(container.querySelector('[data-testid="pending"]'))
  await dispatch(container.querySelector('main'), 'animationend')
  assert.equal(container.querySelector('main'), null)
})

test('a missing playback start cannot trap the page', async () => {
  playResult = () => new Promise(() => {})
  await render(true)
  const deadline = [...timers.values()][0]
  assert.equal(deadline.delay, 1200)
  await act(async () => deadline.callback())
  assert.equal(container.querySelector('main').classList.contains('is-leaving'), true)
  assert.ok(container.querySelector('[data-testid="pending"]'))
})

test('a stalled video releases the intro at the playback deadline', async () => {
  await render(true)
  const deadline = [...timers.values()][0]
  assert.equal(deadline.delay, 2500)
  await act(async () => deadline.callback())
  assert.equal(container.querySelector('main').classList.contains('is-leaving'), true)
  await dispatch(container.querySelector('main'), 'animationend')
  assert.equal(container.querySelector('main'), null)
  assert.ok(container.querySelector('[data-testid="pending"]'))
})

test('reduced motion skips playback and the visual wait, including live preference changes', async () => {
  reduced = true
  await render()
  assert.equal(container.querySelector('video'), null)
  assert.equal(playCalls.length, 0)
  assert.equal(container.querySelector('main'), null)
  assert.ok(container.querySelector('[data-testid="pending"]'))
  await render(false)
  assert.equal(container.querySelector('main'), null)
  reduced = false
  await act(async () => { for (const listener of preferenceListeners) listener() })
  assert.equal(container.querySelector('main'), null, 'enabling motion must not replay a dismissed intro')
  await render(true)
  assert.equal(container.querySelector('video'), null)
  assert.ok(container.querySelector('[data-testid="pending"]'))
  reduced = true
  await act(async () => { for (const listener of preferenceListeners) listener() })
  await render(false)
  assert.equal(container.querySelector('main'), null)
})

test('enabling reduced motion during the build-up moves straight to the pending page', async () => {
  await render(true)
  assert.ok(container.querySelector('video'))
  reduced = true
  await act(async () => { for (const listener of preferenceListeners) listener() })
  assert.equal(container.querySelector('main'), null)
  assert.ok(container.querySelector('[data-testid="pending"]'))
  assert.equal(timers.size, 0)
})

test('StrictMode leaves only one video and one bounded playback deadline', async () => {
  root = createRoot(container)
  await act(async () => root.render(createElement(StrictMode, null, createElement(StudyLoading))))
  assert.equal(container.querySelectorAll('video').length, 1)
  assert.equal(new Set(playCalls).size, 1)
  assert.equal(timers.size, 1)
  assert.equal([...timers.values()][0].delay, 2500, 'the playing clip gets its full duration after download')
  await dispatch(container.querySelector('video'), 'ended')
  assert.equal(timers.size, 0)
  assert.equal(container.querySelector('main').dataset.phase, 'complete')
})

test('the app has one loading boundary, not separate auth and library video instances', async () => {
  const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8')
  const auth = await readFile(new URL('../src/components/AuthGate.jsx', import.meta.url), 'utf8')
  assert.equal((app.match(/<StudyLoading\b/g) || []).length, 1)
  assert.doesNotMatch(auth, /<StudyLoading\b/)
  assert.match(app, /<AuthGate onStatusChange=\{setAuthStatus\}><StudyDashboard onLoadingChange=\{setLibraryLoading\}/)
})

test('real App startup keeps one video across mocked authentication and all five library requests', async () => {
  const pending = new Map()
  globalThis.__startupHarness = { api: path => new Promise(resolve => pending.set(path, resolve)) }
  const { default: App } = await server.ssrLoadModule('/src/App.jsx')
  root = createRoot(container)
  await act(async () => root.render(createElement(App)))
  const video = container.querySelector('video')
  assert.ok(video)
  await act(async () => globalThis.__startupHarness.emitAuth({ uid: 'test-user' }))
  assert.equal(container.querySelector('video'), video)
  assert.equal(pending.size, 5)
  await act(async () => {
    pending.get('/account/profile')({ profile: null })
    pending.get('/courses')([])
    pending.get('/materials')([])
    pending.get('/reviews/today')([])
    pending.get('/reviews/progress')({ reviewed_today: 0, current_streak: 0 })
  })
  assert.equal(container.querySelector('video'), video)
  assert.equal(playCalls.length, 1)
  assert.equal(container.querySelector('.study-loading__destination').hidden, true)
  await dispatch(video, 'ended')
  assert.equal(container.querySelector('.study-loading__destination').hidden, false)
  await dispatch(container.querySelector('.study-loading'), 'animationend')
  assert.equal(container.querySelector('.study-loading'), null)
  assert.ok(container.querySelector('input'), 'the real onboarding screen is available')
})

test('real App reveals a nonblank page before slow authentication and library requests finish', async () => {
  const pending = new Map()
  globalThis.__startupHarness = { api: path => new Promise(resolve => pending.set(path, resolve)) }
  const { default: App } = await server.ssrLoadModule('/src/App.jsx')
  root = createRoot(container)
  await act(async () => root.render(createElement(App)))
  await dispatch(container.querySelector('video'), 'ended')
  assert.match(container.querySelector('.study-pending [role="status"]').textContent, /Connecting your account/)
  await dispatch(container.querySelector('.study-loading'), 'animationend')
  assert.equal(container.querySelector('.study-loading'), null)
  assert.ok(container.querySelector('.study-pending main'))
  await act(async () => globalThis.__startupHarness.emitAuth({ uid: 'test-user' }))
  assert.equal(container.querySelector('video'), null)
  assert.equal(pending.size, 5)
  assert.match(container.querySelector('.study-pending [role="status"]').textContent, /Loading your library/)
  assert.equal(container.querySelector('input'), null, 'onboarding never flashes before profile loading')
  await act(async () => {
    pending.get('/account/profile')({ profile: null })
    pending.get('/courses')([])
    pending.get('/materials')([])
    pending.get('/reviews/today')([])
    pending.get('/reviews/progress')({ reviewed_today: 0, current_streak: 0 })
  })
  assert.equal(container.querySelector('.study-pending'), null)
  assert.equal(container.querySelector('.study-loading__destination').hidden, false)
  assert.ok(container.querySelector('input'), 'the real onboarding replaces the pending layout')
  assert.equal(playCalls.length, 1)
})

test('signed-out visitors reach sign-in without waiting for any library requests', async () => {
  let requests = 0
  globalThis.__startupHarness = { api: () => { requests += 1 } }
  const { default: App } = await server.ssrLoadModule('/src/App.jsx')
  root = createRoot(container)
  await act(async () => root.render(createElement(App)))
  await dispatch(container.querySelector('video'), 'ended')
  await dispatch(container.querySelector('.study-loading'), 'animationend')
  await act(async () => globalThis.__startupHarness.emitAuth(null))
  assert.equal(container.querySelector('.study-pending'), null)
  assert.equal(container.querySelector('.study-loading'), null)
  assert.equal(container.querySelector('.study-loading__destination').hidden, false)
  assert.ok(container.querySelector('input[type="email"]'))
  assert.equal(requests, 0)
})
