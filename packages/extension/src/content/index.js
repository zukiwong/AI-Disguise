// AI Disguise Content Script - 主入口
// 注入到网页中，处理划词翻译和悬浮球交互

import { createFloatingBall } from './components/FloatingBall.js'
import { SelectionHandler } from './utils/SelectionHandler.js'
import { checkIfEnabled } from './utils/settings.js'

console.log('🎨 AI Disguise Content Script 已加载')

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

// 检查当前网站是否启用
async function initContentScript() {
  // 首先检查扩展上下文是否有效
  if (!isExtensionContextValid()) {
    console.warn('⚠️ 扩展上下文无效，跳过初始化（请刷新页面）')
    return
  }

  const isEnabled = await checkIfEnabled()

  if (!isEnabled) {
    console.log('⏸️  当前网站已禁用 AI Disguise')
    return
  }

  // 创建悬浮球
  const floatingBall = createFloatingBall()
  document.body.appendChild(floatingBall)

  // 初始化文字选中处理器
  const selectionHandler = new SelectionHandler()
  selectionHandler.init()

  console.log('✅ AI Disguise 初始化完成')
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentScript)
} else {
  initContentScript()
}
