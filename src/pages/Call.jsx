import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ZegoExpressEngine } from 'zego-express-engine-webrtc'
import { db } from '../firebase'
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore'
import { PhoneOff, Camera, CameraOff, Mic, MicOff, Loader2, MessageSquare, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { generateZegoToken } from '../utils/zegoToken'

const APP_ID = 381425641; 
const SERVER_SECRET = "083ef863b69002864505afb419273291";

const Call = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const zgRef = useRef(null)
  const localStreamRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [callStarted, setCallStarted] = useState(false)
  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [streamId] = useState(`stream_${user?.uid}_${Date.now()}`)
  const [roomId] = useState(`room_random_123`)

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

        // ZegoCloud par Login karna
        await zgRef.current.loginRoom(roomId, token, { userID: user.uid, userName: user.displayName || 'User' }, { userUpdate: true });
        
        // --- COINS KATNE KA LOGIC (10 coins katenge call shuru hote hi) ---
        try {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, { coins: increment(-10) });
          toast.success("Call connect hui! 10 Coins cut gaye.");
        } catch (coinErr) {
          console.error("Coin Update Error:", coinErr);
        }
        
        try {
          localStreamRef.current = await zgRef.current.createStream({ camera: { audio: true, video: true } });
        } catch (camErr) {
          toast.error("Browser mein Camera permission Allow kijiye!");
          return; 
        }
        
        const localView = document.getElementById('local-video');
        if (localView) zgRef.current.startPlayingStream(streamId, { videoView: localView });
        
        await zgRef.current.startPublishingStream(streamId, localStreamRef.current);

        zgRef.current.on('roomStreamUpdate', async (roomID, updateType, streamList) => {
          if (updateType === 'ADD') {
            const remoteStream = streamList[0];
            const remoteView = document.getElementById('remote-video');
            if (remoteView) zgRef.current.startPlayingStream(remoteStream.streamID, { videoView: remoteView });
            setCallStarted(true);
            setLoading(false);
          } else if (updateType === 'DELETE') {
            toast("Stranger cut the call.");
            handleEndCall(false);
          }
        });

        setLoading(false);
      } catch (error) {
        console.error("Zego Init Error:", error);
        // Ab undefined nahi aayega, asli detail aayegi
        toast.error("Zego Error: " + JSON.stringify(error));
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

  return (
    <div className="fixed inset-0 bg-black flex flex-col m-0 p-0 overflow-hidden">
      <div id="remote-video" className="h-1/2 w-full bg-gray-900 border-b-2 border-black relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium">Connecting to stranger...</p>
          </div>
        )}
      </div>

      <div id="local-video" className="h-1/2 w-full bg-gray-800 relative">
        {!cameraOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-500">
            <CameraOff size={32} />
          </div>
        )}
      </div>

      <div className="absolute bottom-6 left-0 right-0 z-40 flex justify-center px-4">
        <div className="flex items-center gap-3 bg-gray-900/70 backdrop-blur-md p-3 rounded-full border border-gray-600/50 shadow-xl">
          <button onClick={toggleMic} className={`p-3 rounded-full transition ${micOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600'}`}>
            {micOn ? <Mic className="text-white" size={20} /> : <MicOff className="text-white" size={20} />}
          </button>
          <button onClick={toggleCamera} className={`p-3 rounded-full transition ${cameraOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600'}`}>
            {cameraOn ? <Camera className="text-white" size={20} /> : <CameraOff className="text-white" size={20} />}
          </button>
          <button onClick={() => setIsChatOpen(!isChatOpen)} className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 transition">
            <MessageSquare className="text-white" size={20} />
          </button>
          <button onClick={() => handleEndCall()} className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition">
            <PhoneOff className="text-white" size={20} />
          </button>
        </div>
      </div>

      {isChatOpen && (
        <div className="absolute bottom-24 left-4 right-4 h-64 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className="bg-blue-600 p-3 flex justify-between items-center">
            <h3 className="text-white font-bold text-sm">Live Chat</h3>
            <button onClick={() => setIsChatOpen(false)} className="text-white hover:text-gray-200"><X size={18} /></button>
          </div>
          <div className="flex-1 bg-gray-50 p-2 overflow-y-auto">
            <p className="text-xs text-center text-gray-400 mt-2">Chat started...</p>
          </div>
          <div className="p-2 bg-white border-t flex gap-2">
            <input type="text" placeholder="Type a message..." className="flex-1 border rounded-full px-3 py-1 text-sm outline-none" />
            <button className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">Send</button>
          </div>
        </div>
      )}
    </div>
  )
}
export default Call
      
