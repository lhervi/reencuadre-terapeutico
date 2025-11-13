import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuración de Vite
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy local para llamadas a la función de Netlify durante desarrollo
      '/.netlify/functions': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/\.netlify\/functions/, '/.netlify/functions'),
      },
    },
  },
  build: {
    outDir: 'dist',
  },
})
