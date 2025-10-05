import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json' with { type: 'json' }
import fs from 'fs'
import path from 'path'

// 修复 Service Worker 的插件
const fixServiceWorker = () => {
  const fix = () => {
    const manifestPath = path.resolve(__dirname, 'dist/manifest.json')
    if (fs.existsSync(manifestPath)) {
      const content = fs.readFileSync(manifestPath, 'utf-8')
      const manifest = JSON.parse(content)
      if (manifest.background && manifest.background.type === 'module') {
        delete manifest.background.type
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
        console.log('✓ Removed type: "module" from service worker')
      }
    }
  }

  return {
    name: 'fix-service-worker',
    closeBundle: fix,
    configureServer(server) {
      // 监听 manifest 文件变化
      const distPath = path.resolve(__dirname, 'dist')
      if (!fs.existsSync(distPath)) {
        fs.mkdirSync(distPath, { recursive: true })
      }

      const watcher = fs.watch(distPath, { recursive: true }, (eventType, filename) => {
        if (filename === 'manifest.json') {
          setTimeout(fix, 100) // 延迟执行，确保文件写入完成
        }
      })

      server.httpServer?.on('close', () => watcher.close())
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
    fixServiceWorker()
  ],
  build: {
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'src/popup/popup.html'),
        options: path.resolve(__dirname, 'src/options/options.html')
      }
    }
  },
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
