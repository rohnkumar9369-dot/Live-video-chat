import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Call from './pages/Call'
import Dashboard from './pages/Dashboard'
import Checkout from './pages/Checkout'
import Admin from './pages/Admin'
import { Toaster } from 'react-hot-toast'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900 m-0">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-white font-semibold tracking-wide">Securely Loading...</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      {/* Toast notifications styling */}
      <Toaster position="top-center" toastOptions={{ duration: 3000, style: { background: '#333', color: '#fff' } }} />
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/call" element={user ? <Call /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/checkout" element={user ? <Checkout /> : <Navigate to="/login" />} />
        
        {/* Special Admin Route */}
        <Route path="/shiv-admin" element={<Admin />} />
        
        {/* Default Fallback Route */}
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
