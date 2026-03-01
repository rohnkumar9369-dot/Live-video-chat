import { useState, useEffect } from 'react'
import { db, auth, googleProvider } from '../firebase'
import { collection, onSnapshot, query, orderBy, doc, updateDoc, increment, getDocs } from 'firebase/firestore'
import { signInWithPopup, signInWithRedirect } from 'firebase/auth'

const Admin = () => {
  const [adminUser, setAdminUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAdminUser(user)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!adminUser) return

    // Live Payments History
    const q = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    // Load Users
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, 'users'))
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    fetchUsers()

    return () => unsub()
  }, [adminUser])

  const handleAdminLogin = async () => {
    try {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
      if (isIOS || isSafari) {
        await signInWithRedirect(auth, googleProvider)
      } else {
        await signInWithPopup(auth, googleProvider)
      }
    } catch (error) {
      console.error("Admin login error", error)
    }
  }

  const blockUser = async (uid, blocked) => {
    await updateDoc(doc(db, 'users', uid), { blocked: !blocked })
    // Refresh user list locally
    setUsers(users.map(u => u.id === uid ? { ...u, blocked: !blocked } : u))
  }

  const addCoins = async (uid) => {
    const amount = prompt('Enter coins to add:')
    if (amount && !isNaN(amount)) {
      await updateDoc(doc(db, 'users', uid), { coins: increment(Number(amount)) })
      alert(`Successfully added ${amount} coins.`)
    }
  }

  // Bina Password Ke Sirf Google Login
  if (!adminUser) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-900 m-0">
        <h1 className="text-3xl font-bold text-white mb-8">Shiv Admin Panel</h1>
        <button onClick={handleAdminLogin} className="bg-white text-gray-900 px-8 py-3 rounded-full font-bold shadow-lg hover:bg-gray-100 transition">
          Secure Google Login
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 overflow-y-auto h-screen bg-gray-50 m-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Shiv Admin Dashboard</h1>
        <button onClick={() => auth.signOut()} className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded-full font-semibold">Logout</button>
      </div>

      {/* Payment Box */}
      <div className="bg-white border border-green-200 p-4 rounded-xl mb-6 shadow-sm">
        <h2 className="font-bold text-green-700 mb-2">💰 Live Payments</h2>
        <div className="max-h-40 overflow-y-auto">
          {transactions.map(t => (
            <div key={t.id} className="border-b border-gray-100 py-2 text-sm text-gray-700">
              <span className="font-medium">{t.email}</span> paid <span className="font-bold text-green-600">₹{t.amount}</span> ({t.coins} coins)
            </div>
          ))}
          {transactions.length === 0 && <p className="text-xs text-gray-400">No transactions yet.</p>}
        </div>
      </div>

      {/* Users Control Table */}
      <input
        type="text"
        placeholder="Search users by email or name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-300 p-3 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
      />
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Coins</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.filter(u => u.email?.toLowerCase().includes(search.toLowerCase()) || u.name?.toLowerCase().includes(search.toLowerCase())).map(u => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-3">
                  <div className="font-medium text-gray-800">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </td>
                <td className="p-3 font-semibold text-yellow-600">{u.coins}</td>
                <td className="p-3">
                  {u.blocked ? <span className="text-red-500 text-xs font-bold bg-red-100 px-2 py-1 rounded">BLOCKED</span> : <span className="text-green-500 text-xs font-bold bg-green-100 px-2 py-1 rounded">ACTIVE</span>}
                </td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => blockUser(u.id, u.blocked)} className={`text-xs font-bold px-3 py-1 rounded ${u.blocked ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.blocked ? 'Unblock' : 'Block'}
                  </button>
                  <button onClick={() => addCoins(u.id)} className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded">
                    + Coins
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
export default Admin
