import { auth } from './firebase'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : 'https://lexicon-api-600311691439.europe-west1.run.app')

export async function api(path, options) {
  let response
  const token = await auth.currentUser?.getIdToken()
  if (!token) throw Error('Sign in to continue.')
  const headers = new Headers(options?.headers)
  headers.set('Authorization', `Bearer ${token}`)
  try { response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers }) }
  catch { throw Error('Cannot reach Lexicon. Please try again in a moment.') }
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw Error(typeof data?.detail === 'string' ? data.detail : 'Lexicon could not complete this request. Please try again.')
  }
  if (!data) throw Error('Lexicon returned an unexpected response. Please try again.')
  return data
}
