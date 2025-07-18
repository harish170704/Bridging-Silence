import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Shim Node's global for browser libraries like sockjs-client
    global: 'window',
  },
})
