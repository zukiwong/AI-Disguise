// 用户数据同步服务 - Chrome Extension 专用
import { db, COLLECTIONS } from './firebase.js'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'

/**
 * 获取用户的自定义 styles
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} - 用户的 styles 数组
 */
export async function getUserStyles(userId) {
  try {
    console.log('正在获取用户 styles:', userId)

    const stylesRef = collection(db, COLLECTIONS.STYLES)
    const q = query(stylesRef, where('userId', '==', userId))
    const querySnapshot = await getDocs(q)

    const styles = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      styles.push({
        id: doc.id,
        displayName: data.displayName,
        description: data.description,
        promptTemplate: data.promptTemplate
      })
    })

    console.log('获取到用户 styles:', styles.length)
    return styles
  } catch (error) {
    console.error('获取用户 styles 失败:', error)
    return []
  }
}

/**
 * 获取用户的 API 配置
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} - API 配置对象
 */
export async function getUserApiConfig(userId) {
  try {
    console.log('正在获取用户 API 配置:', userId)

    const userRef = doc(db, COLLECTIONS.USERS, userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()
      const apiConfig = userData.apiConfig || {}

      console.log('获取到 API 配置:', apiConfig.provider || 'free')
      return {
        provider: apiConfig.provider || 'free',
        apiKey: apiConfig.apiKey || null,
        hasCustomKey: !!apiConfig.apiKey
      }
    }

    console.log('用户文档不存在，使用默认配置')
    return {
      provider: 'free',
      apiKey: null,
      hasCustomKey: false
    }
  } catch (error) {
    console.error('获取用户 API 配置失败:', error)
    return {
      provider: 'free',
      apiKey: null,
      hasCustomKey: false
    }
  }
}

/**
 * 同步用户数据到 Chrome Storage
 * @param {Object} user - 用户对象
 */
export async function syncUserData(user) {
  if (!user || !user.uid) {
    console.log('没有用户信息，跳过同步')
    return
  }

  try {
    console.log('开始同步用户数据:', user.uid)

    // 获取用户 styles
    const userStyles = await getUserStyles(user.uid)

    // 获取用户 API 配置
    const apiConfig = await getUserApiConfig(user.uid)

    // 保存到 Chrome Storage
    await chrome.storage.local.set({
      userStyles: userStyles,
      apiConfig: apiConfig
    })

    console.log('用户数据同步完成')
    console.log('- Styles:', userStyles.length, '个')
    console.log('- API Provider:', apiConfig.provider)

    return {
      success: true,
      userStyles,
      apiConfig
    }
  } catch (error) {
    console.error('同步用户数据失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
