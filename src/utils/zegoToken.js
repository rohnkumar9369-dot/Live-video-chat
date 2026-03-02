import CryptoJS from 'crypto-js';

export const generateZegoToken = (appID, serverSecret, userID) => {
  if (!appID || !serverSecret || !userID) return null;

  try {
    const time = Math.floor(Date.now() / 1000);
    const body = {
      app_id: Number(appID),
      user_id: String(userID),
      nonce: Math.floor(Math.random() * 2147483647),
      ctime: time,
      expire: time + 7200,
      payload: ""
    };

    const key = CryptoJS.enc.Utf8.parse(serverSecret);
    let iv = Math.random().toString().substring(2, 18);
    if (iv.length < 16) iv += iv.substring(0, 16 - iv.length);

    const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(body), key, { iv: CryptoJS.enc.Utf8.parse(iv) }).toString();
    const ciphert = new Uint8Array(Array.from(atob(ciphertext)).map((val) => val.charCodeAt(0)));
    const len_ciphert = ciphert.length;

    const uint8 = new Uint8Array(8 + 2 + 16 + 2 + len_ciphert);
    
    // expire: 8
    uint8.set([0, 0, 0, 0]);
    uint8.set(new Uint8Array(new Int32Array([body.expire]).buffer).reverse(), 4);
    
    // iv length: 2
    uint8[8] = iv.length >> 8;
    uint8[9] = iv.length - (uint8[8] << 8);
    
    // iv: 16
    uint8.set(new Uint8Array(Array.from(iv).map((val) => val.charCodeAt(0))), 10);
    
    // ciphertext length: 2
    uint8[26] = len_ciphert >> 8;
    uint8[27] = len_ciphert - (uint8[26] << 8);
    
    // ciphertext
    uint8.set(ciphert, 28);

    const token = "04" + btoa(String.fromCharCode.apply(null, Array.from(uint8)));
    return token;
  } catch (error) {
    console.error("Token Generate Error:", error);
    return null;
  }
};
