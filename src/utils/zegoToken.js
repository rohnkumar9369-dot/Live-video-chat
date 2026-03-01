import CryptoJS from 'crypto-js'

// Automatic token generator: Har call par naya token banega jo 24 ghante tak valid rahega
export const generateZegoToken = (appID, serverSecret, userID) => {
  if (!appID || !serverSecret || !userID) return null

  const expireSeconds = 86400 // 24 hours validity (kabhi expire nahi hoga beech call mein)
  const timestamp = Math.floor(Date.now() / 1000)
  const expire = timestamp + expireSeconds

  const payload = {
    app_id: Number(appID),
    user_id: String(userID), // ZegoCloud ke liye user_id string honi chahiye
    nonce: Math.floor(Math.random() * 1e9),
    ctime: timestamp,
    expire: expire,
  }

  const message = JSON.stringify(payload)
  const signature = CryptoJS.HmacSHA256(message, serverSecret).toString(CryptoJS.enc.Hex)
  const token = `${btoa(message)}.${signature}`

  return token
}
