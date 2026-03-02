import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { db, storage, auth } from '../firebase'
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { updateProfile } from 'firebase/auth'
import { Phone, MessageCircle, Edit2, LogOut, Video, Copy, Camera } from 'lucide-react'
import CoinDisplay from '../components/CoinDisplay'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('calls')
  const [calls, setCalls] = useState([])
  const [messages, setMessages] = useState([])
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState('')
  const [uploading, setUploading] = useState(false)

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
    } catch (error) {
      toast.error("Failed to update name.")
    }
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const loadingToast = toast.loading("Uploading photo...")
    try {
      const imageRef = ref(storage, `avatars/${user.uid}`)
      await uploadBytes(imageRef, file)
      const photoURL = await getDownloadURL(imageRef)
      await updateProfile(auth.currentUser, { photoURL })
      await updateDoc(doc(db, 'users', user.uid), { photo: photoURL })
      toast.success("Photo updated! Refreshing...", { id: loadingToast })
      setTimeout(() => window.location.reload(), 1500)
    } catch (error) {
      toast.error("Failed to upload photo.", { id: loadingToast })
    } finally {
      setUploading(false)
    }
  }

  const copyId = () => {
    navigator.clipboard.writeText(user.uid)
    toast.success("User ID Copied!")
  }

  return (
    <div className="h-screen overflow-y-auto bg-gray-50 p-4 m-0 pb-20">
      <CoinDisplay />
      
      {/* 🔴 Main Video Call Button */}
      <div className="max-w-md mx-auto mt-4">
        <button 
          onClick={() => navigate('/call')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl mb-6 flex items-center justify-center gap-3 shadow-lg transform transition active:scale-95"
        >
          <Video size={24} />
          <span className="text-xl">Start Video Call</span>
        </button>

        <div className="bg-white rounded-3xl p-6 shadow-sm mb-6 border border-gray-100">
          <div className="flex items-center gap-4">
            
            {/* 🔴 Profile Photo with Upload Logic */}
            <div className="relative">
              <img src={user?.photoURL || "https://via.placeholder.com/150"} alt="Profile" className="w-20 h-20 rounded-full border-4 border-gray-50 object-cover" />
              <label className="absolute bottom-0 right-0 bg-blue-600 p-1.5 rounded-full text-white cursor-pointer shadow-md hover:bg-blue-700 transition">
                <Camera size={14} />
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" disabled={uploading} />
              </label>
            </div>

            <div className="flex-1">
              {editing ? (
                <div className="flex gap-2">
                  <input value={newName} onChange={e => setNewName(e.target.value)} className="border rounded px-2 w-full text-sm" />
                  <button onClick={handleUpdate} className="bg-blue-600 text-white px-3 py-1 rounded text-xs">Save</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-800">{user?.displayName || 'User'}</h2>
                  <Edit2 size={16} className="text-gray-400 cursor-pointer hover:text-blue-600 transition" onClick={() => setEditing(true)} />
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
            </div>
            
            <LogOut size={24} className="text-red-400 cursor-pointer ml-auto hover:text-red-600 transition" onClick={logout} />
          </div>

          {/* 🔴 User ID Display & Copy Button */}
          <div className="mt-4 bg-gray-50 p-3 rounded-xl flex justify-between items-center border border-gray-100">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Your User ID</p>
              <p className="text-xs font-mono text-gray-700 truncate w-48">{user?.uid}</p>
            </div>
            <button onClick={copyId} className="p-2 bg-white rounded-lg shadow-sm text-blue-600 hover:bg-blue-50 transition">
              <Copy size={16} />
            </button>
          </div>
        </div>

        {/* Tabs for History */}
        <div className="flex bg-white rounded-2xl p-1 mb-6 shadow-sm border border-gray-100">
          <button onClick={() => setActiveTab('calls')} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition ${activeTab === 'calls' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <Phone size={18} /> Calls
          </button>
          <button onClick={() => setActiveTab('messages')} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition ${activeTab === 'messages' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <MessageCircle size={18} /> Chats
          </button>
        </div>

        {/* History List */}
        <div className="space-y-3 pb-10">
          {activeTab === 'calls' ? (
            calls.length > 0 ? calls.map(call => (
              <div key={call.id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {call.strangerName ? call.strangerName[0].toUpperCase() : 'S'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{call.strangerName || 'Stranger'}</p>
                    <p className="text-[10px] text-gray-400">{call.timestamp?.seconds ? new Date(call.timestamp.seconds * 1000).toLocaleString() : 'Recent'}</p>
                  </div>
                </div>
              </div>
            )) : <p className="text-center text-gray-400 text-sm mt-10 font-medium">No call history available.</p>
          ) : (
            messages.length > 0 ? messages.map(msg => (
              <div key={msg.id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 font-bold">M</div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">Message</p>
                    <p className="text-[10px] text-gray-400">{msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleString() : 'Recent'}</p>
                  </div>
                </div>
              </div>
            )) : <p className="text-center text-gray-400 text-sm mt-10 font-medium">No chat history available.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
