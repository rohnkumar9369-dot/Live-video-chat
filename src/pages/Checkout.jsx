import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { generateIndianMobile } from '../utils/generateIndianMobile'
import { motion } from 'framer-motion'
import { Shield, Copy, Coins, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

const packages = [
  { price: 99, coins: 120 },
  { price: 199, coins: 250 },
  { price: 499, coins: 600 },
  { price: 999, coins: 1200 },
  { price: 1999, coins: 2400 },
  { price: 4999, coins: 6000 },
]

const Checkout = () => {
  const { user } = useAuth()
  const [phone] = useState(generateIndianMobile())

  const handlePurchase = (pkg) => {
    let baseUrl = ""
    
    // Price ke hisaab se .env se sahi link uthana
    if (pkg.price === 99) baseUrl = import.meta.env.VITE_SUPERPROFILE_LINK_99
    else if (pkg.price === 199) baseUrl = import.meta.env.VITE_SUPERPROFILE_LINK_199
    else if (pkg.price === 499) baseUrl = import.meta.env.VITE_SUPERPROFILE_LINK_499
    else if (pkg.price === 999) baseUrl = import.meta.env.VITE_SUPERPROFILE_LINK_999
    else if (pkg.price === 1999) baseUrl = import.meta.env.VITE_SUPERPROFILE_LINK_1999
    else if (pkg.price === 4999) baseUrl = import.meta.env.VITE_SUPERPROFILE_LINK_4999

    if (!baseUrl || baseUrl === "") {
      toast.error("Payment link setup bacha hai.")
      return
    }

    // Silent Page Skip Logic & Direct Checkout Trigger
    const checkoutUrl = `${baseUrl}?uid=${user?.uid || ''}&direct_checkout=true&skip_details=1`
    
    // Asli payment gateway par bhejna
    window.location.href = checkoutUrl
  }

  return (
    <div className="h-screen overflow-y-auto bg-gray-100 p-4 m-0">
      <div className="max-w-md mx-auto pt-8">
        
        {/* Privacy Box */}
        <div className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800"><Shield size={20} className="text-green-600"/> Privacy Mode</h2>
          <div className="flex items-center justify-between border border-gray-200 bg-gray-50 p-3 rounded-lg">
            <span className="text-gray-700 font-medium tracking-wide"> +91 {phone}</span>
            <button onClick={() => { navigator.clipboard.writeText(phone); toast.success('Copied!') }} className="p-2 text-gray-500 hover:text-gray-800 transition">
              <Copy size={18} />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">Auto-linked: {user?.email} (UID: {user?.uid})</p>
        </div>

        {/* Coin Packages List */}
        <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-gray-800"><Coins size={20} className="text-yellow-500"/> Buy Coins</h2>
        <div className="grid grid-cols-2 gap-3 pb-8">
          {packages.map((pkg) => (
            <motion.button
              key={pkg.price}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePurchase(pkg)}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                Fast Checkout
              </div>
              <span className="text-2xl font-black text-blue-700 mt-2">{pkg.price}</span>
              <span className="block text-sm font-semibold text-gray-600 mt-1">{pkg.coins} Coins</span>
              <div className="mt-3 flex items-center gap-1 text-[11px] text-gray-400">
                <ExternalLink size={12}/> SuperProfile
              </div>
            </motion.button>
          ))}
        </div>

      </div>
    </div>
  )
}
export default Checkout
