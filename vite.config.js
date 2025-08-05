import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: 'src/client',
  build: {
    outDir: '../../dist',
    emptyOutDir: true
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',  // Naprawione - backend działa na 3001
        changeOrigin: true
      },
      '/audio': {
        target: 'http://localhost:3001',  // Naprawione - backend działa na 3001
        changeOrigin: true
      },
      '/arkusze': {
        target: 'http://localhost:3001',  // Naprawione - backend działa na 3001
        changeOrigin: true
      },
      '/series-images': {
        target: 'http://localhost:3001',  // Dodano proxy dla grafiki serii
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/client')
    }
  }
})