// AI Disguise Content Script - 主入口
// 注入到网页中，处理划词翻译和悬浮球交互

import { createFloatingBall } from './components/FloatingBall.js'
import { SelectionHandler } from './utils/SelectionHandler.js'
import { checkIfEnabled } from './utils/settings.js'

// 检查扩展上下文是否有效
function isExtensionContextValid() {
  try {
    // 尝试访问 chrome.runtime.id，如果失效会抛出错误
    return chrome.runtime && chrome.runtime.id
  } catch (error) {
    console.warn('扩展上下文已失效，content script 将不执行')
    return false
  }
}

// 全局引用，用于清理
let floatingBallElement = null
let selectionHandler = null

// 清理所有 content script 元素
function cleanup() {
  // 移除悬浮球
  if (floatingBallElement && floatingBallElement.parentNode) {
    floatingBallElement.remove()
    floatingBallElement = null
  }

  // 销毁选择处理器
  if (selectionHandler) {
    selectionHandler.destroy()
    selectionHandler = null
  }
}

// 检查当前网站是否启用
async function initContentScript() {
  // 首先检查扩展上下文是否有效
  if (!isExtensionContextValid()) {
    console.warn('⚠️ 扩展上下文无效，跳过初始化（请刷新页面）')
    return
  }

  const isEnabled = await checkIfEnabled()

  if (!isEnabled) {
    return
  }

  // 创建悬浮球，传入关闭回调
  floatingBallElement = createFloatingBall(() => {
    cleanup()
  })
  document.body.appendChild(floatingBallElement)

  // 初始化文字选中处理器
  selectionHandler = new SelectionHandler()
  selectionHandler.init()
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentScript)
} else {
  initContentScript()
}
