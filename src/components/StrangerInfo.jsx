import { countries } from '../utils/countries'

const StrangerInfo = ({ info }) => {
  if (!info) return null
  
  // Agar country nahi milti toh global icon dikhayega
  const country = countries.find(c => c.code === info.country) || { flag: '🌍', name: 'Global' }
  
  return (
    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-lg z-50 border border-gray-700 m-0">
      <span className="text-lg drop-shadow-md">{country.flag}</span>
      <span className="font-bold tracking-wide">{info.name || 'Stranger'}</span>
      
      {/* Gender Indicator */}
      {info.gender && (
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${info.gender === 'male' ? 'bg-blue-500/50 text-blue-100' : info.gender === 'female' ? 'bg-pink-500/50 text-pink-100' : 'bg-gray-500/50 text-white'}`}>
          {info.gender === 'male' ? '♂' : info.gender === 'female' ? '♀' : ''}
        </span>
      )}
    </div>
  )
}
export default StrangerInfo
