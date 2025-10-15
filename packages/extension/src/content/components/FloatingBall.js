// 悬浮球组件 - 可拖动，可隐藏/显示，点击展开风格选择器
// 参考沉浸式翻译的交互设计

import { getSelectedStyle, setSelectedStyle, getBallPosition, saveBallPosition, getBallVisibility, setBallVisibility } from '../utils/storage.js'
import { createStyleSelector } from './StyleSelector.js'
import floatingBallCSS from '../styles/floatingBall.css?inline'

/**
 * 创建悬浮球
 */
export function createFloatingBall() {
  // 创建 Shadow DOM 容器，避免样式冲突
  const container = document.createElement('div')
  container.id = 'ai-disguise-floating-ball-container'

  const shadow = container.attachShadow({ mode: 'open' })

  // 注入 CSS 样式
  const style = document.createElement('style')
  style.textContent = floatingBallCSS
  shadow.appendChild(style)

  // 创建悬浮球元素
  const ball = document.createElement('div')
  ball.className = 'floating-ball'

  const icon = document.createElement('span')
  icon.className = 'floating-ball-icon'
  icon.textContent = '✨'

  const badge = document.createElement('div')
  badge.className = 'style-badge'
  badge.textContent = 'Chat'

  const toggleBtn = document.createElement('div')
  toggleBtn.className = 'toggle-visibility-btn'
  toggleBtn.textContent = '✕'
  toggleBtn.title = '隐藏悬浮球'

  ball.appendChild(toggleBtn)
  ball.appendChild(icon)
  ball.appendChild(badge)
  shadow.appendChild(ball)

  // 创建显示触发条（隐藏时显示）
  const showTrigger = document.createElement('div')
  showTrigger.className = 'show-trigger'
  showTrigger.title = '显示 AI Disguise'
  shadow.appendChild(showTrigger)

  // 加载保存的位置和可见性
  loadBallState(ball, showTrigger)

  // 加载当前选中的风格
  loadCurrentStyle(badge)

  // 点击悬浮球 - 展开风格选择器
  ball.addEventListener('click', (e) => {
    // 如果点击的是隐藏按钮，不展开选择器
    if (e.target === toggleBtn) return
    toggleStyleSelector(shadow, container, badge)
  })

  // 隐藏按钮点击事件
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    hideBall(ball, showTrigger)
  })

  // 显示触发条点击事件
  showTrigger.addEventListener('click', () => {
    showBall(ball, showTrigger)
  })

  // 添加拖拽功能
  makeDraggable(ball, container)

  return container
}

/**
 * 加载悬浮球的位置和可见性状态
 */
async function loadBallState(ball, showTrigger) {
  const position = await getBallPosition()
  const isVisible = await getBallVisibility()

  if (position) {
    ball.style.right = `${position.right}px`
    ball.style.bottom = `${position.bottom}px`
  }

  if (!isVisible) {
    ball.classList.add('hidden')
    showTrigger.classList.add('visible')
  }
}

/**
 * 加载当前选中的风格
 */
async function loadCurrentStyle(badge) {
  const currentStyle = await getSelectedStyle()
  if (currentStyle) {
    badge.textContent = currentStyle.displayName || currentStyle.name || 'Chat'
  }
}

/**
 * 隐藏悬浮球
 */
async function hideBall(ball, showTrigger) {
  ball.classList.add('hidden')
  showTrigger.classList.add('visible')
  await setBallVisibility(false)
}

/**
 * 显示悬浮球
 */
async function showBall(ball, showTrigger) {
  ball.classList.remove('hidden')
  showTrigger.classList.remove('visible')
  await setBallVisibility(true)
}

/**
 * 切换风格选择器
 */
function toggleStyleSelector(shadow, container, badge) {
  const existingSelector = shadow.querySelector('.style-selector-panel')

  if (existingSelector) {
    existingSelector.remove()
  } else {
    const selector = createStyleSelector(async (selectedStyle) => {
      // 保存选中的风格
      await setSelectedStyle(selectedStyle)

      // 更新 badge
      badge.textContent = selectedStyle.displayName || selectedStyle.name

      // 关闭选择器
      const panel = shadow.querySelector('.style-selector-panel')
      if (panel) panel.remove()
    })

    shadow.appendChild(selector)
  }
}

/**
 * 使悬浮球可拖拽
 */
function makeDraggable(ball, container) {
  let isDragging = false
  let hasMoved = false
  let startX, startY, startRight, startBottom

  ball.addEventListener('mousedown', (e) => {
    // 如果点击的是隐藏按钮，不触发拖拽
    if (e.target.className === 'toggle-visibility-btn') return

    isDragging = true
    hasMoved = false
    ball.classList.add('dragging')

    startX = e.clientX
    startY = e.clientY

    const rect = ball.getBoundingClientRect()
    startRight = window.innerWidth - rect.right
    startBottom = window.innerHeight - rect.bottom

    e.preventDefault()
  })

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return

    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY

    // 如果移动距离超过 5px，认为是拖拽而非点击
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      hasMoved = true
    }

    const newRight = Math.max(0, Math.min(window.innerWidth - 56, startRight - deltaX))
    const newBottom = Math.max(0, Math.min(window.innerHeight - 56, startBottom - deltaY))

    ball.style.right = `${newRight}px`
    ball.style.bottom = `${newBottom}px`
  })

  document.addEventListener('mouseup', async () => {
    if (isDragging) {
      isDragging = false
      ball.classList.remove('dragging')

      // 如果拖拽过，保存新位置
      if (hasMoved) {
        const right = parseInt(ball.style.right) || 20
        const bottom = parseInt(ball.style.bottom) || 80
        await saveBallPosition({ right, bottom })
      }
    }
  })
}
