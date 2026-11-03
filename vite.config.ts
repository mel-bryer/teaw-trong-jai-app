import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' keeps every asset path relative, so the build also runs as a claude.ai Artifact or from any static host.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: true },
  build: { chunkSizeWarningLimit: 2000 },
})
