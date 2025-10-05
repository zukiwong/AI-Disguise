// API 配置管理服务
// 负责用户自定义 API Key 的存储和管理

import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db, COLLECTIONS } from './firebase.js'

// 支持的 AI 提供商配置
export const AI_PROVIDERS = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'High free quota, fast response',
    models: [
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Recommended)' },
      { id: 'gemini-pro', name: 'Gemini Pro' }
    ],
    defaultModel: 'gemini-2.0-flash-exp',
    getApiKeyUrl: 'https://aistudio.google.com/apikey',
    freeQuota: 'High'
  },
  openai: {
    id: 'openai',
    name: 'OpenAI GPT',
    description: 'Powerful but requires payment',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Recommended)' },
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'o1-preview', name: 'O1 Preview' },
      { id: 'o1-mini', name: 'O1 Mini' }
    ],
    defaultModel: 'gpt-4o-mini',
    getApiKeyUrl: 'https://platform.openai.com/api-keys',
    freeQuota: 'None (Paid only)'
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'High quality responses',
    models: [
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku (Recommended)' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' }
    ],
    defaultModel: 'claude-3-haiku-20240307',
    getApiKeyUrl: 'https://console.anthropic.com/',
    freeQuota: 'Limited'
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'Affordable and efficient',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat' }
    ],
    defaultModel: 'deepseek-chat',
    getApiKeyUrl: 'https://platform.deepseek.com/',
    freeQuota: 'Moderate'
  }
}

// 免费模式配置
export const FREE_MODE_CONFIG = {
  dailyLimit: 20,
  resetHour: 0 // UTC 时间 0 点重置
}

/**
 * 获取用户的 API 配置
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} - API 配置对象
 */
export async function getUserApiConfig(userId) {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()

      // 返回默认配置如果不存在
      if (!userData.apiConfig) {
        return {
          mode: 'free',
          customApis: {},
          activeProvider: null,
          freeUsage: {
            count: 0,
            lastReset: new Date().toISOString().split('T')[0],
            dailyLimit: FREE_MODE_CONFIG.dailyLimit
          }
        }
      }

      return userData.apiConfig
    }

    return null
  } catch (error) {
    console.error('获取 API 配置失败:', error)
    throw error
  }
}

/**
 * 更新用户的 API 配置
 * @param {string} userId - 用户 ID
 * @param {Object} apiConfig - API 配置对象
 * @returns {Promise<boolean>} - 是否成功
 */
export async function updateUserApiConfig(userId, apiConfig) {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId)

    await updateDoc(userRef, {
      apiConfig: apiConfig,
      updatedAt: serverTimestamp()
    })

    return true
  } catch (error) {
    console.error('更新 API 配置失败:', error)
    throw error
  }
}

/**
 * 添加或更新自定义 API Key
 *
 * ⚠️ 安全说明：
 * - API Key 使用 Base64 编码存储在 Firestore（仅为防止意外泄露，不是真正的加密）
 * - Firestore 安全规则确保只有用户本人可以读取自己的 API Key
 * - 传输过程使用 HTTPS 加密
 * - 建议使用具有使用限制的 API Key（如设置每日额度、IP 白名单等）
 *
 * @param {string} userId - 用户 ID
 * @param {string} provider - 提供商 ID
 * @param {string} apiKey - API Key
 * @param {string} model - 模型 ID
 * @returns {Promise<boolean>} - 是否成功
 */
export async function saveCustomApiKey(userId, provider, apiKey, model) {
  try {
    const currentConfig = await getUserApiConfig(userId)

    // Base64 编码（仅为防止意外泄露，不是加密）
    const encodedKey = btoa(apiKey)

    const updatedConfig = {
      ...currentConfig,
      mode: 'custom',
      activeProvider: provider,
      customApis: {
        ...currentConfig.customApis,
        [provider]: {
          apiKey: encodedKey,
          model: model,
          enabled: true,
          createdAt: new Date().toISOString()
        }
      }
    }

    await updateUserApiConfig(userId, updatedConfig)
    return true
  } catch (error) {
    console.error('保存自定义 API Key 失败:', error)
    throw error
  }
}

/**
 * 删除自定义 API Key
 * @param {string} userId - 用户 ID
 * @param {string} provider - 提供商 ID
 * @returns {Promise<boolean>} - 是否成功
 */
export async function deleteCustomApiKey(userId, provider) {
  try {
    const currentConfig = await getUserApiConfig(userId)

    // 删除指定提供商的配置
    const updatedCustomApis = { ...currentConfig.customApis }
    delete updatedCustomApis[provider]

    // 如果删除的是当前激活的提供商，切换回免费模式
    const updatedConfig = {
      ...currentConfig,
      customApis: updatedCustomApis,
      mode: Object.keys(updatedCustomApis).length === 0 ? 'free' : currentConfig.mode,
      activeProvider: currentConfig.activeProvider === provider ? null : currentConfig.activeProvider
    }

    await updateUserApiConfig(userId, updatedConfig)
    return true
  } catch (error) {
    console.error('删除自定义 API Key 失败:', error)
    throw error
  }
}

/**
 * 切换 API 模式
 * @param {string} userId - 用户 ID
 * @param {string} mode - 模式 ('free' | 'custom')
 * @param {string} provider - 提供商 ID (仅在 custom 模式下需要)
 * @returns {Promise<boolean>} - 是否成功
 */
export async function switchApiMode(userId, mode, provider = null) {
  try {
    const currentConfig = await getUserApiConfig(userId)

    const updatedConfig = {
      ...currentConfig,
      mode: mode,
      activeProvider: mode === 'custom' ? provider : null
    }

    await updateUserApiConfig(userId, updatedConfig)
    return true
  } catch (error) {
    console.error('切换 API 模式失败:', error)
    throw error
  }
}

/**
 * 解码 API Key（Base64 解码）
 * @param {string} encodedKey - Base64 编码的 Key
 * @returns {string} - 解码后的 Key
 */
export function decodeApiKey(encodedKey) {
  try {
    return atob(encodedKey)
  } catch (error) {
    console.error('解码 API Key 失败:', error)
    return null
  }
}

/**
 * 获取游客的免费使用数据（localStorage）
 * @returns {Object} - { count: number, lastReset: string, dailyLimit: number }
 */
function getGuestFreeUsage() {
  try {
    const stored = localStorage.getItem('guestFreeUsage')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('读取游客使用数据失败:', error)
  }

  // 默认值
  return {
    count: 0,
    lastReset: new Date().toISOString().split('T')[0],
    dailyLimit: FREE_MODE_CONFIG.dailyLimit
  }
}

/**
 * 保存游客的免费使用数据（localStorage）
 * @param {Object} usage - 使用数据
 */
function setGuestFreeUsage(usage) {
  try {
    localStorage.setItem('guestFreeUsage', JSON.stringify(usage))
  } catch (error) {
    console.error('保存游客使用数据失败:', error)
  }
}

/**
 * 记录免费模式使用次数（支持游客和登录用户）
 * @param {string|null} userId - 用户 ID（null 表示游客）
 * @returns {Promise<boolean>} - 是否成功
 */
export async function recordFreeUsage(userId) {
  try {
    const today = new Date().toISOString().split('T')[0]

    // 游客模式：使用 localStorage
    if (!userId) {
      const guestUsage = getGuestFreeUsage()
      const needsReset = guestUsage.lastReset !== today

      const updatedUsage = {
        count: needsReset ? 1 : guestUsage.count + 1,
        lastReset: today,
        dailyLimit: FREE_MODE_CONFIG.dailyLimit
      }

      setGuestFreeUsage(updatedUsage)
      return true
    }

    // 登录用户模式：使用 Firestore
    const currentConfig = await getUserApiConfig(userId)

    // 检查是否需要重置计数
    const needsReset = currentConfig.freeUsage.lastReset !== today

    const updatedConfig = {
      ...currentConfig,
      freeUsage: {
        count: needsReset ? 1 : currentConfig.freeUsage.count + 1,
        lastReset: today,
        dailyLimit: FREE_MODE_CONFIG.dailyLimit
      }
    }

    await updateUserApiConfig(userId, updatedConfig)
    return true
  } catch (error) {
    console.error('记录免费使用次数失败:', error)
    throw error
  }
}

/**
 * 检查免费模式是否还有剩余次数（支持游客和登录用户）
 * @param {string|null} userId - 用户 ID（null 表示游客）
 * @returns {Promise<Object>} - { allowed: boolean, remaining: number }
 */
export async function checkFreeUsageLimit(userId) {
  try {
    const today = new Date().toISOString().split('T')[0]

    // 游客模式：使用 localStorage
    if (!userId) {
      const guestUsage = getGuestFreeUsage()
      const needsReset = guestUsage.lastReset !== today
      const currentCount = needsReset ? 0 : guestUsage.count
      const remaining = FREE_MODE_CONFIG.dailyLimit - currentCount

      return {
        allowed: remaining > 0,
        remaining: Math.max(0, remaining),
        used: currentCount,
        limit: FREE_MODE_CONFIG.dailyLimit
      }
    }

    // 登录用户模式：使用 Firestore
    const currentConfig = await getUserApiConfig(userId)

    // 如果是新的一天，重置计数
    const needsReset = currentConfig.freeUsage.lastReset !== today
    const currentCount = needsReset ? 0 : currentConfig.freeUsage.count
    const remaining = FREE_MODE_CONFIG.dailyLimit - currentCount

    return {
      allowed: remaining > 0,
      remaining: Math.max(0, remaining),
      used: currentCount,
      limit: FREE_MODE_CONFIG.dailyLimit
    }
  } catch (error) {
    console.error('检查免费使用限制失败:', error)
    throw error
  }
}

/**
 * 测试 API Key 是否有效
 * @param {string} provider - 提供商 ID
 * @param {string} apiKey - API Key
 * @param {string} model - 模型 ID
 * @returns {Promise<Object>} - { success: boolean, message: string }
 */
export async function testApiKey(provider, apiKey, model) {
  try {
    // 调用后端 API 测试
    const response = await fetch('/api/test-api-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider,
        apiKey,
        model
      })
    })

    const data = await response.json()

    if (response.ok && data.success) {
      return { success: true, message: 'API key is valid and working' }
    } else {
      return { success: false, message: data.message || 'API key test failed' }
    }
  } catch (error) {
    console.error('测试 API Key 失败:', error)
    return { success: false, message: 'Network error or invalid API key' }
  }
}
