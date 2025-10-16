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
 * 获取所有可用风格
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
 * 获取悬浮球可见性
 */
export async function getBallVisibility() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['ballVisible'], (result) => {
      // 默认为可见
      resolve(result.ballVisible !== false)
    })
  })
}

/**
 * 设置悬浮球可见性
 */
export async function setBallVisibility(visible) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ ballVisible: visible }, resolve)
  })
}
