// Vercel Serverless Function - 获取用户数据（供 Chrome 扩展使用）
import admin from 'firebase-admin'

// 初始化 Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // 使用 Vercel 环境变量中的 Firebase Admin 配置
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    })
  } catch (error) {
    console.error('Firebase Admin 初始化失败:', error)
  }
}

const db = admin.firestore()

/**
 * 获取用户数据 API
 * POST /api/user-data
 *
 * Request Headers:
 *   Authorization: Bearer <firebase-auth-token>
 *
 * Response:
 *   {
 *     success: true,
 *     data: {
 *       styles: [...],
 *       apiConfig: {...}
 *     }
 *   }
 */
export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 1. 验证 Auth Token
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' })
    }

    const token = authHeader.substring(7) // 移除 "Bearer " 前缀

    // 验证 token
    let decodedToken
    try {
      decodedToken = await admin.auth().verifyIdToken(token)
    } catch (error) {
      console.error('Token 验证失败:', error)
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    const userId = decodedToken.uid
    console.log('获取用户数据，userId:', userId)

    // 2. 获取用户的 styles
    const stylesRef = db.collection('styles')
    const stylesQuery = stylesRef.where('userId', '==', userId)
    const stylesSnapshot = await stylesQuery.get()

    const styles = []
    stylesSnapshot.forEach(doc => {
      const data = doc.data()
      styles.push({
        id: doc.id,
        displayName: data.displayName,
        description: data.description,
        promptTemplate: data.promptTemplate
      })
    })

    console.log('获取到用户 styles:', styles.length, '个')

    // 3. 获取用户的 API 配置
    const userRef = db.collection('users').doc(userId)
    const userDoc = await userRef.get()

    let apiConfig = {
      provider: 'free',
      apiKey: null,
      hasCustomKey: false
    }

    if (userDoc.exists) {
      const userData = userDoc.data()
      if (userData.apiConfig) {
        apiConfig = {
          provider: userData.apiConfig.provider || 'free',
          apiKey: userData.apiConfig.apiKey || null,
          hasCustomKey: !!userData.apiConfig.apiKey
        }
      }
    }

    console.log('获取到 API 配置，provider:', apiConfig.provider)

    // 4. 返回数据
    return res.status(200).json({
      success: true,
      data: {
        styles,
        apiConfig
      }
    })

  } catch (error) {
    console.error('获取用户数据失败:', error)
    return res.status(500).json({
      error: 'Failed to fetch user data',
      message: error.message
    })
  }
}
