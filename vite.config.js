import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // For local dev run: npx vercel dev  (handles both frontend + api functions)
  // vite dev server is frontend-only — api calls need vercel dev
})
