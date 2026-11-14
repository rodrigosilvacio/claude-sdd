import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // No GitHub Pages o site fica em /<repositório>/ (definido pelo workflow em VITE_BASE).
  base: process.env.VITE_BASE ?? '/',
})
