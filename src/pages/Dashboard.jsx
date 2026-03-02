import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { db, storage, auth } from '../firebase'
import { collection, query, where, orderBy, onSnapshot, doc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { updateProfile } from 'firebase/auth'
import { Phone, MessageCircle, Edit2, LogOut, Video, Copy, Camera as CameraIcon, X, Mail, Users, Globe, MessageSquare } from 'lucide-react'
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
  const [localPhoto, setLocalPhoto] = useState("https://via.placeholder.com/150")

  // Filters State
  const [gender, setGender] = useState('All')
  const [country, setCountry] = useState('Global')
  const [language, setLanguage] = useState('All')

  useEffect(() => {
    if (!user) return;
    setNewName(user.displayName || '')
    if(user.photoURL) setLocalPhoto(user.photoURL)

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
      await setDoc(doc(db, 'users', user.uid), { name: newName }, { merge: true })
      setEditing(false)
      toast.success("Naam save ho gaya!")
    } catch (error) {
      toast.error("Name update fail hua.")
    }
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const objectUrl = URL.createObjectURL(file);
    setLocalPhoto(objectUrl);
    setUploading(true)
    const toastId = toast.loading("Uploading photo...")
    try {
      const imageRef = ref(storage, `avatars/${user.uid}_${Date.now()}`)
      await uploadBytes(imageRef, file)
      const photoURL = await getDownloadURL(imageRef)
      await updateProfile(auth.currentUser, { photoURL })
      await setDoc(doc(db, 'users', user.uid), { photo: photoURL }, { merge: true })
      toast.success("Photo updated successfully!", { id: toastId })
    } catch (error) {
      toast.error("Failed to upload photo.", { id: toastId })
      setLocalPhoto(user?.photoURL || "https://via.placeholder.com/150") 
    } finally {
      setUploading(false)
    }
  }

  // Handle Video Call button with filters
  const startCall = () => {
    // Navigate with filter state so Call.jsx can use them later if needed
    navigate('/call', { state: { gender, country, language } });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative">
      
      {/* Header */}
      <header className="bg-white px-4 py-3 flex items-center justify-between shadow-sm border-b border-gray-100 z-10 sticky top-0">
        <CoinDisplay />
        <button onClick={() => setShowProfileModal(true)} className="w-10 h-10 rounded-full border-2 border-gray-200 overflow-hidden shadow-sm hover:opacity-80 transition">
          <img src={localPhoto} alt="Profile" className="w-full h-full object-cover" />
        </button>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 p-4 flex flex-col items-center overflow-y-auto pb-10">
        
        {/* WELCOME NAME (Ab aapka naam yahan chamkega) */}
        <div className="w-full max-w-md mt-2 mb-4 px-2">
          <h1 className="text-2xl font-black text-gray-800">Welcome, {user?.displayName || 'User'}! 👋</h1>
          <p className="text-gray-500 text-sm">Find new friends around the world.</p>
        </div>
        
        {/* CENTER: Video Call & Filters */}
        <div className="w-full max-w-md bg-white p-6 rounded-3xl shadow-md border border-gray-100 mb-8">
          
          {/* FILTERS SECTION */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1"><Users size={12}/> Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg p-2 outline-none font-semibold">
                <option value="All">All</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1"><Globe size={12}/> Country</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg p-2 outline-none font-semibold">
                <option value="Global">Global</option>
                <option value="India">India</option>
                <option value="USA">USA</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1"><MessageSquare size={12}/> Lang</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg p-2 outline-none font-semibold">
                <option value="All">All</option>
                <option value="Hindi">Hindi</option>
                <option value="English">English</option>
              </select>
            </div>
          </div>

          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Video className="text-blue-600" size={32} />
          </div>
          <button onClick={startCall} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
            <span className="text-lg">Start Video Call</span>
          </button>
        </div>

        {/* BOTTOM: Left Chat & Right Call History */}
        <div className="w-full max-w-md grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col h-64">
            <div className="flex items-center gap-2 mb-3 border-b pb-2">
              <MessageCircle className="text-green-500" size={18} />
              <h2 className="font-bold text-gray-800 text-sm">Chats</h2>
            </div>
            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {messages.length > 0 ? messages.map((msg) => (
                <div key={msg.id} className="bg-gray-50 p-2 rounded-xl flex items-center gap-2 border border-gray-100">
                   <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xs shrink-0">
                     {msg.strangerName ? msg.strangerName[0].toUpperCase() : 'S'}
                   </div>
                   <div className="flex-1 overflow-hidden">
                     <p className="font-bold text-gray-800 text-xs truncate">{msg.strangerName || 'Stranger'}</p>
                   </div>
                </div>
              )) : (
                <p className="text-center text-gray-400 text-xs py-4 mt-6">No chats.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col h-64">
            <div className="flex items-center gap-2 mb-3 border-b pb-2">
              <Phone className="text-blue-500" size={18} />
              <h2 className="font-bold text-gray-800 text-sm">Calls</h2>
            </div>
            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {calls.length > 0 ? calls.map((call) => (
                <div key={call.id} className="bg-gray-50 p-2 rounded-xl flex items-center gap-2 border border-gray-100">
                   <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                     {call.strangerName ? call.strangerName[0].toUpperCase() : 'S'}
                   </div>
                   <div className="flex-1 overflow-hidden">
                     <p className="font-bold text-gray-800 text-xs truncate">{call.strangerName || 'Stranger'}</p>
                   </div>
                </div>
              )) : (
                <p className="text-center text-gray-400 text-xs py-4 mt-6">No calls.</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowProfileModal(false)}>
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-3 border-gray-100 px-5 pt-5">
              <h2 className="text-xl font-black text-gray-800">My Profile</h2>
              <button onClick={() => setShowProfileModal(false)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"><X size={20} /></button>
            </div>
            <div className="flex flex-col items-center gap-4 px-5">
              <div className="relative">
                <img src={localPhoto} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 shadow-md" />
                <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white cursor-pointer shadow-lg hover:bg-blue-700 transition">
                  <CameraIcon size={14} />
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" disabled={uploading} />
                </label>
              </div>
              <div className="w-full bg-gray-50 p-3 rounded-xl border border-gray-100">
                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Display Name</label>
                {editing ? (
                  <div className="flex gap-2">
                    <input 
                      value={newName} 
                      onChange={(e) => setNewName(e.target.value)} 
                      className="border rounded-md px-3 py-2 flex-1 text-sm outline-none text-black bg-white font-bold border-gray-300 shadow-sm" 
                      placeholder="Enter Name"
                      autoFocus
                    />
                    <button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-xs font-bold shadow-sm">Save</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-md border border-gray-200">
                    <h2 className="text-sm font-bold text-gray-800">{user?.displayName || 'User'}</h2>
                    <Edit2 size={14} className="text-gray-400 cursor-pointer hover:text-blue-600" onClick={() => setEditing(true)} />
                  </div>
                )}
              </div>
              <button onClick={logout} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 mb-5">
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
                       
