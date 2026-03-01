import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Mobile testing aur Termux/Acode environment ke liye perfect setup
export default defineConfig({
  plugins: [react()],
  server: { 
    host: true, // Ise true rakhne se hi aap local IP par website check kar payenge
    port: 5173,
    strictPort: true,
  }
})
