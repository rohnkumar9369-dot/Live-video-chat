import { useEffect, useRef, useState } from 'react'
import { ZegoExpressEngine } from 'zego-express-engine-webrtc'
import { generateZegoToken } from '../utils/zegoToken'
import { db } from '../firebase'
import { collection, addDoc, deleteDoc, query, where, onSnapshot, getDocs, doc, getDoc, serverTimestamp } from 'firebase/firestore'

const APP_ID = Number(import.meta.env.VITE_ZEGO_APP_ID || 0)
const SERVER_SECRET = import.meta.env.VITE_ZEGO_SERVER_SECRET || ""

export const useZego = (user, filters, onDisconnect) => {
  const zgRef = useRef(null)
  const localStreamRef = useRef(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [strangerInfo, setStrangerInfo] = useState(null)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCamOn, setIsCamOn] = useState(true)
  const [roomID, setRoomID] = useState(null)
  const queueDocRef = useRef(null)
  const matchingListener = useRef(null)
  const callStartTimeRef = useRef(null) // History save karne ke liye timer

  useEffect(() => {
    if (!user) return
    const zg = new ZegoExpressEngine(APP_ID, SERVER_SECRET)
    zgRef.current = zg

    // Camera aur Mic ki permission lena
    zg.createStream({ camera: { audio: true, video: true } }).then((stream) => {
      localStreamRef.current = stream
    }).catch(err => console.error("Camera access error:", err))

    return () => {
      cleanupCall()
      if (zgRef.current && localStreamRef.current) {
        zgRef.current.destroyStream(localStreamRef.current)
      }
    }
  }, [user])

  // Call cut hone par sab clear karna aur History Firebase mein save karna
  const cleanupCall = async () => {
     if (callStartTimeRef.current && strangerInfo) {
        const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000)
        if (duration > 0) {
            try {
                // Firebase History Save Logic
                await addDoc(collection(db, 'calls'), {
                    userId: user.uid,
                    with: strangerInfo.name || 'Stranger',
                    strangerId: strangerInfo.uid,
                    duration: duration,
                    timestamp: serverTimestamp()
                })
            } catch(e) { console.error("History save error", e) }
        }
     }

     if (zgRef.current && roomID) {
        zgRef.current.logoutRoom(roomID)
     }
     if (queueDocRef.current) {
        deleteDoc(queueDocRef.current).catch(() => {})
     }
     if (matchingListener.current) matchingListener.current()
     
     setRemoteStream(null)
     setStrangerInfo(null)
     setRoomID(null)
     callStartTimeRef.current = null
  }

  // Matching Queue System
  useEffect(() => {
    if (!user || !filters) return

    const joinQueue = async () => {
      // Purani queue delete karo (Double entry rokne ke liye)
      const q = query(collection(db, 'queue'), where('userId', '==', user.uid))
      const existing = await getDocs(q)
      existing.forEach(d => deleteDoc(d.ref))

      const queueEntry = {
        userId: user.uid,
        gender: filters.gender,
        region: filters.region,
        createdAt: serverTimestamp(),
      }
      const docRef = await addDoc(collection(db, 'queue'), queueEntry)
      queueDocRef.current = docRef

      // Stranger ka wait karna
      matchingListener.current = onSnapshot(docRef, (snap) => {
        const data = snap.data()
        if (data && data.matchedWith && data.roomID) {
          setRoomID(data.roomID)
          startCall(data.roomID, data.matchedWith)
          deleteDoc(docRef) // Match hote hi queue se bahar aana
        }
      })
    }

    joinQueue()

    return () => {
       if (queueDocRef.current) deleteDoc(queueDocRef.current)
       if (matchingListener.current) matchingListener.current()
    }
  }, [user, filters])

  // Call Start Logic
  const startCall = async (rID, strangerId) => {
    if (!zgRef.current || !localStreamRef.current) return

    const token = generateZegoToken(APP_ID, SERVER_SECRET, user.uid)
    if (!token) return

    zgRef.current.on('roomStreamUpdate', async (roomID, updateType, streamList) => {
      if (updateType === 'ADD') {
        setRemoteStream(streamList[0])
        callStartTimeRef.current = Date.now() // Timer start for history
        try {
            const strangerDoc = await getDoc(doc(db, 'users', strangerId))
            if (strangerDoc.exists()) {
                setStrangerInfo({ uid: strangerId, ...strangerDoc.data() })
            }
        } catch(e) { console.error(e) }
      } else if (updateType === 'DELETE') {
        cleanupCall()
        if (onDisconnect) onDisconnect('Stranger left the call')
      }
    })

    await zgRef.current.loginRoom(rID, token, { userID: user.uid, userName: user.name || 'User' }, { userUpdate: true })
    zgRef.current.startPublishingStream(rID, localStreamRef.current)
  }

  const toggleMic = () => {
    if (localStreamRef.current) {
      const newState = !isMicOn
      localStreamRef.current.muteAudio(!newState)
      setIsMicOn(newState)
    }
  }

  const toggleCam = () => {
    if (localStreamRef.current) {
      const newState = !isCamOn
      localStreamRef.current.muteVideo(!newState)
      setIsCamOn(newState)
    }
  }

  return {
    localStream: localStreamRef.current,
    remoteStream,
    strangerInfo,
    isMicOn,
    isCamOn,
    toggleMic,
    toggleCam,
    cleanupCall
  }
}
