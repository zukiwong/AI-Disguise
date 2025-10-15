// 文字选中处理器 - 监听文字选中事件，自动调用 AI 转换

import { getSelectedStyle } from './storage.js'
import { createResultPanel } from '../components/ResultPanel.js'
import { transformText } from './transformer.js'

export class SelectionHandler {
  constructor() {
    this.currentPanel = null
    this.isProcessing = false
  }

  /**
   * 初始化选中处理器
   */
  init() {
    // 监听鼠标抬起事件
    document.addEventListener('mouseup', (e) => this.handleSelection(e))

    // 监听键盘选择（Ctrl+A 等）
    document.addEventListener('keyup', (e) => {
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        this.handleSelection(e)
      }
    })

    console.log('✅ Selection Handler 已初始化')
  }

  /**
   * 处理文字选中事件
   */
  async handleSelection(event) {
    // 延迟一小段时间，确保选中完成
    setTimeout(async () => {
      const selectedText = window.getSelection().toString().trim()

      // 如果没有选中文字，或文字过短，不处理
      if (!selectedText || selectedText.length < 2) {
        this.closePanel()
        return
      }

      // 如果文字过长（超过 300 字符），不处理
      if (selectedText.length > 300) {
        console.log('选中文字过长，跳过处理')
        this.closePanel()
        return
      }

      // 如果正在处理，不重复处理
      if (this.isProcessing) {
        return
      }

      // 获取选中文字的位置
      const selection = window.getSelection()
      if (selection.rangeCount === 0) return

      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      // 获取当前选中的风格
      const selectedStyle = await getSelectedStyle()

      // 关闭之前的面板
      this.closePanel()

      // 创建并显示结果面板（加载状态）
      this.currentPanel = createResultPanel({
        originalText: selectedText,
        position: {
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX
        },
        onClose: () => this.closePanel()
      })

      document.body.appendChild(this.currentPanel)

      // 开始转换
      this.isProcessing = true

      try {
        const transformedText = await transformText(selectedText, selectedStyle)

        // 更新面板显示结果
        if (this.currentPanel) {
          this.currentPanel.updateResult(transformedText)
        }
      } catch (error) {
        console.error('文本转换失败:', error)

        // 显示错误信息
        if (this.currentPanel) {
          this.currentPanel.showError(error.message || 'Transformation failed')
        }
      } finally {
        this.isProcessing = false
      }
    }, 100)
  }

  /**
   * 关闭当前面板
   */
  closePanel() {
    if (this.currentPanel) {
      this.currentPanel.remove()
      this.currentPanel = null
    }
  }
}
