// 设置工具 - 管理插件功能的启用/禁用

/**
 * 检查当前网站是否启用 AI Disguise
 */
export async function checkIfEnabled() {
  const currentUrl = window.location.hostname

  return new Promise((resolve) => {
    chrome.storage.local.get(['disabledWebsites', 'globalEnabled'], (result) => {
      // 检查全局开关
      const globalEnabled = result.globalEnabled !== false // 默认启用

      if (!globalEnabled) {
        resolve(false)
        return
      }

      // 检查网站白名单
      const disabledWebsites = result.disabledWebsites || []
      const isDisabled = disabledWebsites.some(site => currentUrl.includes(site))

      resolve(!isDisabled)
    })
  })
}

/**
 * 获取禁用的网站列表
 */
export async function getDisabledWebsites() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['disabledWebsites'], (result) => {
      resolve(result.disabledWebsites || [])
    })
  })
}

/**
 * 添加网站到禁用列表
 */
export async function addDisabledWebsite(website) {
  const disabledList = await getDisabledWebsites()

  if (!disabledList.includes(website)) {
    disabledList.push(website)

    return new Promise((resolve) => {
      chrome.storage.local.set({ disabledWebsites: disabledList }, resolve)
    })
  }
}

/**
 * 从禁用列表移除网站
 */
export async function removeDisabledWebsite(website) {
  const disabledList = await getDisabledWebsites()
  const newList = disabledList.filter(site => site !== website)

  return new Promise((resolve) => {
    chrome.storage.local.set({ disabledWebsites: newList }, resolve)
  })
}

/**
 * 获取全局启用状态
 */
export async function getGlobalEnabled() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['globalEnabled'], (result) => {
      resolve(result.globalEnabled !== false) // 默认启用
    })
  })
}

/**
 * 设置全局启用状态
 */
export async function setGlobalEnabled(enabled) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ globalEnabled: enabled }, resolve)
  })
}
