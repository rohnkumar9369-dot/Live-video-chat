import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { db, storage, auth } from '../firebase'
import { collection, query, where, orderBy, onSnapshot, doc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { updateProfile } from 'firebase/auth'
import { Phone, MessageCircle, Edit2, LogOut, Video, Copy, Camera, User, X, Mail } from 'lucide-react'
import CoinDisplay from '../components/CoinDisplay'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [calls, setCalls] = useState([])
  const [messages, setMessages] = useState([])
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)

  useEffect(() => {
    if (!user) return
    setNewName(user.displayName || '')

    const callsQuery = query(collection(db, 'calls'), where('userId', '==', user.uid), orderBy('timestamp', 'desc'))
    const unsubCalls = onSnapshot(callsQuery, (snap) => setCalls(snap.docs.map(d => ({ id: d.id, ...d.data() }))))

    const msgsQuery = query(collection(db, 'messages'), where('userId', '==', user.uid), orderBy('timestamp', 'desc'))
    const unsubMsgs = onSnapshot(msgsQuery, (snap) => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))))

    return () => { unsubCalls(); unsubMsgs(); }
  }, [user])

  const handleUpdate = async () => {
    if (!newName.trim()) return
    try {
      await updateProfile(auth.currentUser, { displayName: newName })
      await updateDoc(doc(db, 'users', user.uid), { name: newName })
      setEditing(false)
      toast.success("Name updated successfully!")
    } catch (error) { toast.error("Failed to update name.") }
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const toastId = toast.loading("Uploading photo...")
    try {
      const imageRef = ref(storage, `avatars/${user.uid}`)
      await uploadBytes(imageRef, file)
      const photoURL = await getDownloadURL(imageRef)
      await updateProfile(auth.currentUser, { photoURL })
      await updateDoc(doc(db, 'users', user.uid), { photo: photoURL })
      toast.success("Photo updated! Please refresh.", { id: toastId })
      setTimeout(() => window.location.reload(), 1500)
    } catch (error) { toast.error("Failed to upload photo.", { id: toastId }) } 
    finally { setUploading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative">
      
      {/* Header */}
      <header className="bg-white px-4 py-3 flex items-center justify-between shadow-sm border-b border-gray-100 z-10 sticky top-0">
        <CoinDisplay />
        <button onClick={() => setShowProfileModal(true)} className="w-10 h-10 rounded-full border-2 border-gray-200 overflow-hidden bg-gray-100 hover:border-blue-400 transition shadow-sm">
          {user?.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" /> : <User className="text-gray-400 m-auto mt-1" size={20} />}
        </button>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 p-4 flex flex-col items-center overflow-y-auto pb-10">
        
        {/* CENTER: Start Video Call Button */}
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-md border border-gray-100 text-center mt-6 mb-8">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="text-blue-600" size={40} />
          </div>
          <h1 className="text-2xl font-black text-gray-800 mb-2">Connect Now</h1>
          <p className="text-gray-500 text-sm mb-6">Start a random video call instantly</p>
          <button onClick={() => navigate('/call')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg transform transition active:scale-95">
            <span className="text-xl">Start Video Call</span>
          </button>
        </div>

        {/* BOTTOM: Left Chat & Right Call History */}
        <div className="w-full max-w-md grid grid-cols-2 gap-4">
          
          {/* Left: Chat History */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col h-64">
            <div className="flex items-center gap-2 mb-3 border-b pb-2">
              <MessageCircle className="text-green-500" size={18} />
              <h2 className="font-bold text-gray-800 text-sm">Chats</h2>
            </div>
            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {messages.length > 0 ? messages.map(msg => (
                <div key={msg.id} className="bg-gray-50 p-2 rounded-xl flex items-center gap-2 border border-gray-100">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xs">M</div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-bold text-gray-800 text-xs truncate">Message</p>
                    <p className="text-[9px] text-gray-400 truncate">{msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleDateString() : 'Recent'}</p>
                  </div>
                </div>
              )) : <p className="text-center text-gray-400 text-xs py-4 mt-6">No chats yet.</p>}
            </div>
          </div>

          {/* Right: Call History */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col h-64">
            <div className="flex items-center gap-2 mb-3 border-b pb-2">
              <Phone className="text-blue-500" size={18} />
              <h2 className="font-bold text-gray-800 text-sm">Calls</h2>
            </div>
            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {calls.length > 0 ? calls.map(call => (
                <div key={call.id} className="bg-gray-50 p-2 rounded-xl flex items-center gap-2 border border-gray-100">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                    {call.strangerName ? call.strangerName[0].toUpperCase() : 'S'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-bold text-gray-800 text-xs truncate">{call.strangerName || 'Stranger'}</p>
                    <p className="text-[9px] text-gray-400 truncate">{call.timestamp?.seconds ? new Date(call.timestamp.seconds * 1000).toLocaleDateString() : 'Recent'}</p>
                  </div>
                </div>
              )) : <p className="text-center text-gray-400 text-xs py-4 mt-6">No calls yet.</p>}
            </div>
          </div>

        </div>
      </main>

      {/* 🔴 Profile Modal with GMAIL included */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowProfileModal(false)}>
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <h2 className="text-xl font-black text-gray-800">My Profile</h2>
              <button onClick={() => setShowProfileModal(false)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition"><X size={20} /></button>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <img src={user?.photoURL || "https://via.placeholder.com/150"} alt="Profile" className="w-24 h-24 rounded-full border-4 border-gray-50 object-cover shadow-sm" />
                <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white cursor-pointer shadow-md hover:bg-blue-700 transition">
                  <Camera size={14} />
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" disabled={uploading} />
                </label>
              </div>

              <div className="w-full bg-gray-50 p-3 rounded-xl border border-gray-100">
                <label className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Display Name</label>
                {editing ? (
                  <div className="flex gap-2">
                    <input value={newName} onChange={e => setNewName(e.target.value)} className="border rounded-md px-2 py-1 w-full text-sm outline-none" />
                    <button onClick={handleUpdate} className="bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-bold">Save</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-gray-800">{user?.displayName || 'User'}</h2>
                    <Edit2 size={14} className="text-gray-400 cursor-pointer hover:text-blue-600" onClick={() => setEditing(true)} />
                  </div>
                )}
              </div>

              {/* 🔴 Gmail Box */}
              <div className="w-full bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center gap-3">
                <Mail className="text-gray-400" size={18} />
                <div className="overflow-hidden">
                  <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Email Address</p>
                  <p className="text-xs font-medium text-gray-700 truncate">{user?.email}</p>
                </div>
              </div>
              
              <div className="w-full bg-gray-50 p-3 rounded-xl flex justify-between items-center border border-gray-100">
                <div className="overflow-hidden pr-2">
                  <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-1">User ID</p>
                  <p className="text-xs font-mono text-gray-600 truncate">{user?.uid}</p>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(user.uid); toast.success("Copied!"); }} className="p-2 bg-white rounded-md shadow-sm text-blue-600">
                  <Copy size={14} />
                </button>
              </div>

              <button onClick={logout} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition border border-red-100 mt-2">
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default Dashboard
              

