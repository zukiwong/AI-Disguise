// 用户数据同步服务 - Chrome Extension 专用
// 通过 Vercel API 获取用户数据，避免直接访问 Firestore

/**
 * 通过 API 获取用户数据（styles 和 API 配置）
 * @param {string} authToken - Firebase Auth Token
 * @returns {Promise<Object>} - 包含 styles 和 apiConfig 的对象
 */
export async function fetchUserDataFromAPI(authToken) {
  try {
    console.log('通过 API 获取用户数据...')

    const response = await fetch('https://ai-disguise.vercel.app/api/user-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API 请求失败:', response.status, errorText)
      throw new Error(`API request failed: ${response.status}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'API returned error')
    }

    console.log('成功获取用户数据:')
    console.log('- Styles:', result.data.styles.length, '个')
    console.log('- API Provider:', result.data.apiConfig.provider)

    return result.data
  } catch (error) {
    console.error('获取用户数据失败:', error)
    return {
      styles: [],
      apiConfig: {
        provider: 'free',
        apiKey: null,
        hasCustomKey: false
      }
    }
  }
}

/**
 * 同步用户数据到 Chrome Storage
 * @param {Object} user - 用户对象（必须包含 authToken）
 */
export async function syncUserData(user) {
  if (!user || !user.uid) {
    console.log('没有用户信息，跳过同步')
    return { success: false, error: 'No user info' }
  }

  if (!user.authToken) {
    console.log('没有 auth token，跳过同步')
    return { success: false, error: 'No auth token' }
  }

  try {
    console.log('开始同步用户数据:', user.uid)

    // 通过 API 获取用户数据
    const userData = await fetchUserDataFromAPI(user.authToken)

    // 保存到 Chrome Storage
    await chrome.storage.local.set({
      userStyles: userData.styles,
      apiConfig: userData.apiConfig
    })

    console.log('用户数据同步完成')
    console.log('- Styles:', userData.styles.length, '个')
    console.log('- API Provider:', userData.apiConfig.provider)

    return {
      success: true,
      userStyles: userData.styles,
      apiConfig: userData.apiConfig
    }
  } catch (error) {
    console.error('同步用户数据失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
