// 文字选中处理器

import { getSelectedStyle } from './storage.js'
import { createResultPanel } from '../components/ResultPanel.js'
import { transformText } from './transformer.js'

export class SelectionHandler {
  constructor() {
    this.currentPanel = null
    this.isProcessing = false
  }

  init() {
    document.addEventListener('mouseup', (e) => this.handleSelection(e))
    console.log('✅ Selection Handler initialized')
  }

  async handleSelection(event) {
    setTimeout(async () => {
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
}
