import { useEffect, useState } from 'react'
import { reload, sendEmailVerification } from 'firebase/auth'
import { auth } from '../firebase'
import { api } from '../api'

export default function AccountAllowance({ refreshKey, onPlanChange }) {
  const [usage, setUsage] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [verified, setVerified] = useState(auth.currentUser?.emailVerified)
  useEffect(() => {
    let active = true
    api('/account/usage').then(data => {
      if (active) {
        setUsage(data); setError('')
        onPlanChange?.(['Free', 'Student', 'Pro'].includes(data.plan) ? data.plan : null)
      }
    }).catch(() => {
      if (active) {
        setError('Your allowance is temporarily unavailable. Limits are still checked when you create resources.')
        onPlanChange?.(null)
      }
    })
    return () => { active = false }
  }, [refreshKey, onPlanChange])
  async function verify(check) {
    if (busy || !auth.currentUser) return
    setBusy(true); setMessage('')
    try {
      if (check) {
        await reload(auth.currentUser)
        await auth.currentUser.getIdToken(true)
        setVerified(auth.currentUser.emailVerified)
        setMessage(auth.currentUser.emailVerified ? 'Email verified. You can create your study resources.' : 'Open the verification link in your email, then check again.')
      } else {
        await sendEmailVerification(auth.currentUser)
        setMessage('Verification email sent. Check your inbox and spam folder.')
      }
    } catch { setMessage('Could not complete email verification. Please try again shortly.') }
    finally { setBusy(false) }
  }
  return <section className="allowance-card" aria-label="Your plan and allowance">
    <div><strong>{usage?.plan || 'Your plan'}{usage?.packs_limit != null && ` · ${Math.max(0, usage.packs_limit - usage.packs_used)} of ${usage.packs_limit} learning packs left`}</strong>
      <p>One lecture’s notes, flashcards and practice count as one pack. Reopen saved resources without using another pack.</p>
      {usage?.resets_at && <p>Allowance resets {new Date(usage.resets_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })} (utc). Student and Pro subscriptions are not open yet.</p>}
      {error && <p role="status">{error}</p>}
    </div>
    <a className="text-button" href="https://lexycon.site/#pricing" target="_blank" rel="noreferrer">Explore planned packages ↗</a>
    {!verified && <div className="email-verification"><p>Verify your email to create ai resources. Your saved work remains available.</p><button className="button secondary" disabled={busy} onClick={() => verify(false)}>Send verification email</button> <button className="text-button" disabled={busy} onClick={() => verify(true)}>I’ve verified my email</button></div>}
    {message && <p role="status">{message}</p>}
  </section>
}
