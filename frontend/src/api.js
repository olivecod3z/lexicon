import * as library from './browser-library'
export const browserLibrary = import.meta.env.VITE_HOSTING_PREVIEW === 'true'

export async function api(path, options) {
  if (browserLibrary) {
    const method = options?.method || 'GET'
    if (path === '/materials' && method === 'GET') return library.listDocuments()
    if (path === '/materials' && method === 'POST') return library.saveDocument(options.body.get('file'), options.onProgress)
    const match = path.match(/^\/materials\/([^/]+)$/)
    if (match && method === 'DELETE') return library.removeDocument(match[1])
    throw Error('Automated study generation is not connected yet. You can read and download your original lecture.')
  }
  let response
  try { response = await fetch(path, options) }
  catch { throw Error('Cannot reach Lexicon. Check that the local service is running, then try again.') }
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw Error(typeof data?.detail === 'string' ? data.detail : 'Lexicon could not complete this request. Please try again.')
  }
  if (!data) throw Error('Lexicon returned an unexpected response. Please try again.')
  return data
}
