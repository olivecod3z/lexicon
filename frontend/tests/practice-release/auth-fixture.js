// Synthetic identity for the dedicated local test config. Never imported by production builds.
const listeners = new Set()
export const auth = { currentUser: null }
const user = { uid: 'release-fixture', emailVerified: true, getIdToken: async () => 'release-fixture-token' }
export function onAuthStateChanged(_auth, callback) { listeners.add(callback); queueMicrotask(() => callback(auth.currentUser)); return () => listeners.delete(callback) }
export async function signInWithEmailAndPassword(_auth, email, password) {
  if (email !== 'student@example.test' || password !== 'fixture-password') throw { code: 'auth/invalid-credential' }
  auth.currentUser = user; listeners.forEach(callback => callback(user))
}
export async function signOut() { auth.currentUser = null; listeners.forEach(callback => callback(null)) }
export class GoogleAuthProvider {}
export async function signInWithPopup() { throw { code: 'auth/operation-not-allowed' } }
export const createUserWithEmailAndPassword = signInWithPopup
export const sendPasswordResetEmail = signInWithPopup
export const sendEmailVerification = async () => {}
export const reload = async () => {}
