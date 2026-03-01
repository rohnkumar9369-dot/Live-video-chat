import { useEffect, useState } from 'react'
import { auth, db, googleProvider } from '../firebase'
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // iPhone/Safari ke liye background redirect handle karna
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth)
        if (result?.user) {
          await checkAndCreateProfile(result.user)
        }
      } catch (error) {
        console.error("Login Error:", error)
      }
    }
    handleRedirect()

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        await checkAndCreateProfile(firebaseUser)
      } else {
        setUser(null)
        setLoading(false)
      }
    })
    return unsubscribe
  }, [])

  const checkAndCreateProfile = async (firebaseUser) => {
    const userRef = doc(db, 'users', firebaseUser.uid)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      // Naya user: Profile banegi aur 20 coins automatically milenge
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        photo: firebaseUser.photoURL,
        coins: 20,
        blocked: false,
        gender: '',
        country: '',
        joinedAt: serverTimestamp(),
      }
      await setDoc(userRef, userData)
      setUser(userData)
    } else {
      // Purana user: Sirf data load hoga
      setUser({ uid: firebaseUser.uid, ...userSnap.data() })
    }
    setLoading(false)
  }

  const login = async () => {
    try {
      // Device detect karke sahi login method chalana
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
      
      if (isIOS || isSafari) {
        await signInWithRedirect(auth, googleProvider)
      } else {
        const result = await signInWithPopup(auth, googleProvider)
        await checkAndCreateProfile(result.user)
      }
    } catch (error) {
      console.error("Login trigger error:", error)
    }
  }

  const logout = () => signOut(auth)

  return { user, loading, login, logout }
}
