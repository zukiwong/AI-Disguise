// 存储管理工具 - 统一管理 Chrome Storage 操作

/**
 * 获取当前选中的风格
 */
export async function getSelectedStyle() {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(['selectedStyle'], (result) => {
        if (chrome.runtime.lastError) {
          console.warn('Storage access error:', chrome.runtime.lastError)
          resolve({
            id: 'chat',
            name: 'Chat',
            displayName: 'Chat',
            description: 'Casual and friendly conversational tone',
            promptTemplate: 'Transform the following text into a casual, friendly chat style'
          })
          return
        }
        resolve(result.selectedStyle || {
          id: 'chat',
          name: 'Chat',
          displayName: 'Chat',
          description: 'Casual and friendly conversational tone',
          promptTemplate: 'Transform the following text into a casual, friendly chat style'
        })
      })
    } catch (error) {
      console.warn('Extension context invalidated, using default style')
      resolve({
        id: 'chat',
        name: 'Chat',
        displayName: 'Chat',
        description: 'Casual and friendly conversational tone',
        promptTemplate: 'Transform the following text into a casual, friendly chat style'
      })
    }
  })
}

/**
 * 设置当前选中的风格
 */
export async function setSelectedStyle(style) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ selectedStyle: style }, resolve)
  })
}

/**
 * 获取所有可用风格（默认风格 + 用户自定义风格）
 * 每次调用都会从 Chrome Storage 获取最新的 userStyles
 */
export async function getAllStyles() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['userStyles'], (result) => {
      const defaultStyles = [
        {
          id: 'chat',
          name: 'Chat',
          displayName: 'Chat',
          description: 'Casual and friendly conversational tone',
          promptTemplate: 'Transform the following text into a casual, friendly chat style'
        },
        {
          id: 'poem',
          name: 'Poem',
          displayName: 'Poem',
          description: 'Poetic and artistic expression',
          promptTemplate: 'Transform the following text into poetic style'
        },
        {
          id: 'social',
          name: 'Social',
          displayName: 'Social',
          description: 'Perfect for social media posts',
          promptTemplate: 'Transform the following text into social media style'
        },
        {
          id: 'story',
          name: 'Story',
          displayName: 'Story',
          description: 'Narrative storytelling approach',
          promptTemplate: 'Transform the following text into story style'
        }
      ]

      const userStyles = result.userStyles || []

      // 合并默认风格和用户自定义风格
      // 注意：每次调用都会获取最新的 userStyles，确保登录后能立即看到用户的风格
      console.log(`getAllStyles: 加载了 ${userStyles.length} 个用户风格`)
      resolve([...defaultStyles, ...userStyles])
    })
  })
}

/**
 * 获取悬浮球位置
 */
export async function getBallPosition() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['ballPosition'], (result) => {
      resolve(result.ballPosition || null)
    })
  })
}

/**
 * 保存悬浮球位置
 */
export async function saveBallPosition(position) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ ballPosition: position }, resolve)
  })
}

/**
 * 获取悬浮球可见性状态
 * @returns {Promise<string>} 'visible' | 'minimized' | 'hidden'
 */
export async function getBallVisibility() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['ballVisible'], (result) => {
      // 默认为可见状态
      // 兼容旧版本：false -> 'minimized', true -> 'visible'
      if (result.ballVisible === false) {
        resolve('minimized')
      } else if (result.ballVisible === true || result.ballVisible === 'visible') {
        resolve('visible')
      } else if (result.ballVisible === 'minimized' || result.ballVisible === 'hidden') {
        resolve(result.ballVisible)
      } else {
        resolve('visible')
      }
    })
  })
}

/**
 * 设置悬浮球可见性状态
 * @param {string} state - 'visible' | 'minimized' | 'hidden'
 */
export async function setBallVisibility(state) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ ballVisible: state }, resolve)
  })
}

/**
 * 获取禁用网站列表
 * @returns {Promise<string[]>}
 */
export async function getDisabledSites() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['disabledSites'], (result) => {
      resolve(result.disabledSites || [])
    })
  })
}

/**
 * 添加禁用网站
 * @param {string} domain - 网站域名
 */
export async function addDisabledSite(domain) {
  const disabledSites = await getDisabledSites()
  if (!disabledSites.includes(domain)) {
    disabledSites.push(domain)
    return new Promise((resolve) => {
      chrome.storage.local.set({ disabledSites }, resolve)
    })
  }
}

/**
 * 移除禁用网站
 * @param {string} domain - 网站域名
 */
export async function removeDisabledSite(domain) {
  const disabledSites = await getDisabledSites()
  const filtered = disabledSites.filter(site => site !== domain)
  return new Promise((resolve) => {
    chrome.storage.local.set({ disabledSites: filtered }, resolve)
  })
}

/**
 * 检查当前网站是否被禁用
 * @param {string} domain - 网站域名
 * @returns {Promise<boolean>}
 */
export async function isSiteDisabled(domain) {
  const disabledSites = await getDisabledSites()
  return disabledSites.includes(domain)
}
