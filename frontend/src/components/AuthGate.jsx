import { useEffect, useState } from 'react'
import { GoogleAuthProvider, createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth'
import { auth } from '../firebase'
import Icon from './Icon'
import StudyLoading from './StudyLoading'
import './AuthGate.css'

const friendlyError = error => ({
  'auth/account-exists-with-different-credential': 'This email is already linked to another sign-in method. Sign in with that method instead.',
  'auth/app-not-authorized': 'This Lexycon address is not ready for sign-in yet. Please try again shortly.',
  'auth/email-already-in-use': 'That email already has an account. Sign in instead.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/invalid-credential': 'That email or password is incorrect.',
  'auth/network-request-failed': 'Lexycon could not reach the sign-in service. Check your connection and try again.',
  'auth/operation-not-allowed': 'Email-and-password sign-up is not available yet. Please try Google or contact Lexycon support.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes, then try again.',
  'auth/unauthorized-domain': 'This Lexycon address is not ready for sign-in yet. Please use dashboard.lexycon.site.',
  'auth/user-disabled': 'This account has been disabled. Please contact Lexycon support.',
  'auth/weak-password': 'Choose a password with at least 8 characters.',
}[error.code] || 'Lexycon could not sign you in. Please try again.')

const GoogleMark = () => <svg className="google-mark" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.8 12.2c0-.72-.06-1.23-.2-1.76H12v3.54h5.64c-.11.88-.72 2.2-2.08 3.1l-.02.12 3.03 2.35.21.02c1.93-1.78 3.02-4.4 3.02-7.37Z"/><path fill="#34A853" d="M12 22c2.76 0 5.08-.91 6.78-2.47l-3.23-2.5c-.87.61-2.03 1.04-3.55 1.04a6.16 6.16 0 0 1-5.81-4.26l-.11.01-3.15 2.44-.04.1A10.24 10.24 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.19 13.81A6.2 6.2 0 0 1 5.85 12c0-.63.12-1.24.33-1.81l-.01-.12-3.19-2.48-.1.05A10 10 0 0 0 2 12c0 1.61.39 3.13 1.08 4.36l3.11-2.55Z"/><path fill="#EA4335" d="M12 5.93c1.92 0 3.21.83 3.95 1.52l2.89-2.82C17.07 2.98 14.76 2 12 2a10.24 10.24 0 0 0-9.11 5.64l3.3 2.55A6.16 6.16 0 0 1 12 5.93Z"/></svg>

export default function AuthGate({ children }) {
  const [user, setUser] = useState(undefined)
  const [mode, setMode] = useState('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const isLegacyDashboard = import.meta.env.PROD
    && window.location.hostname === 'lexycon.site'
    && window.location.pathname.startsWith('/dashboard')

  useEffect(() => {
    if (isLegacyDashboard) {
      window.location.replace(`https://dashboard.lexycon.site/${window.location.search}${window.location.hash}`)
      return undefined
    }
    return onAuthStateChanged(auth, setUser)
  }, [isLegacyDashboard])

  if (isLegacyDashboard) return <StudyLoading message="Opening your Lexycon dashboard…" />
  if (user === undefined) return <StudyLoading />
  if (user) return <>{children}</>

  async function run(action) {
    setBusy(true); setError(''); setNotice('')
    try { await action() }
    catch (reason) { setError(friendlyError(reason)) }
    finally { setBusy(false) }
  }
  function submit(event) {
    event.preventDefault()
    if (password.length < 8) return setError('Choose a password with at least 8 characters.')
    const cleanedEmail = email.trim()
    run(() => mode === 'sign-up' ? createUserWithEmailAndPassword(auth, cleanedEmail, password) : signInWithEmailAndPassword(auth, cleanedEmail, password))
  }
  return <main className="auth-page"><section className="auth-card" aria-labelledby="auth-title"><a className="auth-brand" href="/">lexycon.</a><p className="eyebrow">Your private study space</p><h1 id="auth-title">{mode === 'sign-up' ? 'Create your account' : 'Welcome back'}</h1><p className="auth-copy">Save your lectures, study materials, and results securely in your own workspace.</p><button className="auth-google" disabled={busy} onClick={() => run(() => signInWithPopup(auth, new GoogleAuthProvider()))}><GoogleMark />Continue with Google</button><div className="auth-divider"><span>or use email</span></div><form onSubmit={submit}><label>Email<input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} /></label><div className="auth-password-field"><label htmlFor="auth-password">Password</label><div className="auth-password-input"><input id="auth-password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'} minLength="8" required value={password} onChange={event => setPassword(event.target.value)} /><button type="button" className="auth-password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-controls="auth-password" onClick={() => setShowPassword(visible => !visible)}><Icon name={showPassword ? 'eye-off' : 'eye'} /></button></div></div>{error && <p className="auth-error" role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}<button className="button primary auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'sign-up' ? 'Create account' : 'Sign in'}</button></form>{mode === 'sign-in' && <button className="auth-link" disabled={busy} onClick={() => run(async () => { await sendPasswordResetEmail(auth, email); setNotice('Password reset email sent. Check your inbox.') })}>Forgot your password?</button>}<p className="auth-switch">{mode === 'sign-up' ? 'Already have an account?' : 'New to Lexycon?'} <button onClick={() => { setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up'); setShowPassword(false); setError(''); setNotice('') }}>{mode === 'sign-up' ? 'Sign in' : 'Create an account'}</button></p></section></main>
}

export function SignOutButton() {
  return <button className="auth-signout" onClick={() => signOut(auth)}>Sign out</button>
}
