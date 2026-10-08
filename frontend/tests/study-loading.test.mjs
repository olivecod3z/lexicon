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
  assert.doesNotMatch(html, /<(button|a|video|canvas)\b/)
})

test('redirects can reuse the loader with a truthful status message', () => {
  const html = renderToStaticMarkup(createElement(StudyLoading, { message: 'Opening your Lexycon dashboard...' }))
  assert.match(html, /Opening your Lexycon dashboard\.\.\./)
  assert.doesNotMatch(html, /Opening your study space/)
})

test('loading animation respects reduced motion and introduces no waiting timer', async () => {
  const css = await readFile(new URL('../src/components/StudyLoading.css', import.meta.url), 'utf8')
  const component = await readFile(new URL('../src/components/StudyLoading.jsx', import.meta.url), 'utf8')
  const animatedRules = css.match(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n\}/)?.[0]
  assert.ok(animatedRules)
  assert.equal((animatedRules.match(/animation:/g) || []).length, (css.match(/animation:/g) || []).length)
  assert.match(css, /stroke-dashoffset: 0/)
  assert.doesNotMatch(component, /setTimeout|setInterval|fetch\(|useEffect|useState/)
})
