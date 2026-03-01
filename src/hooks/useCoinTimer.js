import { useEffect, useRef } from 'react'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export const useCoinTimer = (user, callType = 'random', onLowBalance) => {
  const navigate = useNavigate()
  const intervalRef = useRef()

  useEffect(() => {
    if (!user) return

    // Logic: Random call = 10 coins/min, Profile call = 40 coins/min
    const ratePerMinute = callType === 'random' ? 10 : 40

    const checkAndDeduct = async () => {
      const userRef = doc(db, 'users', user.uid)
      const userSnap = await getDoc(userRef)
      
      if (userSnap.exists()) {
        const currentCoins = userSnap.data().coins

        if (currentCoins < ratePerMinute) {
          toast.error('Coins khatam ho gaye hain! Call disconnect ho rahi hai.')
          if (onLowBalance) onLowBalance() // Call cut karne ka trigger
          navigate('/checkout') // Direct recharge page par bhejna
          return
        }

        // Har 1 minute baad automatically coins kaatna
        await updateDoc(userRef, {
          coins: currentCoins - ratePerMinute,
        })
      }
    }

    // Call connect hone ke har 60 seconds (1 minute) baad deduction trigger hoga
    intervalRef.current = setInterval(checkAndDeduct, 60000)

    return () => {
      // Jab call cut ho jaye toh timer automatically stop ho jayega
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [user, callType, navigate, onLowBalance])
}
