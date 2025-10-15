// 结果显示面板 - 显示原文和转换结果，支持复制

import resultPanelCSS from '../styles/resultPanel.css?inline'

/**
 * 创建结果显示面板
 * @param {Object} options - 配置选项
 * @param {string} options.originalText - 原始文本
 * @param {Object} options.position - 面板位置 {top, left}
 * @param {Function} options.onClose - 关闭回调
 */
export function createResultPanel({ originalText, position, onClose }) {
  // 创建 Shadow DOM 容器
  const container = document.createElement('div')
  container.id = 'ai-disguise-result-panel-container'

  const shadow = container.attachShadow({ mode: 'open' })

  // 注入样式
  const style = document.createElement('style')
  style.textContent = resultPanelCSS
  shadow.appendChild(style)

  // 创建面板
  const panel = document.createElement('div')
  panel.className = 'result-panel'

  // 调整位置，避免超出屏幕
  const adjustedPosition = adjustPosition(position, 360, 300) // 面板大约宽360px，高300px
  panel.style.top = `${adjustedPosition.top}px`
  panel.style.left = `${adjustedPosition.left}px`

  // 头部
  const header = document.createElement('div')
  header.className = 'panel-header'

  const title = document.createElement('h3')
  title.className = 'panel-title'
  title.textContent = 'AI Disguise'

  const closeBtn = document.createElement('button')
  closeBtn.className = 'panel-close-btn'
  closeBtn.textContent = '×'
  closeBtn.addEventListener('click', () => {
    container.remove()
    if (onClose) onClose()
  })

  header.appendChild(title)
  header.appendChild(closeBtn)
  panel.appendChild(header)

  // 内容区域
  const content = document.createElement('div')
  content.className = 'panel-content'

  // 原文部分
  const originalSection = document.createElement('div')
  originalSection.className = 'original-section'

  const originalLabel = document.createElement('div')
  originalLabel.className = 'section-label'
  originalLabel.textContent = 'Original'

  const originalTextEl = document.createElement('div')
  originalTextEl.className = 'original-text'
  originalTextEl.textContent = originalText

  originalSection.appendChild(originalLabel)
  originalSection.appendChild(originalTextEl)
  content.appendChild(originalSection)

  // 结果部分（初始为加载状态）
  const resultSection = document.createElement('div')
  resultSection.className = 'result-section'

  const resultLabel = document.createElement('div')
  resultLabel.className = 'section-label'
  resultLabel.textContent = 'Transformed'

  const loadingState = createLoadingState()
  resultSection.appendChild(resultLabel)
  resultSection.appendChild(loadingState)

  content.appendChild(resultSection)
  panel.appendChild(content)

  shadow.appendChild(panel)

  // 为容器添加更新方法
  container.updateResult = (transformedText) => {
    // 移除加载状态
    const loading = resultSection.querySelector('.loading-state')
    if (loading) loading.remove()

    // 移除可能的错误状态
    const error = resultSection.querySelector('.error-state')
    if (error) error.remove()

    // 显示结果
    const resultText = document.createElement('div')
    resultText.className = 'result-text'
    resultText.textContent = transformedText
    resultSection.appendChild(resultText)

    // 添加操作按钮
    const actions = createActionButtons(transformedText)
    panel.appendChild(actions)
  }

  container.showError = (errorMessage) => {
    // 移除加载状态
    const loading = resultSection.querySelector('.loading-state')
    if (loading) loading.remove()

    // 显示错误
    const errorState = document.createElement('div')
    errorState.className = 'error-state'
    errorState.textContent = errorMessage
    resultSection.appendChild(errorState)
  }

  return container
}

/**
 * 创建加载状态
 */
function createLoadingState() {
  const loading = document.createElement('div')
  loading.className = 'loading-state'

  const spinner = document.createElement('div')
  spinner.className = 'loading-spinner'

  const text = document.createElement('div')
  text.textContent = 'Transforming...'

  loading.appendChild(spinner)
  loading.appendChild(text)

  return loading
}

/**
 * 创建操作按钮
 */
function createActionButtons(transformedText) {
  const actions = document.createElement('div')
  actions.className = 'panel-actions'

  // 复制按钮
  const copyBtn = document.createElement('button')
  copyBtn.className = 'action-btn copy-btn'
  copyBtn.textContent = 'Copy'

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(transformedText)
      copyBtn.textContent = '✓ Copied!'
      copyBtn.classList.add('copied')

      setTimeout(() => {
        copyBtn.textContent = 'Copy'
        copyBtn.classList.remove('copied')
      }, 2000)
    } catch (error) {
      console.error('Copy failed:', error)
      copyBtn.textContent = '✗ Failed'

      setTimeout(() => {
        copyBtn.textContent = 'Copy'
      }, 2000)
    }
  })

  actions.appendChild(copyBtn)

  return actions
}

/**
 * 调整面板位置，避免超出屏幕
 */
function adjustPosition(position, panelWidth, panelHeight) {
  const { top, left } = position
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight

  let adjustedTop = top + 10 // 稍微向下偏移
  let adjustedLeft = left

  // 如果面板超出右边界，向左调整
  if (adjustedLeft + panelWidth > windowWidth) {
    adjustedLeft = windowWidth - panelWidth - 20
  }

  // 如果面板超出左边界，向右调整
  if (adjustedLeft < 20) {
    adjustedLeft = 20
  }

  // 如果面板超出底部，向上显示
  if (adjustedTop + panelHeight > windowHeight + window.scrollY) {
    adjustedTop = position.top - panelHeight - 10
  }

  // 如果面板超出顶部，固定在顶部
  if (adjustedTop < window.scrollY + 20) {
    adjustedTop = window.scrollY + 20
  }

  return { top: adjustedTop, left: adjustedLeft }
}
