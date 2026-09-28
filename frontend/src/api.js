export async function api(path, options) {
  let response
  try { response = await fetch(path, options) }
  catch { throw Error('Cannot reach Lexicon. Check that the local API is running, then try again.') }
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw Error(typeof data?.detail === 'string' ? data.detail : 'Lexicon could not complete this request. Please try again.')
  }
  if (!data) throw Error('Lexicon returned an unexpected response. Please try again.')
  return data
}
