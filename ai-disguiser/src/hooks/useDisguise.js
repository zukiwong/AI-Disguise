// 伪装功能自定义 Hook
// 管理文本伪装的所有状态和逻辑

import { useState, useCallback, useEffect } from 'react'
import { disguiseText, detectTextLanguage } from '../services/geminiApi.js'
import { LANGUAGE_FEATURE, CONVERSION_MODE, PURPOSE_CONFIG, RECIPIENT_CONFIG } from '../services/config.js'
import { useStyles } from './useStyles.js'
import { useAuth } from './useAuth.js'
import { createShare } from '../services/shareService.js'
import { getPublicStylesWithVariants } from '../services/styleService.js'
import { generateVariantPrompt } from '../utils/variantUtils.js'
import { addHistoryRecord } from '../services/historyService.js'

/**
 * 伪装功能的自定义 Hook
 * @returns {Object} 包含状态和方法的对象
 */
export function useDisguise() {
  // 获取用户认证信息
  const { userId, isAuthenticated, userName, userEmail } = useAuth()
  
  // 使用风格管理 Hook，传递 userId
  const { styles, hasStyles } = useStyles(userId)
  
  // 管理带变体的风格数据
  const [stylesWithVariants, setStylesWithVariants] = useState([])
  const [isLoadingVariants, setIsLoadingVariants] = useState(false)
  
  // 基础状态管理
  const [inputText, setInputText] = useState('')           // 输入文本
  const [selectedStyle, setSelectedStyle] = useState('')  // 选择的风格
  const [selectedVariant, setSelectedVariant] = useState(null) // 选择的变体
  const [output, setOutput] = useState('')                 // 输出结果
  const [originalText, setOriginalText] = useState('')     // 保存原文用于对比
  
  // 转换模式相关状态管理
  const [conversionMode, setConversionMode] = useState(CONVERSION_MODE.STYLE) // 转换模式：风格 or 目的+对象
  const [selectedPurpose, setSelectedPurpose] = useState('explain')          // 选择的表达目的
  const [selectedRecipient, setSelectedRecipient] = useState('friend')       // 选择的表达对象
  
  // 语言相关状态管理
  const [outputLanguage, setOutputLanguage] = useState(LANGUAGE_FEATURE.DEFAULT_OUTPUT_LANGUAGE) // 选择的输出语言
  const [detectedLanguage, setDetectedLanguage] = useState('')  // 检测到的输入语言
  
  // 加载状态管理
  const [isLoading, setIsLoading] = useState(false)        // 是否正在处理
  const [error, setError] = useState('')                   // 错误信息
  
  // 历史记录管理 (为后续功能预留)
  const [history, setHistory] = useState([])               // 转换历史
  
  // 分享相关状态
  const [isSharing, setIsSharing] = useState(false)        // 是否正在分享
  const [shareStatus, setShareStatus] = useState('')       // 分享状态信息

  // 加载带变体的风格数据
  useEffect(() => {
    const loadStylesWithVariants = async () => {
      if (!styles || styles.length === 0) return
      
      setIsLoadingVariants(true)
      try {
        // 获取带变体的风格数据
        const stylesWithVariantsData = await getPublicStylesWithVariants(userId)
        
        // 合并原有风格数据和变体数据
        const mergedStyles = styles.map(style => {
          const styleWithVariants = stylesWithVariantsData.find(s => s.id === style.id)
          return styleWithVariants ? {
            ...style,
            variants: styleWithVariants.variants || [],
            hasVariants: (styleWithVariants.variants || []).length > 0
          } : style
        })
        
        setStylesWithVariants(mergedStyles)
      } catch (error) {
        console.error('加载变体数据失败:', error)
        // 降级：使用原有风格数据
        setStylesWithVariants(styles)
      } finally {
        setIsLoadingVariants(false)
      }
    }

    loadStylesWithVariants()
  }, [styles, userId])
  
  // 检查并应用从探索页传来的选择状态
  useEffect(() => {
    try {
      const savedSelection = localStorage.getItem('selectedStyleFromExplore')
      if (savedSelection) {
        const selectionData = JSON.parse(savedSelection)
        
        // 检查时间戳，避免应用过旧的选择（超过5分钟）
        const maxAge = 5 * 60 * 1000 // 5分钟
        if (Date.now() - selectionData.timestamp < maxAge) {
          // 验证风格是否存在
          const styleExists = styles.some(style => style.id === selectionData.styleId)
          if (styleExists) {
            setSelectedStyle(selectionData.styleId)
            setSelectedVariant(selectionData.variantId || null)
            
            // 清除已使用的选择状态
            localStorage.removeItem('selectedStyleFromExplore')
            return
          }
        } else {
          // 清除过期的选择状态
          localStorage.removeItem('selectedStyleFromExplore')
        }
      }
    } catch (error) {
      console.error('应用探索页选择状态失败:', error)
      // 清除可能损坏的数据
      localStorage.removeItem('selectedStyleFromExplore')
    }
  }, [styles]) // 依赖 styles，当风格数据加载完成后执行
  
  // 设置默认选中的风格
  useEffect(() => {
    if (hasStyles && styles.length > 0) {
      // 如果没有选中的风格，或者选中的风格不存在，选择第一个
      const currentStyleExists = styles.some(style => style.id === selectedStyle)
      
      if (!selectedStyle || !currentStyleExists) {
        setSelectedStyle(styles[0].id)
        setSelectedVariant(null) // 重置变体选择
      }
    }
  }, [hasStyles, styles, selectedStyle])

  /**
   * 执行文本伪装转换
   */
  const handleDisguise = useCallback(async () => {
    // 清除之前的错误信息
    setError('')
    
    // 输入验证
    if (!inputText.trim()) {
      setError('Please enter text to transform')
      return
    }

    // 设置加载状态
    setIsLoading(true)
    
    try {
      // 保存原文
      setOriginalText(inputText)
      
      // 检测输入语言（如果启用了多语言功能）
      let inputLang = ''
      if (LANGUAGE_FEATURE.ENABLED) {
        inputLang = detectTextLanguage(inputText)
        setDetectedLanguage(inputLang)
      }
      
      // 调用 API 进行转换，根据转换模式传入不同参数
      let result
      if (conversionMode === CONVERSION_MODE.STYLE) {
        // 风格模式：查找选中的风格配置
        const currentStyle = (stylesWithVariants.length > 0 ? stylesWithVariants : styles).find(style => style.id === selectedStyle)
        if (currentStyle) {
          let finalPrompt = currentStyle.promptTemplate || ''
          
          // 如果选择了变体，使用变体的prompt
          if (selectedVariant) {
            const variant = currentStyle.variants?.find(v => v.id === selectedVariant)
            if (variant) {
              finalPrompt = generateVariantPrompt(currentStyle, variant)
            }
          }
          
          // 传递完整的风格配置对象
          const styleConfig = {
            id: currentStyle.id,
            name: currentStyle.name,
            displayName: currentStyle.displayName,
            description: currentStyle.description,
            promptTemplate: finalPrompt
          }
          result = await disguiseText(inputText, styleConfig, outputLanguage)
        } else {
          // 如果找不到风格配置，使用风格ID（兼容旧的系统风格）
          result = await disguiseText(inputText, selectedStyle, outputLanguage)
        }
      } else {
        // 目的+对象模式：传入目的和对象参数
        result = await disguiseText(inputText, { purpose: selectedPurpose, recipient: selectedRecipient }, outputLanguage)
      }
      
      // 设置输出结果
      setOutput(result)
      
      // 准备历史记录数据
      const historyRecordData = {
        original: inputText,
        disguised: result,
        conversionMode: conversionMode,
        style: conversionMode === CONVERSION_MODE.STYLE ? selectedStyle : null,
        variant: conversionMode === CONVERSION_MODE.STYLE ? selectedVariant : null,
        purpose: conversionMode === CONVERSION_MODE.PURPOSE ? selectedPurpose : null,
        recipient: conversionMode === CONVERSION_MODE.PURPOSE ? selectedRecipient : null,
        outputLanguage: outputLanguage,
        detectedLanguage: inputLang
      }

      // 本地历史记录（兼容现有逻辑）
      const localHistoryItem = {
        id: Date.now(),
        ...historyRecordData,
        timestamp: new Date().toISOString()
      }
      setHistory(prev => [localHistoryItem, ...prev.slice(0, 9)]) // 保留最近10条记录

      // 如果用户已登录，同步到云端
      if (isAuthenticated && userId) {
        try {
          await addHistoryRecord(userId, historyRecordData)
        } catch (cloudError) {
          console.error('保存到云端失败，但本地记录已保存:', cloudError)
          // 不影响用户体验，静默处理云端同步失败
        }
      }
      
    } catch (err) {
      // 错误处理
      console.error('伪装转换失败:', err)
      setError(err.message || '转换失败，请稍后重试')
    } finally {
      // 取消加载状态
      setIsLoading(false)
    }
  }, [inputText, selectedStyle, selectedVariant, outputLanguage, conversionMode, selectedPurpose, selectedRecipient, styles, stylesWithVariants])


  /**
   * 清空所有内容
   */
  const handleClear = useCallback(() => {
    setInputText('')
    setOutput('')
    setOriginalText('')
    setError('')
    setShareStatus('')
    // 不重置选择的风格和变体，保持用户选择
  }, [])

  /**
   * 分享转换结果
   */
  const handleShare = useCallback(async () => {
    if (!isAuthenticated) {
      setError('Please log in first to share content.')
      return false
    }

    if (!output || !originalText) {
      setError('No content to share')
      return false
    }

    setIsSharing(true)
    setShareStatus('')
    setError('')

    try {
      // 准备分享数据
      const shareData = {
        originalText,
        transformedText: output,
        conversionMode,
        authorId: userId,
        authorName: userName || userEmail.split('@')[0],
        outputLanguage,
        detectedLanguage,
        isPublic: true
      }

      // 根据转换模式添加具体信息
      if (conversionMode === CONVERSION_MODE.STYLE) {
        const currentStyle = (stylesWithVariants.length > 0 ? stylesWithVariants : styles).find(style => style.id === selectedStyle)
        shareData.styleInfo = {
          id: selectedStyle,
          name: currentStyle?.name || selectedStyle,
          displayName: currentStyle?.displayName || selectedStyle,
          description: currentStyle?.description || ''
        }
        
        // 如果选择了变体，添加变体信息
        if (selectedVariant) {
          const variant = currentStyle?.variants?.find(v => v.id === selectedVariant)
          if (variant) {
            shareData.variantInfo = {
              id: selectedVariant,
              name: variant.name,
              description: variant.description
            }
          }
        }
      } else {
        // 确保 PURPOSE_CONFIG 和 RECIPIENT_CONFIG 存在且不为 undefined
        shareData.purposeInfo = PURPOSE_CONFIG[selectedPurpose] || null
        shareData.recipientInfo = RECIPIENT_CONFIG[selectedRecipient] || null
      }

      // 创建分享
      const result = await createShare(shareData)
      
      setShareStatus('Share successful! Content has been published to the Explore page.')
      
      // 3秒后清除状态提示
      setTimeout(() => {
        setShareStatus('')
      }, 3000)

      return true
    } catch (err) {
      console.error('分享失败:', err)
      setError(err.message || 'Sharing failed, please try again later.')
      return false
    } finally {
      setIsSharing(false)
    }
  }, [
    isAuthenticated, output, originalText, conversionMode, userId, userName, userEmail,
    outputLanguage, detectedLanguage, selectedStyle, selectedVariant, styles, stylesWithVariants, selectedPurpose, selectedRecipient
  ])

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
    // 当切换风格时，重置变体选择
    setSelectedVariant(null)
  }, [])
  
  /**
   * 更新选择的变体
   */
  const updateSelectedVariant = useCallback((variant) => {
    setSelectedVariant(variant)
  }, [])

  /**
   * 更新输出语言
   */
  const updateOutputLanguage = useCallback((language) => {
    setOutputLanguage(language)
  }, [])

  /**
   * 更新转换模式
   */
  const updateConversionMode = useCallback((mode) => {
    setConversionMode(mode)
  }, [])

  /**
   * 更新选择的表达目的
   */
  const updateSelectedPurpose = useCallback((purpose) => {
    setSelectedPurpose(purpose)
  }, [])

  /**
   * 更新选择的表达对象
   */
  const updateSelectedRecipient = useCallback((recipient) => {
    setSelectedRecipient(recipient)
  }, [])

  // 返回所有状态和方法
  return {
    // 基础状态
    inputText,
    selectedStyle,
    selectedVariant,
    output,
    originalText,
    isLoading,
    error,
    history,
    isSharing,
    shareStatus,
    
    // 变体相关状态
    stylesWithVariants,
    isLoadingVariants,
    
    // 转换模式相关状态
    conversionMode,
    selectedPurpose,
    selectedRecipient,
    
    // 语言相关状态
    outputLanguage,
    detectedLanguage,
    
    // 基础方法
    updateInputText,
    updateSelectedStyle,
    updateSelectedVariant,
    handleDisguise,
    handleClear,
    copyToClipboard,
    handleShare,
    
    // 转换模式相关方法
    updateConversionMode,
    updateSelectedPurpose,
    updateSelectedRecipient,
    
    // 语言相关方法
    updateOutputLanguage,
    
    // 计算属性
    hasOutput: Boolean(output),
    hasOriginal: Boolean(originalText),
    isLanguageFeatureEnabled: LANGUAGE_FEATURE.ENABLED,
    
    // 配置常量（供组件使用）
    CONVERSION_MODE,
    PURPOSE_CONFIG,
    RECIPIENT_CONFIG
  }
}