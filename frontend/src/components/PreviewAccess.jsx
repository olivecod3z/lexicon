import { useState } from 'react'

export default function PreviewAccess({ children }) {
  const [allowed, setAllowed] = useState(false)
  const [code, setCode] = useState(() => sessionStorage.getItem('lexicon-preview-access') || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (!import.meta.env.VITE_API_BASE_URL || allowed) return children
  async function unlock(event) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/materials`, { headers: { 'X-Lexicon-Access': code.trim() } })
      if (response.status === 401) throw Error('That access code is not correct. Please try again.')
      if (!response.ok) throw Error('The study service is temporarily unavailable. Please try again.')
      sessionStorage.setItem('lexicon-preview-access', code.trim())
      setAllowed(true)
    } catch (err) { setError(err.message || 'Could not connect. Please try again.') }
    finally { setBusy(false) }
  }
  return <main style={{ minHeight:'100vh', display:'grid', placeItems:'center', padding:24 }}>
    <form onSubmit={unlock} style={{ width:'100%', maxWidth:420, background:'#fff', padding:32, borderRadius:20, border:'1px solid #dce5d7' }}>
      <a href="/" style={{ color:'#283d23', fontSize:30, fontWeight:700 }}>lexicon.</a>
      <h1 style={{ fontSize:24, marginTop:24 }}>Your private study workspace</h1>
      <p>This early preview is for the owner. Enter your access code to upload lectures and create study materials.</p>
      <label htmlFor="preview-code">Access code</label>
      <input id="preview-code" type="password" autoComplete="current-password" required value={code} onChange={event => setCode(event.target.value)} style={{ display:'block', width:'100%', padding:12, margin:'8px 0 20px', border:'1px solid #a4b59a', borderRadius:8 }} />
      {error && <p role="alert">{error}</p>}
      <button className="button primary" disabled={busy}>{busy ? 'Connecting…' : 'Open my workspace'}</button>
      <p style={{ fontSize:12, marginTop:20 }}>Anyone with this code can access this shared preview library. Keep it private.</p>
    </form>
  </main>
}
