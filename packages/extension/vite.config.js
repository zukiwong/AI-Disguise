import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json' with { type: 'json' }

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest })
  ],
  resolve: {
    alias: {
      '@shared': new URL('../shared/src', import.meta.url).pathname
    }
  },
  server: {
    port: 5176,
    strictPort: false
  }
})
