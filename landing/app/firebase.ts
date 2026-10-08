import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Public Firebase web configuration shared with the dashboard's sign-in session.
const app = initializeApp({
  apiKey: 'AIzaSyAKR3v1rxKmmVMr_Q95GlNYJlUclFjx09M',
  authDomain: 'lexicon-aguet-20260928.firebaseapp.com',
  projectId: 'lexicon-aguet-20260928',
  storageBucket: 'lexicon-aguet-20260928.firebasestorage.app',
  messagingSenderId: '600311691439',
  appId: '1:600311691439:web:c9f759abda6f15af1d3c5a',
});

export const auth = getAuth(app);
