// Privacy mode ke liye fake 10-digit Indian mobile number generator
export const generateIndianMobile = () => {
  // Indian mobile numbers always start with 6, 7, 8, or 9
  const firstDigit = Math.floor(Math.random() * 4) + 6
  // Baaki ke 9 digits randomly generate karna
  const rest = Math.floor(Math.random() * 1e9).toString().padStart(9, '0')
  return `${firstDigit}${rest}`
}
