// AI Disguise Chrome Extension - Background Service Worker

console.log('AI Disguise service worker loaded')

// 监听安装事件
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason)

  if (details.reason === 'install') {
    // 首次安装时的初始化
    chrome.storage.local.set({
      usageCount: 0,
      lastResetDate: new Date().toDateString(),
      apiMode: 'free' // 'free' or 'custom'
    })

    // 打开欢迎页面
    chrome.tabs.create({ url: 'https://ai-disguiser.vercel.app' })
  }
})

// 每日重置使用次数
chrome.alarms.create('dailyReset', { periodInMinutes: 1440 }) // 24小时

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyReset') {
    chrome.storage.local.get(['lastResetDate'], (result) => {
      const today = new Date().toDateString()
      if (result.lastResetDate !== today) {
        chrome.storage.local.set({
          usageCount: 0,
          lastResetDate: today
        })
        console.log('Daily usage count reset')
      }
    })
  }
})

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkUsageLimit') {
    chrome.storage.local.get(['usageCount', 'apiMode'], (result) => {
      const { usageCount = 0, apiMode = 'free' } = result

      if (apiMode === 'free' && usageCount >= 20) {
        sendResponse({ allowed: false, remaining: 0 })
      } else {
        sendResponse({ allowed: true, remaining: 20 - usageCount })
      }
    })
    return true // 保持消息通道开放
  }

  if (request.action === 'incrementUsage') {
    chrome.storage.local.get(['usageCount'], (result) => {
      const newCount = (result.usageCount || 0) + 1
      chrome.storage.local.set({ usageCount: newCount })
      sendResponse({ success: true, count: newCount })
    })
    return true
  }
})
