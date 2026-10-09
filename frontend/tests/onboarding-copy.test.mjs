import { after, afterEach, before, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { act, createElement } from 'react'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'

let dom, server, Onboarding, createRoot, root, container, timers
const profile = { name: 'Ada', institution: '', stage: 'University', level: '100 Level', goals: [], minutes: 20, course: 'Biology', courseCode: '', color: 'green' }

before(async () => {
  dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://lexycon.test/' })
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  window.matchMedia = () => ({ matches: true })
  window.setTimeout = callback => { const id = Symbol(); timers.set(id, callback); return id }
  window.clearTimeout = id => timers.delete(id)
  ;({ createRoot } = await import('react-dom/client'))
  server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('..', import.meta.url)),
    plugins: [{
      name: 'isolated-onboarding-account',
      enforce: 'pre',
      resolveId(id) { if (id === '../firebase') return '\0test-firebase' },
      load(id) { if (id === '\0test-firebase') return 'export const auth = { currentUser: { uid: "copy-test" } };' },
    }, react()],
    server: { middlewareMode: true, watch: null },
    appType: 'custom',
    logLevel: 'silent',
  })
  ;({ default: Onboarding } = await server.ssrLoadModule('/src/components/OriginalOnboarding.tsx'))
})
beforeEach(() => {
  timers = new Map()
  window.localStorage.clear()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  assert.equal(timers.size, 0)
})
after(async () => { await server?.close(); dom?.window.close() })

async function render(props = {}) {
  await act(async () => root.render(createElement(Onboarding, { onSave: async () => {}, onOpen: () => {}, ...props })))
}
async function submit() {
  await act(async () => container.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })))
}

test('the first step keeps labels, progress and navigation without decorative copy', async () => {
  await render()
  assert.equal(container.querySelector('h1').textContent, 'First, a little about you.')
  assert.equal(container.querySelector('.setup-step-meta').textContent, 'Step 1 of 3')
  assert.equal(container.querySelectorAll('.setup-steps li').length, 3)
  assert.equal(container.querySelector('.setup-steps [aria-current="step"]').textContent, '01A little about you')
  assert.ok(container.querySelector('label[for="setup-name"]'))
  assert.ok(container.querySelector('label[for="setup-level"]'))
  assert.match(container.querySelector('label[for="setup-institution"]').textContent, /Optional/)
  assert.equal(container.querySelector('.setup-actions').textContent, 'Continue')
  assert.equal(container.querySelector('.setup-save-note'), null)
  assert.equal(container.querySelector('.setup-intro'), null)
  assert.equal(container.querySelector('.setup-landscape').textContent.trim(), '')
  assert.equal(container.querySelector('.setup-header-label, .setup-eyebrow, .setup-steps small, .setup-action-note, .setup-sidebar-footer, .setup-sidebar h2'), null)
})

test('required-field feedback remains visible', async () => {
  await render()
  await submit()
  assert.equal(container.querySelector('[role="alert"]').textContent, 'Add your name and select your degree level.')
  assert.equal(container.querySelector('#setup-name').getAttribute('aria-invalid'), 'true')
  assert.equal(container.querySelector('.setup-step-meta').textContent, 'Step 1 of 3')
})

test('the simplified flow preserves selections, saving and the dashboard action', async () => {
  let saved, opened = false
  await render({ savedProfile: profile, onSave: async value => { saved = value }, onOpen: () => { opened = true } })
  await submit()
  assert.equal(container.querySelector('.setup-step-meta').textContent, 'Step 2 of 3')
  assert.equal(container.querySelectorAll('.setup-goal').length, 4)
  assert.equal(container.querySelector('.setup-goal small, .setup-pace-options small'), null)
  assert.match(container.querySelector('.setup-goals legend').textContent, /Choose all that fit/)
  await submit()
  assert.equal(container.querySelector('[role="alert"]').textContent, 'Choose at least one study goal.')
  await act(async () => container.querySelector('#goal-understand').click())
  await act(async () => container.querySelector('input[name="minutes"][value="30"]').click())
  await submit()
  assert.equal(container.querySelector('.setup-step-meta').textContent, 'Step 3 of 3')
  assert.equal(container.querySelector('.setup-intro').textContent, 'Your free plan includes one course.')
  assert.equal(container.querySelector('.setup-preview-code'), null)
  assert.equal(container.querySelector('.setup-course-preview h2').textContent, 'Biology')
  await submit()
  assert.deepEqual(saved, { ...profile, goals: ['understand'], minutes: 30 })
  assert.equal(container.querySelector('h1').textContent, 'All set, Ada.')
  assert.equal(container.querySelector('.setup-summary').children.length, 4)
  assert.equal(container.querySelector('.setup-next, .setup-intro, .setup-save-note'), null)
  await act(async () => container.querySelector('.setup-complete-action').click())
  assert.equal(opened, true)
})

test('a failed account save still shows its error instead of completing', async () => {
  window.localStorage.setItem('lexycon.original-onboarding.copy-test', JSON.stringify({ version: 1, step: 2, complete: false, profile: { ...profile, goals: ['understand'] } }))
  await render({ onSave: async () => { throw Error('Please reconnect and try again.') } })
  await submit()
  assert.equal(container.querySelector('[role="alert"]').textContent, 'Please reconnect and try again.')
  assert.equal(container.querySelector('.setup-complete-action'), null)
  assert.equal(container.querySelector('button[type="submit"]').disabled, false)
})

test('both entry points omit filler but retain browser-save warnings', async () => {
  for (const file of ['../src/components/OriginalOnboarding.tsx', '../../landing/app/onboarding/onboarding.tsx']) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /A little clearer, every day|Make yourself at home|Your kind of pace|The basics, on your terms|Small steps|Brighter lightbulb moments|A little progress is still progress|Your study setup|Every study space starts with a name|A couple of minutes, all yours|A good beginning|A fresh start, at your own pace|A quick check-in|Ready for a fresh start|Your completed profile and course|Your preferences stay in this browser/)
    assert.match(source, /saveError && <p className="setup-save-note has-error" role="status"/)
    assert.match(source, /Optional/)
    assert.match(source, /role="alert"/)
  }
})
