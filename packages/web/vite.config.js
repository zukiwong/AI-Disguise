import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 简单的API插件，用于开发环境
const apiPlugin = (env = {}) => {
  // 通用的 API 处理函数
  const createApiHandler = (apiPath) => async (req, res, next) => {
    if (req.method !== 'POST') {
      next()
      return
    }

    try {
      // 动态导入 API 处理函数
      const { default: handler } = await import(`./api/${apiPath}.js`)

      let body = ''
      req.on('data', chunk => {
        body += chunk.toString()
      })

      req.on('end', async () => {
        try {
          req.body = JSON.parse(body)

          // 设置环境变量供 API 函数使用
          if (env.GEMINI_API_KEY) {
            process.env.GEMINI_API_KEY = env.GEMINI_API_KEY
          }
          if (env.MOCK_API) {
            process.env.MOCK_API = env.MOCK_API
          }

          // 创建模拟的 res 对象，完整支持 Vercel 的 res API
          const mockRes = {
            statusCode: 200,
            headers: {},
            setHeader: (key, value) => {
              mockRes.headers[key] = value
              res.setHeader(key, value)
            },
            status: (code) => {
              mockRes.statusCode = code
              return {
                json: (data) => {
                  res.statusCode = code
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify(data))
                },
                end: () => {
                  res.statusCode = code
                  res.end()
                }
              }
            },
            json: (data) => {
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(data))
            },
            end: (data) => {
              res.end(data)
            }
          }

          // 调用 API 处理函数
          await handler(req, mockRes)
        } catch (error) {
          console.error('API processing error:', error)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            error: 'Internal Server Error',
            message: error.message
          }))
        }
      })
    } catch (error) {
      console.error('API import error:', error)
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({
        error: 'Internal Server Error',
        message: 'API processing module failed to load'
      }))
    }
  }

  return {
    name: 'api-plugin',
    configureServer(server) {
      // 注册 /api/disguise 路由
      server.middlewares.use('/api/disguise', createApiHandler('disguise'))

      // 注册 /api/test-api-key 路由
      server.middlewares.use('/api/test-api-key', createApiHandler('test-api-key'))
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react(), apiPlugin(env)]
  }
})
