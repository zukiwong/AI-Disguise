// Vercel 无服务器 API 路由
// 返回公共风格列表供 Chrome 插件使用

import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// 初始化 Firebase Admin（如果还没初始化）
if (getApps().length === 0) {
  // 从环境变量获取服务账号密钥
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      }

  initializeApp({
    credential: cert(serviceAccount)
  })
}

const db = getFirestore()

/**
 * 获取公共风格列表 API
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
export default async function handler(req, res) {
  // 设置 CORS 头部
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: '只支持 GET 请求'
    })
  }

  try {
    // 查询公共风格（isPublic = true）
    const stylesRef = db.collection('styles')
    const snapshot = await stylesRef
      .where('isPublic', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(100) // 限制返回数量
      .get()

    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        styles: []
      })
    }

    // 转换数据格式（不包含变体，简化版）
    const styles = []
    snapshot.forEach(doc => {
      const data = doc.data()
      styles.push({
        id: doc.id,
        displayName: data.displayName || data.name,
        description: data.description || '',
        promptTemplate: data.promptTemplate || '',
        createdBy: data.createdBy || 'system',
        usageCount: data.usageCount || 0,
        isPublic: true
      })
    })

    return res.status(200).json({
      success: true,
      styles: styles,
      count: styles.length
    })

  } catch (error) {
    console.error('获取公共风格失败:', error)

    return res.status(500).json({
      error: 'Internal server error',
      message: '获取风格列表失败，请稍后重试'
    })
  }
}
