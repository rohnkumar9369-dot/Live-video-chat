import { useState } from 'react'
import { countries } from '../utils/countries'

const FiltersModal = ({ onApply }) => {
  const [gender, setGender] = useState('both')
  const [region, setRegion] = useState('global')
  const [callType, setCallType] = useState('random') // random (10) ya profile (40)

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 m-0">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-2xl font-black text-gray-800 mb-6 text-center">Start Connection</h2>
        
        {/* Match Type Selection (10 vs 40 coins) */}
        <div className="mb-5">
          <label className="block mb-2 font-bold text-gray-700 text-sm">Match Type</label>
          <div className="flex gap-2">
            <button 
              onClick={() => setCallType('random')}
              className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${callType === 'random' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              Random (10 🪙/m)
            </button>
            <button 
              onClick={() => setCallType('profile')}
              className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${callType === 'profile' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              Profile (40 🪙/m)
            </button>
          </div>
        </div>

        {/* Gender Preference */}
        <div className="mb-5">
          <label className="block mb-2 font-bold text-gray-700 text-sm">Gender Preference</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full border-2 border-gray-200 bg-gray-50 p-3 rounded-xl font-medium text-gray-700 outline-none focus:border-blue-500 focus:bg-white transition-all">
            <option value="both">Both (Anyone)</option>
            <option value="male">Male Only</option>
            <option value="female">Female Only</option>
          </select>
        </div>

        {/* Region Preference */}
        <div className="mb-6">
          <label className="block mb-2 font-bold text-gray-700 text-sm">Region Preference</label>
          <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full border-2 border-gray-200 bg-gray-50 p-3 rounded-xl font-medium text-gray-700 outline-none focus:border-blue-500 focus:bg-white transition-all">
            <option value="global">Global (Anywhere)</option>
            {countries.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
          </select>
        </div>

        <button 
          onClick={() => onApply({ gender, region, type: callType })} 
          className={`w-full py-4 rounded-xl font-black text-white text-lg shadow-lg hover:shadow-xl transition-all ${callType === 'random' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30'}`}
        >
          Start Video Call
        </button>
      </div>
    </div>
  )
}
export default FiltersModal
