// 伪装功能自定义 Hook
// 管理文本伪装的所有状态和逻辑

import { useState, useCallback } from 'react'
import { disguiseText } from '../services/geminiApi.js'

/**
 * 伪装功能的自定义 Hook
 * @returns {Object} 包含状态和方法的对象
 */
export function useDisguise() {
  // 基础状态管理
  const [inputText, setInputText] = useState('')           // 输入文本
  const [selectedStyle, setSelectedStyle] = useState('chat') // 选择的风格
  const [output, setOutput] = useState('')                 // 输出结果
  const [originalText, setOriginalText] = useState('')     // 保存原文用于对比
  
  // 加载状态管理
  const [isLoading, setIsLoading] = useState(false)        // 是否正在处理
  const [error, setError] = useState('')                   // 错误信息
  
  // 历史记录管理 (为后续功能预留)
  const [history, setHistory] = useState([])               // 转换历史

  /**
   * 执行文本伪装转换
   */
  const handleDisguise = useCallback(async () => {
    // 清除之前的错误信息
    setError('')
    
    // 输入验证
    if (!inputText.trim()) {
      setError('请输入要转换的文本')
      return
    }

    // 设置加载状态
    setIsLoading(true)
    
    try {
      // 保存原文
      setOriginalText(inputText)
      
      // 调用 API 进行转换
      const result = await disguiseText(inputText, selectedStyle)
      
      // 设置输出结果
      setOutput(result)
      
      // 添加到历史记录
      const historyItem = {
        id: Date.now(),
        original: inputText,
        disguised: result,
        style: selectedStyle,
        timestamp: new Date().toISOString()
      }
      setHistory(prev => [historyItem, ...prev.slice(0, 9)]) // 保留最近10条记录
      
    } catch (err) {
      // 错误处理
      console.error('伪装转换失败:', err)
      setError(err.message || '转换失败，请稍后重试')
    } finally {
      // 取消加载状态
      setIsLoading(false)
    }
  }, [inputText, selectedStyle])

  /**
   * 重新生成 - 使用相同的输入和风格重新转换
   */
  const handleRegenerate = useCallback(async () => {
    if (!originalText) {
      setError('没有可重新生成的内容')
      return
    }
    
    // 临时保存当前输入，用原文重新生成
    const currentInput = inputText
    setInputText(originalText)
    
    // 执行转换
    await handleDisguise()
    
    // 恢复输入框内容
    setInputText(currentInput)
  }, [originalText, handleDisguise, inputText])

  /**
   * 清空所有内容
   */
  const handleClear = useCallback(() => {
    setInputText('')
    setOutput('')
    setOriginalText('')
    setError('')
  }, [])

  /**
   * 复制文本到剪贴板
   * @param {string} text - 要复制的文本
   */
  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.error('复制失败:', err)
      // 备用复制方法
      try {
        const textArea = document.createElement('textarea')
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        return true
      } catch (fallbackErr) {
        console.error('备用复制方法也失败:', fallbackErr)
        return false
      }
    }
  }, [])

  /**
   * 更新输入文本并清除错误
   */
  const updateInputText = useCallback((text) => {
    setInputText(text)
    if (error) setError('') // 用户开始输入时清除错误信息
  }, [error])

  /**
   * 更新选择的风格
   */
  const updateSelectedStyle = useCallback((style) => {
    setSelectedStyle(style)
  }, [])

  // 返回所有状态和方法
  return {
    // 状态
    inputText,
    selectedStyle,
    output,
    originalText,
    isLoading,
    error,
    history,
    
    // 方法
    updateInputText,
    updateSelectedStyle,
    handleDisguise,
    handleRegenerate,
    handleClear,
    copyToClipboard,
    
    // 计算属性
    hasOutput: Boolean(output),
    hasOriginal: Boolean(originalText),
    canRegenerate: Boolean(originalText) && !isLoading
  }
}