import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useZego } from '../hooks/useZego'
import { useCoinTimer } from '../hooks/useCoinTimer'
import CallLayout from '../components/CallLayout'
import FiltersModal from '../components/FiltersModal'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const Call = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [filters, setFilters] = useState(null)
  const [callType, setCallType] = useState('random')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const { localStream, remoteStream, strangerInfo, isMicOn, isCamOn, toggleMic, toggleCam, cleanupCall } = useZego(
    user,
    filters ? { ...filters, trigger: refreshTrigger } : null,
    (reason) => {
      toast.error(reason)
      handleNextStranger()
    }
  )

  useCoinTimer(user, callType, () => {
    cleanupCall()
    navigate('/checkout')
  })

  const localVideoRef = useRef()
  const remoteVideoRef = useRef()

  useEffect(() => {
    if (localStream && localVideoRef.current) localVideoRef.current.srcObject = localStream
  }, [localStream])

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
  }, [remoteStream])

  const handleNextStranger = () => {
    setRefreshTrigger(prev => prev + 1)
    toast.success("Finding next person...")
  }

  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative m-0 p-0">
      <CallLayout
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        strangerInfo={strangerInfo}
        isMicOn={isMicOn}
        isCamOn={isCamOn}
        onToggleMic={toggleMic}
        onToggleCam={toggleCam}
        onNext={handleNextStranger}
        onStop={() => navigate('/dashboard')}
      />
      {!filters && <FiltersModal onApply={(f, type) => { setFilters(f); setCallType(type); }} />}
    </div>
  )
}

export default Call
