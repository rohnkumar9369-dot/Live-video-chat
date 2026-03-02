import CryptoJS from 'crypto-js'

export const generateZegoToken = (appID, serverSecret, userID) => {
  if (!appID || !serverSecret || !userID) return null;

  try {
    const expireSeconds = 86400;
    const timestamp = Math.floor(Date.now() / 1000);
    const expire = timestamp + expireSeconds;

    const payload = {
      app_id: Number(appID),
      user_id: String(userID),
      nonce: Math.floor(Math.random() * 1e9),
      ctime: timestamp,
      expire: expire
    };

    const message = JSON.stringify(payload);
    const signature = CryptoJS.HmacSHA256(message, serverSecret).toString(CryptoJS.enc.Hex);
    
    // Yahan Backticks (`) ka use kiya gaya hai taaki token asli bane!
    const token = `${btoa(message)}.${signature}`;
    
    return token;
  } catch (error) {
    console.error("Token Generate Error:", error);
    return null;
  }
}

