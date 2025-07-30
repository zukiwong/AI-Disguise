import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 简单的API插件，用于开发环境
const apiPlugin = (env = {}) => {
  return {
    name: 'api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/disguise', async (req, res, next) => {
        if (req.method === 'POST') {
          try {
            // 导入API处理函数
            const { default: handler } = await import('./api/disguise.js')
            
            let body = ''
            req.on('data', chunk => {
              body += chunk.toString()
            })
            
            req.on('end', async () => {
              try {
                req.body = JSON.parse(body)
                
                // 设置环境变量供API函数使用
                process.env.GEMINI_API_KEY = env.GEMINI_API_KEY
                process.env.MOCK_API = env.MOCK_API
                
                // 创建模拟的res对象
                const mockRes = {
                  status: (code) => ({
                    json: (data) => {
                      res.statusCode = code
                      res.setHeader('Content-Type', 'application/json')
                      res.end(JSON.stringify(data))
                    }
                  }),
                  json: (data) => {
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify(data))
                  }
                }
                
                // 调用API处理函数
                await handler(req, mockRes)
              } catch (error) {
                console.error('API处理错误:', error)
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  error: 'Internal Server Error',
                  message: error.message
                }))
              }
            })
          } catch (error) {
            console.error('API导入错误:', error)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              error: 'Internal Server Error',
              message: 'API处理模块加载失败'
            }))
          }
        } else {
          next()
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react(), apiPlugin(env)],
    define: {
      // 使环境变量在客户端代码中可用（以VITE_前缀）
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.MOCK_API': JSON.stringify(env.MOCK_API),
    }
  }
})
