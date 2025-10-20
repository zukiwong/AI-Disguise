// 文字选中处理器

import { getSelectedStyle } from './storage.js'
import { createResultPanel } from '../components/ResultPanel.js'
import { transformText } from './transformer.js'

export class SelectionHandler {
  constructor() {
    this.currentPanel = null
    this.isProcessing = false
    this.handleSelectionBound = null
  }

  init() {
    this.handleSelectionBound = (e) => this.handleSelection(e)
    document.addEventListener('mouseup', this.handleSelectionBound)
  }

  async handleSelection(event) {
    setTimeout(async () => {
      // 检查点击是否发生在我们的组件内部（ResultPanel 或 FloatingBall）
      const target = event.target

      // 检查是否点击在我们的容器元素上
      if (target.id === 'ai-disguise-result-panel-container' ||
          target.id === 'ai-disguise-floating-ball-container') {
        return
      }

      // 检查父元素链中是否包含我们的容器
      let element = target
      while (element && element !== document.body) {
        if (element.id === 'ai-disguise-result-panel-container' ||
            element.id === 'ai-disguise-floating-ball-container') {
          return
        }
        element = element.parentElement
      }

      const selectedText = window.getSelection().toString().trim()

      if (!selectedText || selectedText.length < 2 || selectedText.length > 300) {
        this.closePanel()
        return
      }

      if (this.isProcessing) return

      const selection = window.getSelection()
      if (selection.rangeCount === 0) return

      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      const selectedStyle = await getSelectedStyle()
      this.closePanel()

      this.currentPanel = createResultPanel({
        originalText: selectedText,
        position: {
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX
        },
        onClose: () => this.closePanel()
      })

      document.body.appendChild(this.currentPanel)
      this.isProcessing = true

      try {
        const result = await transformText(selectedText, selectedStyle)
        if (this.currentPanel) {
          this.currentPanel.updateResult(result)
        }
      } catch (error) {
        if (this.currentPanel) {
          this.currentPanel.showError(error.message || 'Transformation failed')
        }
      } finally {
        this.isProcessing = false
      }
    }, 100)
  }

  closePanel() {
    if (this.currentPanel) {
      this.currentPanel.remove()
      this.currentPanel = null
    }
  }

  destroy() {
    // 移除事件监听器
    if (this.handleSelectionBound) {
      document.removeEventListener('mouseup', this.handleSelectionBound)
      this.handleSelectionBound = null
    }
    // 关闭当前面板
    this.closePanel()
  }
}
