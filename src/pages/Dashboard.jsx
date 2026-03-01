import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { db, storage, auth } from '../firebase'
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { updateProfile } from 'firebase/auth'
import { Phone, MessageCircle, Edit2, LogOut } from 'lucide-react'
import CoinDisplay from '../components/CoinDisplay'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('calls')
  const [calls, setCalls] = useState([])
  const [messages, setMessages] = useState([])
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    if (!user) return
    const callsQuery = query(collection(db, 'calls'), where('userId', '==', user.uid), orderBy('timestamp', 'desc'))
    const unsubCalls = onSnapshot(callsQuery, (snap) => setCalls(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    
    const msgsQuery = query(collection(db, 'messages'), where('userId', '==', user.uid), orderBy('timestamp', 'desc'))
    const unsubMsgs = onSnapshot(msgsQuery, (snap) => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    
    return () => { unsubCalls(); unsubMsgs(); }
  }, [user])

  const handleUpdate = async () => {
    if (newName) {
      await updateProfile(auth.currentUser, { displayName: newName })
      await updateDoc(doc(db, 'users', user.uid), { name: newName })
      setEditing(false)
    }
  }

  return (
    <div className="h-screen overflow-y-auto bg-gray-50 p-4 m-0">
      <CoinDisplay />
      <div className="max-w-md mx-auto pt-16 pb-20">
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-6 flex items-center gap-4 border border-gray-100">
          <img src={user?.photo || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-full border-4 border-blue-50 shadow-inner" />
          <div className="flex-1">
            {editing ? (
              <div className="flex gap-2">
                <input value={newName} onChange={e => setNewName(e.target.value)} className="border rounded px-2 w-full py-1 text-sm text-black" placeholder="New Name" />
                <button onClick={handleUpdate} className="bg-blue-600 text-white px-3 py-1 rounded text-xs">Save</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-800">{user?.name || 'User'}</h2>
                <Edit2 size={14} className="text-gray-400 cursor-pointer" onClick={() => setEditing(true)} />
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">{user?.email?.split('@')[0]}</p>
          </div>
          <LogOut size={20} className="text-red-400 cursor-pointer ml-auto" onClick={logout} />
        </div>

        <div className="flex bg-white rounded-2xl p-1 mb-6 shadow-sm border border-gray-100">
          <button onClick={() => setActiveTab('calls')} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${activeTab === 'calls' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-400'}`}><Phone size={16}/> Calls</button>
          <button onClick={() => setActiveTab('messages')} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${activeTab === 'messages' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-400'}`}><MessageCircle size={16}/> Chats</button>
        </div>

        <div className="space-y-3">
          {activeTab === 'calls' ? calls.map(call => (
            <div key={call.id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold uppercase">{call.strangerName?.[0] || 'S'}</div>
                <div><p className="text-sm font-bold text-gray-800">{call.strangerName || 'Stranger'}</p><p className="text-[10px] text-gray-400 uppercase">{call.duration} sec</p></div>
              </div>
              <p className="text-[10px] text-gray-400">{new Date(call.timestamp?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          )) : <p className="text-center text-gray-400 text-sm mt-10">No chat history available.</p>}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
