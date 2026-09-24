// This library never sends document bytes or extracted text to a server.
const DATABASE = 'lexicon-device-library-v1'
const STORE = 'materials'
export const MAX_FILE_BYTES = 25 * 1024 * 1024
const MAX_LIBRARY_BYTES = 100 * 1024 * 1024

function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(Error('Your browser could not open the local library. Check its storage settings.'))
    request.onblocked = () => reject(Error('Close other Lexicon tabs, then try again.'))
  })
}
async function transaction(mode, run) {
  const db = await database()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      let value
      run(tx.objectStore(STORE), result => { value = result })
      tx.oncomplete = () => resolve(value)
      tx.onabort = tx.onerror = () => reject(Error(tx.error?.name === 'QuotaExceededError' ? 'Your browser storage is full. Remove a lecture or free some space, then retry.' : 'Your browser could not save this change. Please try again.'))
    })
  } finally { db.close() }
}
function metadata({ file: _file, source_text: _text, ...item }) { return item }
export async function listDocuments() {
  return transaction('readonly', (store, done) => {
    const request = store.openCursor(); const items = []
    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) { items.push(metadata(cursor.value)); cursor.continue() }
      else done(items.sort((a,b) => b.created_at.localeCompare(a.created_at)))
    }
  })
}
export async function getDocument(id) {
  const item = await transaction('readonly', (store, done) => { const request = store.get(id); request.onsuccess = () => done(request.result) })
  if (!item) throw Error('This lecture is no longer in your browser library. Upload it again.')
  return item
}
export async function removeDocument(id) {
  return transaction('readwrite', store => store.delete(id))
}
export function validateDocument(file) {
  if (!file || !/\.(pdf|txt)$/i.test(file.name)) throw Error('Choose a pdf or utf-8 txt file.')
  if (!file.size) throw Error('This file is empty. Choose another document.')
  if (file.size > MAX_FILE_BYTES) throw Error('Choose a document that is 25 megabytes or smaller.')
}
export async function saveDocument(file, onProgress = () => {}) {
  validateDocument(file)
  onProgress('Reading your document…')
  let source_text = '', unit_count = 1
  if (/\.txt$/i.test(file.name)) {
    try { source_text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer()) }
    catch { throw Error('This text file is not utf-8. Save it as utf-8 and try again.') }
  } else {
    const pdfjs = await import('pdfjs-dist')
    const { default: worker } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    pdfjs.GlobalWorkerOptions.workerSrc = worker
    const task = pdfjs.getDocument({ data: await file.arrayBuffer(), isEvalSupported: false })
    try {
      const pdf = await task.promise
      unit_count = pdf.numPages
      if (unit_count > 500) throw Error('This pdf has more than 500 pages. Split it into smaller lectures first.')
      for (let pageNumber = 1; pageNumber <= unit_count; pageNumber++) {
        onProgress(`Reading page ${pageNumber} of ${unit_count}…`)
        const page = await pdf.getPage(pageNumber)
        const content = await page.getTextContent()
        source_text += content.items.filter(item => 'str' in item).map(item => item.str + (item.hasEOL ? '\n' : ' ')).join('') + '\n\n'
        page.cleanup()
        if (source_text.length > 2_000_000) throw Error('This document contains too much text. Split it into smaller lectures first.')
      }
    } catch (error) {
      if (error.name === 'PasswordException') throw Error('This pdf is password-protected. Upload an unlocked copy.')
      if (error.name === 'InvalidPDFException') throw Error('This file could not be read as a pdf. Try exporting it again.')
      throw error
    } finally { await task.destroy() }
  }
  if (source_text.length > 2_000_000) throw Error('This document contains too much text. Split it into smaller lectures first.')
  source_text = source_text.trim()
  const item = { id: crypto.randomUUID(), filename: file.name, created_at: new Date().toISOString(), unit_count, character_count: source_text.length, size: file.size, storage_bytes: file.size + source_text.length * 2, type: /\.pdf$/i.test(file.name) ? 'pdf' : 'txt', file, source_text }
  onProgress('Saving to this browser…')
  // Check the cap and write in one transaction, including uploads from other tabs.
  await transaction('readwrite', (store, done) => {
    let total = 0
    const request = store.openCursor()
    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) { total += cursor.value.storage_bytes || cursor.value.size; cursor.continue() }
      else if (total + item.storage_bytes > MAX_LIBRARY_BYTES) done(false)
      else { store.put(item); done(true) }
    }
  }).then(saved => { if (!saved) throw Error('Your local library has reached its 100-megabyte limit. Remove an older lecture before adding this one.') })
  return metadata(item)
}
