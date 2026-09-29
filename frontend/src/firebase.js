import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// Firebase's web configuration identifies this public app. It is not a server secret.
const firebaseConfig = {
  apiKey: 'AIzaSyAKR3v1rxKmmVMr_Q95GlNYJlUclFjx09M',
  authDomain: 'lexicon-aguet-20260928.firebaseapp.com',
  projectId: 'lexicon-aguet-20260928',
  storageBucket: 'lexicon-aguet-20260928.firebasestorage.app',
  messagingSenderId: '600311691439',
  appId: '1:600311691439:web:c9f759abda6f15af1d3c5a',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
