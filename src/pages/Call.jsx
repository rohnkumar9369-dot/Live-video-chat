import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ZegoExpressEngine } from 'zego-express-engine-webrtc'
import { db } from '../firebase'
import { doc, updateDoc, increment } from 'firebase/firestore'
import { PhoneOff, Camera, CameraOff, Mic, MicOff, Loader2, SkipForward, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { generateZegoToken } from '../utils/zegoToken'

const APP_ID = 1429635965; 
const SERVER_SECRET = "842438ed108af59b61e47198b74ab8e5";

const Call = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const zgRef = useRef(null)
  const localStreamRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(true)
  const [chatMessage, setChatMessage] = useState("")
  const [streamId] = useState(`stream_${user?.uid}_${Date.now()}`)
  const [roomId] = useState(`room_random_123`) 
  const hasDeductedCoins = useRef(false) // Coin double na kate isliye

  useEffect(() => {
    if (!user) return;
    
    const initZego = async () => {
      try {
        const serverUrl = "wss://webliveroom" + APP_ID + "-api.zego.im/ws";
        zgRef.current = new ZegoExpressEngine(APP_ID, serverUrl);
        
        const token = generateZegoToken(APP_ID, SERVER_SECRET, user.uid);
        if (!token) {
          toast.error("Token generate nahi hua!");
          return;
        }

        await zgRef.current.loginRoom(roomId, token, { userID: user.uid, userName: user.displayName || 'User' }, { userUpdate: true });
        
        // 1. ASLI CAMERA FIX: Zego se camera stream lene ke baad usko proper <video> tag (srcObject) mein daalna
        try {
          const localStream = await zgRef.current.createStream({ camera: { audio: true, video: true } });
          localStreamRef.current = localStream;
          
          const localVideo = document.getElementById('local-video-element');
          if (localVideo) {
            localVideo.srcObject = localStream;
          }
          await zgRef.current.startPublishingStream(streamId, localStream);
        } catch (camErr) {
          toast.error("Camera ya Mic ki permission allow karein!");
          return; 
        }

        // 2. REMOTE VIDEO & COIN FIX: Stranger aane par hi video aur coin ka logic chalega
        zgRef.current.on('roomStreamUpdate', async (roomID, updateType, streamList) => {
          if (updateType === 'ADD') {
            const remoteStreamObj = streamList[0];
            const remoteStream = await zgRef.current.startPlayingStream(remoteStreamObj.streamID);
            
            const remoteVideo = document.getElementById('remote-video-element');
            if (remoteVideo) {
              remoteVideo.srcObject = remoteStream;
            }

            // Sirf ek baar stranger connect hone par hi coin katenge
            if (!hasDeductedCoins.current) {
              try {
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, { coins: increment(-10) });
                toast.success("Stranger Connected! 10 Coins cut.");
                hasDeductedCoins.current = true;
              } catch (coinErr) {
                console.error("Coin Update Error:", coinErr);
              }
            }
            
            setLoading(false);

          } else if (updateType === 'DELETE') {
            toast("Stranger disconnected. Finding next...");
            handleNext();
          }
        });

      } catch (error) {
        toast.error("Error: " + JSON.stringify(error));
      }
    };

    initZego();
    return () => { handleEndCall(false); };
  }, [user, streamId, roomId]);

  const handleEndCall = async (shouldNavigate = true) => {
    if (zgRef.current) {
      if (localStreamRef.current) {
        zgRef.current.stopPublishingStream(streamId);
        zgRef.current.destroyStream(localStreamRef.current);
      }
      zgRef.current.logoutRoom(roomId);
    }
    if (shouldNavigate) navigate('/dashboard');
  };

  const handleNext = async () => {
    setLoading(true);
    await handleEndCall(false); 
    window.location.reload(); 
  };

  const toggleMic = async () => {
    if (localStreamRef.current) {
      const newState = !micOn;
      await zgRef.current.mutePublishStreamAudio(localStreamRef.current, !newState);
      setMicOn(newState);
    }
  };

  const toggleCamera = async () => {
    if (localStreamRef.current) {
      const newState = !cameraOn;
      await zgRef.current.mutePublishStreamVideo(localStreamRef.current, !newState);
      setCameraOn(newState);
    }
  };

  const sendChatMessage = () => {
    if(chatMessage.trim() === "") return;
    toast.success("Message sent: " + chatMessage);
    setChatMessage("");
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col m-0 p-0 overflow-hidden">
      
      {/* UPAR WALA 50%: Stranger Camera (Naya <video> tag logic) */}
      <div className="h-1/2 w-full bg-gray-900 border-b-2 border-black relative overflow-hidden">
        <video id="remote-video-element" autoPlay playsInline className="w-full h-full object-cover"></video>
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400 bg-gray-900">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium">Connecting to stranger...</p>
          </div>
        )}
      </div>

      {/* NICHE WALA 50%: Aapka Local Camera (Naya <video> tag logic) */}
      <div className="h-1/2 w-full bg-gray-800 relative overflow-hidden">
        <video id="local-video-element" autoPlay playsInline muted className="w-full h-full object-cover"></video>
        {!cameraOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-500 z-10">
            <CameraOff size={32} />
          </div>
        )}
      </div>

      {/* CHAT WALI LAMBI PATTI */}
      <div className="absolute bottom-24 left-4 right-4 md:left-1/4 md:right-1/4 z-50">
        <div className="bg-white/90 backdrop-blur-md rounded-full p-1.5 flex items-center shadow-xl border border-gray-200">
          <input 
            type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Type message..." 
            className="flex-1 bg-transparent px-4 py-2 text-black text-sm outline-none placeholder-gray-600 font-medium" 
          />
          <button onClick={sendChatMessage} className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-full transition">
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* CONTROL BUTTONS */}
      <div className="absolute bottom-6 left-0 right-0 z-40 flex justify-center px-4">
        <div className="flex items-center gap-3 md:gap-5 bg-gray-900/80 backdrop-blur-md p-3 px-6 rounded-full border border-gray-600/50 shadow-2xl">
          <button onClick={toggleMic} className={`p-3 rounded-full transition ${micOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600'}`}>
            {micOn ? <Mic className="text-white" size={20} /> : <MicOff className="text-white" size={20} />}
          </button>
          <button onClick={toggleCamera} className={`p-3 rounded-full transition ${cameraOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600'}`}>
            {cameraOn ? <Camera className="text-white" size={20} /> : <CameraOff className="text-white" size={20} />}
          </button>
          <button onClick={handleNext} className="p-3 px-6 rounded-full bg-blue-500 hover:bg-blue-600 transition flex items-center gap-2 shadow-lg">
            <span className="text-white font-bold text-sm">Next</span>
            <SkipForward className="text-white" size={18} />
          </button>
          <button onClick={() => handleEndCall(true)} className="p-3 px-6 rounded-full bg-red-600 hover:bg-red-700 transition flex items-center gap-2 shadow-lg">
            <span className="text-white font-bold text-sm">Stop</span>
            <PhoneOff className="text-white" size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
export default Call
            
