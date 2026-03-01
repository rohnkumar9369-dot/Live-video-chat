import { Mic, MicOff, Video, VideoOff, LogOut, RefreshCw, Coins } from 'lucide-react'
import StrangerInfo from './StrangerInfo'
import CoinDisplay from './CoinDisplay'

const CallLayout = ({
  localVideoRef,
  remoteVideoRef,
  isMicOn,
  isCamOn,
  toggleMic,
  toggleCam,
  onNext,
  onStop,
  strangerInfo,
  onRecharge,
}) => {
  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden m-0 p-0">
      
      {/* Stranger Video - Strictly Top 50% */}
      <div className="relative h-1/2 w-full bg-gray-900 border-b border-gray-800">
        <video 
          ref={remoteVideoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover" 
        />
        <StrangerInfo info={strangerInfo} />
      </div>

      {/* Local Video (User) - Strictly Bottom 50% */}
      <div className="relative h-1/2 w-full bg-gray-800">
        <video 
          ref={localVideoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover transform scale-x-[-1]" 
        />
      </div>

      {/* Floating Buttons - Professional Medium Size (No Scroll) */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-3 rounded-full shadow-lg z-50">
        <button onClick={onNext} className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full text-white transition-colors shadow-md">
          <RefreshCw size={22} />
        </button>
        <button onClick={onStop} className="p-3 bg-red-600 hover:bg-red-700 rounded-full text-white transition-colors shadow-md">
          <LogOut size={22} />
        </button>
        <button onClick={toggleMic} className={`p-3 rounded-full text-white transition-colors shadow-md ${isMicOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'}`}>
          {isMicOn ? <Mic size={22} /> : <MicOff size={22} />}
        </button>
        <button onClick={toggleCam} className={`p-3 rounded-full text-white transition-colors shadow-md ${isCamOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'}`}>
          {isCamOn ? <Video size={22} /> : <VideoOff size={22} />}
        </button>
        <button onClick={onRecharge} className="p-3 bg-yellow-600 hover:bg-yellow-700 rounded-full text-white transition-colors shadow-md">
          <Coins size={22} />
        </button>
      </div>

      {/* Header Coin Display */}
      <div className="absolute top-4 right-4 z-50">
        <CoinDisplay />
      </div>

    </div>
  )
}

export default CallLayout
