import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json' with { type: 'json' }
import fs from 'fs'
import path from 'path'

// 修复 Service Worker 的插件
const fixServiceWorker = () => {
  const fix = () => {
    const distPath = path.resolve(__dirname, 'dist')
    const manifestPath = path.resolve(distPath, 'manifest.json')
    const swLoaderPath = path.resolve(distPath, 'service-worker-loader.js')
    const swSourcePath = path.resolve(__dirname, 'src/background/service-worker.js')
    const swDestPath = path.resolve(distPath, 'service-worker.js')

    if (fs.existsSync(manifestPath)) {
      const content = fs.readFileSync(manifestPath, 'utf-8')
      const manifest = JSON.parse(content)

      // 删除 type: "module"
      if (manifest.background && manifest.background.type === 'module') {
        delete manifest.background.type
      }

      // 如果使用了 service-worker-loader.js，替换为直接的 service-worker.js
      if (manifest.background && manifest.background.service_worker === 'service-worker-loader.js') {
        // 复制原始的 service worker 文件
        if (fs.existsSync(swSourcePath)) {
          fs.copyFileSync(swSourcePath, swDestPath)
          console.log('✓ Copied service worker file')
        }

        // 更新 manifest 指向原始文件
        manifest.background.service_worker = 'service-worker.js'

        // 删除 service-worker-loader.js
        if (fs.existsSync(swLoaderPath)) {
          fs.unlinkSync(swLoaderPath)
          console.log('✓ Removed service-worker-loader.js')
        }
      }

      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
      console.log('✓ Fixed service worker configuration')
    }
  }

  return {
    name: 'fix-service-worker',
    closeBundle: fix
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
        options: path.resolve(__dirname, 'src/options/options.html'),
        // 显式添加 content script 入口
        content: path.resolve(__dirname, 'src/content/index.js')
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
