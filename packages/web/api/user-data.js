// Vercel Serverless Function - 获取用户数据（供 Chrome 扩展使用）
import admin from 'firebase-admin'

// 初始化 Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // 检查环境变量
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      console.error('缺少 Firebase Admin 环境变量')
      console.error('FIREBASE_PROJECT_ID:', !!process.env.FIREBASE_PROJECT_ID)
      console.error('FIREBASE_CLIENT_EMAIL:', !!process.env.FIREBASE_CLIENT_EMAIL)
      console.error('FIREBASE_PRIVATE_KEY:', !!process.env.FIREBASE_PRIVATE_KEY)
      throw new Error('Missing Firebase Admin environment variables')
    }

    // 使用 Vercel 环境变量中的 Firebase Admin 配置
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    })
    console.log('Firebase Admin 初始化成功')
  } catch (error) {
    console.error('Firebase Admin 初始化失败:', error)
    throw error
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

  // 检查 Firebase Admin 是否已初始化
  if (!admin.apps.length) {
    console.error('Firebase Admin 未初始化')
    return res.status(500).json({
      error: 'Firebase Admin not initialized',
      message: 'Missing Firebase Admin environment variables'
    })
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

    // 2. 获取用户文档（包含 addedStyles 和 apiConfig）
    const userRef = db.collection('users').doc(userId)
    const userDoc = await userRef.get()

    let styles = []
    let apiConfig = {
      provider: 'free',
      apiKey: null,
      hasCustomKey: false
    }

    if (!userDoc.exists) {
      console.log('用户文档不存在')
      return res.status(200).json({
        success: true,
        data: { styles: [], apiConfig }
      })
    }

    const userData = userDoc.data()

    // 3. 获取用户的私有 styles（My Styles）
    const myStylesQuery = db.collection('styles')
      .where('createdBy', '==', userId)
      .where('isPublic', '==', false)

    const myStylesSnapshot = await myStylesQuery.get()
    const myStyles = []
    myStylesSnapshot.forEach(doc => {
      const data = doc.data()
      myStyles.push({
        id: doc.id,
        displayName: data.displayName,
        description: data.description,
        promptTemplate: data.promptTemplate,
        isPublic: false,
        createdBy: userId
      })
    })
    console.log('获取到用户私有 styles:', myStyles.length, '个')

    // 4. 获取用户添加的公共 styles（Added Public Styles）
    const addedStyleIds = userData.addedStyles || []
    console.log('用户添加的公共 style IDs:', addedStyleIds.length, '个')

    let addedPublicStyles = []
    if (addedStyleIds.length > 0) {
      // 查询所有公共 styles
      const publicStylesQuery = db.collection('styles').where('isPublic', '==', true)
      const publicStylesSnapshot = await publicStylesQuery.get()

      publicStylesSnapshot.forEach(doc => {
        // 只返回用户添加的公共 styles
        if (addedStyleIds.includes(doc.id)) {
          const data = doc.data()
          addedPublicStyles.push({
            id: doc.id,
            displayName: data.displayName,
            description: data.description,
            promptTemplate: data.promptTemplate,
            isPublic: true,
            createdBy: data.createdBy
          })
        }
      })
      console.log('获取到用户添加的公共 styles:', addedPublicStyles.length, '个')
    }

    // 5. 合并所有 styles
    styles = [...myStyles, ...addedPublicStyles]
    console.log('总共获取到 styles:', styles.length, '个')

    // 6. 获取用户的 API 配置
    console.log('🔍 开始处理 API 配置，userData.apiConfig 存在:', !!userData.apiConfig)

    if (userData.apiConfig) {
      const mode = userData.apiConfig.mode || 'free'
      const activeProvider = userData.apiConfig.activeProvider
      console.log('📋 API 配置详情:', {
        mode,
        activeProvider,
        hasCustomApis: !!userData.apiConfig.customApis,
        customApisKeys: userData.apiConfig.customApis ? Object.keys(userData.apiConfig.customApis) : []
      })

      let decodedApiKey = null

      // 如果用户设置了自定义 API
      if (mode === 'custom' && activeProvider && userData.apiConfig.customApis?.[activeProvider]) {
        const customApi = userData.apiConfig.customApis[activeProvider]
        console.log('✅ 找到自定义 API 配置:', activeProvider, '模型:', customApi.model)

        // 解码 Base64 编码的 API Key
        try {
          decodedApiKey = Buffer.from(customApi.apiKey, 'base64').toString('ascii')
          console.log('✅ API Key 解码成功，长度:', decodedApiKey.length)
        } catch (error) {
          console.error('❌ 解码 API Key 失败:', error)
        }

        apiConfig = {
          provider: activeProvider,
          apiKey: decodedApiKey,
          hasCustomKey: true,
          model: customApi.model
        }
      } else {
        // 免费模式
        console.log('ℹ️ 使用免费模式，原因:',
          !mode || mode !== 'custom' ? 'mode 不是 custom' :
          !activeProvider ? '没有 activeProvider' :
          !userData.apiConfig.customApis?.[activeProvider] ? '找不到对应的 customApis' : '未知')

        apiConfig = {
          provider: 'free',
          apiKey: null,
          hasCustomKey: false
        }
      }
    } else {
      console.log('⚠️ userData.apiConfig 不存在，使用默认配置')
    }
    console.log('📤 最终返回的 API 配置，provider:', apiConfig.provider, 'hasCustomKey:', apiConfig.hasCustomKey)

    // 4.  返回数据
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
