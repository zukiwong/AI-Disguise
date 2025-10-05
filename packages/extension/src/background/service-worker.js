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
    chrome.tabs.create({ url: 'https://ai-disguise.vercel.app' })
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

// 存储活动的轮询
const activePolls = new Map()

// 监听来自 popup 和网页的消息
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

  // 开始登录轮询
  if (request.action === 'startLoginPolling') {
    console.log('开始登录轮询，tabId:', request.tabId)
    startLoginPolling(request.tabId)
    sendResponse({ success: true })
    return true
  }

  // 接收来自网页的登录信息
  if (request.action === 'loginSuccess') {
    console.log('接收到登录成功消息:', request.user)
    chrome.storage.local.set({
      user: request.user
    }, () => {
      console.log('用户信息已保存')
      sendResponse({ success: true })
    })
    return true
  }
})

// 登录轮询函数
function startLoginPolling(tabId) {
  let pollCount = 0
  const maxPolls = 60 // 最多轮询 60 次（30 秒）

  const pollInterval = setInterval(() => {
    pollCount++
    console.log(`轮询登录状态 #${pollCount}，tabId: ${tabId}`)

    // 通过 scripting API 读取网页的 localStorage
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        const loginData = localStorage.getItem('ai-disguise-extension-login')
        return loginData
      }
    }).then((results) => {
      if (results && results[0] && results[0].result) {
        const userData = JSON.parse(results[0].result)
        console.log('✅ 检测到登录成功:', userData)

        // 保存用户数据
        chrome.storage.local.set({ user: userData }, () => {
          console.log('✅ 用户信息已保存到 Chrome Storage')

          // 清除轮询
          clearInterval(pollInterval)
          activePolls.delete(tabId)

          // 关闭登录标签
          chrome.tabs.remove(tabId, () => {
            console.log('✅ 登录标签已关闭')
          })
        })
      }
    }).catch((error) => {
      console.log('轮询检查失败:', error.message)

      // 如果标签已关闭，停止轮询
      if (error.message.includes('tab') || error.message.includes('No tab')) {
        console.log('标签已关闭，停止轮询')
        clearInterval(pollInterval)
        activePolls.delete(tabId)
      }
    })

    // 超时停止轮询
    if (pollCount >= maxPolls) {
      console.log('❌ 登录轮询超时')
      clearInterval(pollInterval)
      activePolls.delete(tabId)
    }
  }, 500) // 每 500ms 检查一次

  // 保存轮询引用
  activePolls.set(tabId, pollInterval)
}

// 监听来自网页的外部消息（用于登录回调）
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  console.log('接收到外部消息:', request, '来自:', sender)

  if (request.action === 'loginSuccess' && request.user) {
    chrome.storage.local.set({
      user: request.user
    }, () => {
      console.log('用户信息已保存（外部）')
      sendResponse({ success: true })
    })
    return true
  }
})
