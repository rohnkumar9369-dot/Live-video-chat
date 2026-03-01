import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// All 8 details included for Production Mode
const firebaseConfig = {
  apiKey: "AIzaSyCMgAJiZOYe8ZIq5qLr6hEeNIM_WSM0LXQ",
  authDomain: "my-random-video-call-d89c3.firebaseapp.com",
  databaseURL: "https://my-random-video-call-d89c3-default-rtdb.firebaseio.com",
  projectId: "my-random-video-call-d89c3",
  storageBucket: "my-random-video-call-d89c3.firebasestorage.app",
  messagingSenderId: "335989141288",
  appId: "1:335989141288:web:c05022ec3a1f4137e32a1d",
  measurementId: "G-M7N2DCKR66"
};

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
// User ko hamesha Gmail select karne ka option aayega
googleProvider.setCustomParameters({ prompt: 'select_account' }) 
export const db = getFirestore(app)
export const storage = getStorage(app)

