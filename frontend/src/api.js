export async function api(path, options) {
  let response
  try { response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}${path}`, {
    ...options,
  }) }
  catch { throw Error('Cannot reach Lexicon. Please try again in a moment.') }
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw Error(typeof data?.detail === 'string' ? data.detail : 'Lexicon could not complete this request. Please try again.')
  }
  if (!data) throw Error('Lexicon returned an unexpected response. Please try again.')
  return data
}
