// 悬浮球组件 - 可拖动，可隐藏/显示，点击展开风格选择器
// 参考沉浸式翻译的交互设计

import { getSelectedStyle, setSelectedStyle, getBallPosition, saveBallPosition, getBallVisibility, setBallVisibility, addDisabledSite } from '../utils/storage.js'
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

  // 使用 SVG logo 作为图标
  const icon = document.createElement('div')
  icon.className = 'floating-ball-icon'
  icon.innerHTML = `
    <svg width="32" height="32" viewBox="0 0 170 198" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M86.5989 198C86.5989 196.893 86.5989 196.339 86.5989 195.786C86.5989 182.961 86.5989 170.139 86.5954 157.313C86.5954 156.732 86.6128 156.147 86.5709 155.565C86.3892 152.875 85.4283 151.964 82.7201 151.964C73.1282 151.957 63.5363 151.967 53.9409 151.964C49.2305 151.964 44.5097 152.16 39.8168 151.894C26.3461 151.13 15.657 145.164 7.77378 134.157C2.61266 126.944 0.456655 118.753 0.246995 110.034C0.0268522 101.006 -0.112921 91.9674 0.121199 82.9431C0.355319 73.9117 2.39251 65.3288 7.81571 57.7933C13.8155 49.4556 21.6847 43.9345 31.7169 41.8115C35.3196 41.0478 39.0795 40.7956 42.7765 40.7465C52.8891 40.6064 63.0086 40.701 73.1247 40.701C75.6371 40.701 76.5806 39.9373 76.8043 37.3624C77.269 31.9919 76.958 26.8632 73.3449 22.3195C69.1971 17.1032 69.7632 11.5681 73.3798 6.3202C76.6889 1.51376 81.3888 -0.602202 87.2348 0.147492C93.1892 0.911198 98.8779 6.69505 99.4335 12.64C99.7026 15.5092 98.7242 18.1121 97.3334 20.6169C95.9881 23.0412 94.3668 25.4549 93.7098 28.0858C92.9481 31.1372 92.9376 34.4162 92.9236 37.5971C92.9131 40.0774 93.8112 40.6975 96.2817 40.6975C106.922 40.7045 117.559 40.722 128.199 40.7045C139.933 40.6835 150.007 44.7367 158.292 53.0885C164.977 59.8287 168.946 68.0088 169.446 77.4675C169.995 87.8721 170.054 98.3118 169.984 108.734C169.883 123.216 164.107 135.141 152.939 144.344C143.34 152.258 133.674 160.091 124.009 167.925C112.674 177.114 101.306 186.264 89.9464 195.425C89.0065 196.182 88.035 196.896 86.6023 198H86.5989ZM84.1109 68.4502V68.4292C71.437 68.4292 58.763 68.3241 46.0926 68.4677C38.2688 68.5588 32.1537 72.2372 28.3973 79.0194C23.3585 88.1104 23.7464 97.8739 26.6816 107.462C29.3443 116.157 38.2898 122.326 47.2283 122.362C60.3634 122.411 73.5021 122.439 86.6373 122.47C89.0344 122.477 89.3454 122.778 89.3419 125.189C89.3349 133.173 89.3209 141.16 89.3174 149.144C89.3174 149.841 89.286 150.552 89.3838 151.239C89.7787 154.006 91.5329 155.096 94.0872 153.943C95.7086 153.211 97.274 152.23 98.6438 151.095C110.909 140.929 123.15 130.731 135.338 120.473C138.72 117.629 141.201 114.038 142.875 109.925C145.831 102.649 145.601 95.0818 144.517 87.5498C142.962 76.7353 133.51 68.5553 122.657 68.4747C109.808 68.3766 96.963 68.4537 84.1144 68.4537L84.1109 68.4502Z" fill="white"/>
      <path d="M70.6228 95.141C70.822 101.163 65.3778 108.506 56.925 108.071C49.9888 107.718 44.2127 101.657 44.4153 94.5245C44.6215 87.2167 50.4396 81.545 57.5575 81.7131C65.1507 81.8918 70.8045 87.7037 70.6228 95.1375V95.141Z" fill="white"/>
      <path d="M99.3843 94.8184C99.3878 87.3389 104.846 81.7022 112.079 81.6987C119.595 81.6987 125.221 87.3074 125.204 94.7868C125.186 102.291 119.501 108.064 112.16 108.026C104.769 107.987 99.3808 102.417 99.3878 94.8149L99.3843 94.8184Z" fill="white"/>
    </svg>
  `

  const badge = document.createElement('div')
  badge.className = 'style-badge'
  badge.textContent = 'Chat'

  // 关闭按钮
  const closeBtn = document.createElement('div')
  closeBtn.className = 'close-btn'
  closeBtn.textContent = '✕'
  closeBtn.title = '关闭悬浮球'

  ball.appendChild(closeBtn)
  ball.appendChild(icon)
  ball.appendChild(badge)

  // 创建悬浮球容器（可拖动）
  const ballContainer = document.createElement('div')
  ballContainer.className = 'ball-container'
  ballContainer.appendChild(ball)

  // 创建触发条容器（固定位置，不可拖动）
  const triggerContainer = document.createElement('div')
  triggerContainer.className = 'trigger-container'

  // 创建触发条（鼠标悬停时展开悬浮球）
  const trigger = document.createElement('div')
  trigger.className = 'ball-trigger'
  triggerContainer.appendChild(trigger)

  shadow.appendChild(ballContainer)
  shadow.appendChild(triggerContainer)

  // 加载保存的位置和状态
  loadBallState(ballContainer)

  // 加载当前选中的风格
  loadCurrentStyle(badge)

  // 鼠标悬停交互 - 自动展开/收起
  let expandTimeout = null
  let collapseTimeout = null
  let isMouseOverBall = false
  let isMouseOverTrigger = false
  let isSelectorOpen = false // 风格选择器是否打开

  // 展开悬浮球的函数
  const expandBall = () => {
    clearTimeout(collapseTimeout)
    clearTimeout(expandTimeout)
    expandTimeout = setTimeout(() => {
      ball.classList.add('expanded')
      trigger.classList.add('hidden')
    }, 100) // 100ms 延迟展开
  }

  // 收起悬浮球的函数（检查是否真的应该收起）
  const collapseBall = (immediate = false) => {
    clearTimeout(expandTimeout)
    clearTimeout(collapseTimeout)

    console.log('[FloatingBall] collapseBall called, immediate:', immediate, 'isSelectorOpen:', isSelectorOpen)

    // 如果风格选择器正在打开，不收起
    if (isSelectorOpen) {
      console.log('[FloatingBall] Selector is open, not collapsing')
      return
    }

    // 如果鼠标还在悬浮球或触发条上，不收起（除非是立即模式）
    if (!immediate && (isMouseOverBall || isMouseOverTrigger)) {
      console.log('[FloatingBall] Mouse is over component, not collapsing')
      return
    }

    console.log('[FloatingBall] Starting 2s collapse timeout')
    // 延迟 2 秒收起，给用户足够时间移动鼠标
    collapseTimeout = setTimeout(() => {
      console.log('[FloatingBall] 2s elapsed, checking conditions...')
      console.log('[FloatingBall] isMouseOverBall:', isMouseOverBall, 'isMouseOverTrigger:', isMouseOverTrigger, 'isSelectorOpen:', isSelectorOpen)
      // 再次检查鼠标是否在组件上，以及选择器是否打开
      if (!isMouseOverBall && !isMouseOverTrigger && !isSelectorOpen) {
        console.log('[FloatingBall] Collapsing ball now')
        ball.classList.remove('expanded')
        trigger.classList.remove('hidden')
      } else {
        console.log('[FloatingBall] Conditions not met, not collapsing')
      }
    }, 2000) // 2秒延迟收起
  }

  // 悬浮球容器的悬停事件
  ballContainer.addEventListener('mouseenter', () => {
    isMouseOverBall = true
    expandBall()
  })
  ballContainer.addEventListener('mouseleave', () => {
    isMouseOverBall = false
    collapseBall()
  })

  // 触发条容器的悬停事件
  triggerContainer.addEventListener('mouseenter', () => {
    isMouseOverTrigger = true
    expandBall()
  })
  triggerContainer.addEventListener('mouseleave', () => {
    isMouseOverTrigger = false
    collapseBall()
  })

  // 点击悬浮球 - 展开风格选择器
  ball.addEventListener('click', (e) => {
    // 如果点击的是关闭按钮，不展开选择器
    if (e.target === closeBtn) return
    toggleStyleSelector(shadow, badge, (isOpen) => {
      console.log('[FloatingBall] Selector toggled, isOpen:', isOpen)
      isSelectorOpen = isOpen
      // 如果选择器关闭了，立即启动收起倒计时
      if (!isOpen) {
        console.log('[FloatingBall] Selector closed, calling collapseBall(true)')
        console.log('[FloatingBall] Current state - isMouseOverBall:', isMouseOverBall, 'isMouseOverTrigger:', isMouseOverTrigger)
        // 使用立即模式，忽略鼠标位置检查，直接启动倒计时
        collapseBall(true)
      }
    })
  })

  // 关闭按钮点击事件 - 显示关闭确认对话框
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    showCloseDialog(shadow, ballContainer, triggerContainer, ball, trigger)
  })

  // 添加拖拽功能
  makeDraggable(ballContainer, ball)

  return container
}

/**
 * 加载悬浮球的位置和状态
 */
async function loadBallState(ballContainer) {
  const position = await getBallPosition()
  const visibility = await getBallVisibility()

  if (position) {
    ballContainer.style.right = `${position.right}px`
    ballContainer.style.bottom = `${position.bottom}px`
  }

  // visibility 可能是: 'visible', 'hidden'
  // 'visible' 或未设置: 显示触发条（默认收起状态）
  // 'hidden': 完全隐藏
  if (visibility === 'hidden') {
    // 完全隐藏状态
    ballContainer.classList.add('hidden')
  }
  // 否则保持默认状态：显示触发条，悬浮球收起
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
 * 显示关闭确认对话框
 */
function showCloseDialog(shadow, ballContainer, triggerContainer, ball, trigger) {
  // 如果对话框已存在，先移除
  const existingDialog = shadow.querySelector('.close-dialog')
  if (existingDialog) {
    existingDialog.remove()
    return
  }

  // 创建对话框容器
  const dialog = document.createElement('div')
  dialog.className = 'close-dialog'

  // 对话框内容
  dialog.innerHTML = `
    <div class="dialog-overlay"></div>
    <div class="dialog-content">
      <div class="dialog-header">
        <h3>关闭悬浮球</h3>
        <button class="dialog-close-btn">✕</button>
      </div>
      <div class="dialog-body">
        <label class="radio-option selected" data-mode="temporary">
          <input type="radio" name="close-mode" value="temporary" checked>
          <span class="radio-label">本次关闭直到下次访问</span>
        </label>
        <label class="radio-option" data-mode="site">
          <input type="radio" name="close-mode" value="site">
          <span class="radio-label">当前网站禁用 <span class="hint">(可在设置页开启)</span></span>
        </label>
        <label class="radio-option" data-mode="permanent">
          <input type="radio" name="close-mode" value="permanent">
          <span class="radio-label">永久禁用 <span class="hint">(可在设置页开启)</span></span>
        </label>
      </div>
      <div class="dialog-footer">
        <button class="btn-cancel">取消</button>
        <button class="btn-confirm">确定</button>
      </div>
    </div>
  `

  shadow.appendChild(dialog)

  // 绑定事件
  const overlay = dialog.querySelector('.dialog-overlay')
  const closeBtn = dialog.querySelector('.dialog-close-btn')
  const cancelBtn = dialog.querySelector('.btn-cancel')
  const confirmBtn = dialog.querySelector('.btn-confirm')
  const radioOptions = dialog.querySelectorAll('.radio-option')

  // 单选框样式切换
  radioOptions.forEach(option => {
    option.addEventListener('click', () => {
      radioOptions.forEach(opt => opt.classList.remove('selected'))
      option.classList.add('selected')
      option.querySelector('input').checked = true
    })
  })

  // 关闭对话框
  const closeDialog = () => dialog.remove()

  overlay.addEventListener('click', closeDialog)
  closeBtn.addEventListener('click', closeDialog)
  cancelBtn.addEventListener('click', closeDialog)

  // 确定按钮
  confirmBtn.addEventListener('click', async () => {
    const selectedMode = dialog.querySelector('input[name="close-mode"]:checked').value

    switch (selectedMode) {
      case 'temporary':
        // 本次关闭：收起为触发条（刷新页面后恢复）
        ball.classList.remove('expanded')
        trigger.classList.remove('hidden')
        // 不保存状态，刷新后恢复
        break

      case 'site':
        // 当前网站禁用
        const currentDomain = window.location.hostname
        await addDisabledSite(currentDomain)
        ballContainer.classList.add('hidden')
        triggerContainer.classList.add('hidden')
        await setBallVisibility('hidden')
        break

      case 'permanent':
        // 永久禁用
        ballContainer.classList.add('hidden')
        triggerContainer.classList.add('hidden')
        await setBallVisibility('hidden')
        break
    }

    closeDialog()
  })
}

/**
 * 切换风格选择器
 * @param {ShadowRoot} shadow - Shadow DOM
 * @param {HTMLElement} badge - 风格标识元素
 * @param {Function} onToggle - 状态改变回调，参数为 isOpen
 */
function toggleStyleSelector(shadow, badge, onToggle) {
  const existingSelector = shadow.querySelector('.style-selector-panel')

  if (existingSelector) {
    existingSelector.remove()
    // 通知选择器已关闭
    if (onToggle) onToggle(false)
  } else {
    const ball = shadow.querySelector('.floating-ball')
    const selector = createStyleSelector(async (selectedStyle) => {
      console.log('[FloatingBall] Style selected:', selectedStyle.name)
      // 保存选中的风格
      await setSelectedStyle(selectedStyle)

      // 更新 badge
      badge.textContent = selectedStyle.displayName || selectedStyle.name

      // 关闭选择器
      const panel = shadow.querySelector('.style-selector-panel')
      console.log('[FloatingBall] Looking for panel to close, found:', !!panel)
      if (panel) {
        panel.remove()
      }

      // 无论面板是否存在，都通知选择器已关闭
      // （面板可能已经被其他逻辑移除了，比如点击外部关闭）
      console.log('[FloatingBall] Calling onToggle(false)')
      if (onToggle) onToggle(false)
    })

    // 计算选择器应该显示的位置（相对于悬浮球）
    positionSelector(selector, ball)

    shadow.appendChild(selector)

    // 通知选择器已打开
    if (onToggle) onToggle(true)
  }
}

/**
 * 根据悬浮球位置定位选择器面板
 */
function positionSelector(selector, ball) {
  const ballRect = ball.getBoundingClientRect()

  // 选择器宽度为 380px，高度最大 460px
  const selectorWidth = 380
  const selectorMaxHeight = 460

  // 默认显示在悬浮球上方居中
  const ballCenterX = ballRect.left + ballRect.width / 2

  // 计算 left 位置，确保不超出屏幕
  let left = ballCenterX - selectorWidth / 2

  // 边界检查 - 左侧
  if (left < 10) {
    left = 10
  }

  // 边界检查 - 右侧
  if (left + selectorWidth > window.innerWidth - 10) {
    left = window.innerWidth - selectorWidth - 10
  }

  // 应用位置
  selector.style.position = 'fixed'
  selector.style.left = `${left}px`

  // 如果上方空间不够，显示在下方
  if (ballRect.top < selectorMaxHeight + 20) {
    // 显示在下方
    selector.style.top = `${ballRect.bottom + 12}px`
  } else {
    // 显示在上方
    selector.style.bottom = `${window.innerHeight - ballRect.top + 12}px`
  }
}

/**
 * 使悬浮球容器可拖拽
 */
function makeDraggable(ballContainer, ball) {
  let isDragging = false
  let hasMoved = false
  let startX, startY, startRight, startBottom

  ball.addEventListener('mousedown', (e) => {
    // 如果点击的是关闭按钮，不触发拖拽
    if (e.target.className === 'close-btn') return

    isDragging = true
    hasMoved = false
    ballContainer.classList.add('dragging')

    startX = e.clientX
    startY = e.clientY

    const rect = ballContainer.getBoundingClientRect()
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

    const newRight = Math.max(0, Math.min(window.innerWidth - 80, startRight - deltaX))
    const newBottom = Math.max(0, Math.min(window.innerHeight - 80, startBottom - deltaY))

    ballContainer.style.right = `${newRight}px`
    ballContainer.style.bottom = `${newBottom}px`
  })

  document.addEventListener('mouseup', async () => {
    if (isDragging) {
      isDragging = false
      ballContainer.classList.remove('dragging')

      // 如果拖拽过，保存新位置
      if (hasMoved) {
        const right = parseInt(ballContainer.style.right) || 0
        const bottom = parseInt(ballContainer.style.bottom) || 80
        await saveBallPosition({ right, bottom })
      }
    }
  })
}
