import { useAuth } from '../hooks/useAuth'
import { Coins } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const CoinDisplay = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-gray-900/80 backdrop-blur-md border border-gray-700 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg cursor-pointer hover:bg-gray-800 transition-all"
      onClick={() => navigate('/checkout')}
    >
      <Coins size={18} className="text-yellow-400 drop-shadow-md" />
      <span className="font-bold tracking-wide">{user.coins || 0}</span>
    </motion.div>
  )
}
export default CoinDisplay
