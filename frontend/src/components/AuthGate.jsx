import { useEffect, useState } from 'react'
import { GoogleAuthProvider, createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth'
import { auth } from '../firebase'
import './AuthGate.css'

const friendlyError = error => ({
  'auth/email-already-in-use': 'That email already has an account. Sign in instead.',
  'auth/invalid-credential': 'That email or password is incorrect.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/weak-password': 'Choose a password with at least 8 characters.',
}[error.code] || 'Lexicon could not sign you in. Please try again.')

export default function AuthGate({ children }) {
  const [user, setUser] = useState(undefined)
  const [mode, setMode] = useState('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => onAuthStateChanged(auth, setUser), [])
  const openingOnboarding = Boolean(user && new URLSearchParams(window.location.search).has('onboarding'))
  useEffect(() => { if (openingOnboarding) window.location.replace('/onboarding') }, [openingOnboarding])
  if (user === undefined) return <main className="auth-page"><p role="status">Opening your study space…</p></main>
  if (openingOnboarding) return <main className="auth-page"><p role="status">Opening your study setup…</p></main>
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
    run(() => mode === 'sign-up' ? createUserWithEmailAndPassword(auth, email, password) : signInWithEmailAndPassword(auth, email, password))
  }
  return <main className="auth-page"><section className="auth-card" aria-labelledby="auth-title"><a className="auth-brand" href="/">lexicon.</a><p className="eyebrow">YOUR PRIVATE STUDY SPACE</p><h1 id="auth-title">{mode === 'sign-up' ? 'Create your account' : 'Welcome back'}</h1><p className="auth-copy">Save your lectures, study materials, and results securely in your own workspace.</p><button className="auth-google" disabled={busy} onClick={() => run(() => signInWithPopup(auth, new GoogleAuthProvider()))}><span aria-hidden="true">G</span>Continue with Google</button><div className="auth-divider"><span>or use email</span></div><form onSubmit={submit}><label>Email<input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} /></label><label>Password<input type="password" autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'} minLength="8" required value={password} onChange={event => setPassword(event.target.value)} /></label>{error && <p className="auth-error" role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}<button className="button primary auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'sign-up' ? 'Create account' : 'Sign in'}</button></form>{mode === 'sign-in' && <button className="auth-link" disabled={busy} onClick={() => run(async () => { await sendPasswordResetEmail(auth, email); setNotice('Password reset email sent. Check your inbox.') })}>Forgot your password?</button>}<p className="auth-switch">{mode === 'sign-up' ? 'Already have an account?' : 'New to Lexicon?'} <button onClick={() => { setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up'); setError(''); setNotice('') }}>{mode === 'sign-up' ? 'Sign in' : 'Create an account'}</button></p></section></main>
}

export function SignOutButton() {
  return <button className="auth-signout" onClick={() => signOut(auth)}>Sign out</button>
}
