import { useAuth } from '../hooks/useAuth'
import { motion } from 'framer-motion'
import { LogIn, Video } from 'lucide-react'

const Login = () => {
  const { login } = useAuth()

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 m-0 overflow-hidden">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl text-center border border-white/10 shadow-2xl max-w-sm w-full mx-4"
      >
        <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/50">
          <Video size={32} className="text-white" />
        </div>
        
        <h1 className="text-3xl font-black text-white mb-2 tracking-wide">Live Video Chat</h1>
        <p className="text-gray-400 mb-8 text-sm font-medium">Connect with strangers instantly</p>
        
        <button
          onClick={login}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 px-6 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-xl active:scale-95"
        >
          <LogIn size={20} className="text-blue-600" /> 
          Continue with Google
        </button>
        
        <p className="text-xs text-gray-500 mt-6">
          Sign up today and get <span className="text-yellow-500 font-bold">20 Free Coins</span>!
        </p>
      </motion.div>
    </div>
  )
}
export default Login
