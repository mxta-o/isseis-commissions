import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // A production build with no API address would ship a site that calls nothing (or localhost).
  // Set VITE_API_URL to the API's address; set it to an empty value only if the API is served from the same origin.
  if (command === 'build') {
    const env = loadEnv(mode, '.', 'VITE_')
    if (!('VITE_API_URL' in env)) {
      throw new Error('VITE_API_URL is not set. Set it to the deployed API address before building (see client/.env.example).')
    }
  }
  return {
    server: {
      port: 3001,
    },
    plugins: [react(), tailwindcss()],
  }
})
