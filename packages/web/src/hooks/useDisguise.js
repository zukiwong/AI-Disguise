// 伪装功能自定义 Hook
// 管理文本伪装的所有状态和逻辑

import { useState, useCallback, useEffect, useRef } from 'react'
import { disguiseText, detectTextLanguage } from '../services/geminiApi.js'
import { LANGUAGE_FEATURE } from '../services/config.js'
import { useStyles } from './useStyles.js'
import { useAuth } from './useAuth.js'
import { createShare } from '../services/shareService.js'
import { getPublicStylesWithVariants, incrementUsageCount } from '../services/styleService.js'
import { generateVariantPrompt } from '../utils/variantUtils.js'
import { addHistoryRecord } from '../services/historyService.js'
import eventBus, { EVENTS } from '../utils/eventBus.js'
import { checkFreeUsageLimit, recordFreeUsage, getUserApiConfig } from '../services/apiConfigService.js'

/**
 * 伪装功能的自定义 Hook
 * @returns {Object} 包含状态和方法的对象
 */
export function useDisguise() {
  // 获取用户认证信息
  const { userId, isAuthenticated, userName, userEmail } = useAuth()
  
  // 使用风格管理 Hook，传递 userId
  const { styles, hasStyles, loadStyles, removePublicStyleFromAccount } = useStyles(userId)
  
  // 管理带变体的风格数据
  const [stylesWithVariants, setStylesWithVariants] = useState([])
  const [isLoadingVariants, setIsLoadingVariants] = useState(false)
  
  // 基础状态管理
  const [inputText, setInputText] = useState('')           // 输入文本
  const [selectedStyle, setSelectedStyle] = useState('')  // 选择的风格
  const [selectedVariant, setSelectedVariant] = useState(null) // 选择的变体
  const [output, setOutput] = useState('')                 // 输出结果
  const [originalText, setOriginalText] = useState('')     // 保存原文用于对比

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

  // 免费使用次数状态
  const [usageInfo, setUsageInfo] = useState({ used: 0, limit: 20, remaining: 20 }) // 使用次数信息

  // 缓存相关（用于样式选择逻辑）
  const lastLoadedStylesRef = useRef('')

  // 简化的变体数据同步（直接使用 useStyles 已经提供的带变体数据）
  useEffect(() => {
    if (!styles || styles.length === 0) {
      setStylesWithVariants([])
      setIsLoadingVariants(false)
      return
    }
    
    // 直接使用 useStyles 返回的数据（现在已经包含变体信息）
    setStylesWithVariants(styles)
    setIsLoadingVariants(false)
  }, [styles])
  
  // 检查并应用从探索页传来的选择状态
  useEffect(() => {
    const handleExploreStyleSelection = async () => {
      try {
        const savedSelection = localStorage.getItem('selectedStyleFromExplore')
        if (!savedSelection) return
        
        const selectionData = JSON.parse(savedSelection)
        
        console.log('🔍 找到探索页选择数据:', selectionData)
        console.log('🔍 当前可用样式:', styles.map(s => ({ id: s.id, displayName: s.displayName })))
        
        // 检查时间戳，避免应用过旧的选择（超过5分钟）
        const maxAge = 5 * 60 * 1000 // 5分钟
        if (Date.now() - selectionData.timestamp >= maxAge) {
          console.log('⏰ 探索页选择数据已过期')
          localStorage.removeItem('selectedStyleFromExplore')
          return
        }
        
        // 验证风格是否存在于用户的个人样式列表中
        const styleExists = styles.some(style => style.id === selectionData.styleId)
        
        if (styleExists) {
          console.log('✅ 应用探索页选择的样式:', selectionData.styleId, '变体:', selectionData.variantId)
          setSelectedStyle(selectionData.styleId)
          setSelectedVariant(selectionData.variantId || null)
          
          // 切换到风格模式
          setConversionMode(CONVERSION_MODE.STYLE)
          
          // 清除已使用的选择状态
          localStorage.removeItem('selectedStyleFromExplore')
          return
        }
        
        // 如果样式不在用户个人列表中，尝试从公共样式中获取并临时应用
        console.log('❌ 样式不存在于用户样式列表中，尝试从公共样式获取:', selectionData.styleId)
        
        try {
          const publicStyles = await getPublicStylesWithVariants(userId)
          const publicStyle = publicStyles.find(s => s.id === selectionData.styleId)
          
          if (publicStyle) {
            console.log('✅ 从公共样式中找到样式，临时应用:', publicStyle.displayName)
            
            // 创建临时样式对象，包含完整的变体信息
            const tempStyle = {
              id: publicStyle.id,
              displayName: publicStyle.displayName,
              promptTemplate: publicStyle.promptTemplate,
              description: publicStyle.description,
              isPublic: true,
              isTemp: true, // 标记为临时样式
              variants: publicStyle.variants || [], // 包含变体信息
              hasVariants: (publicStyle.variants || []).length > 0, // 变体标识
              createdBy: publicStyle.createdBy || 'system' // 创建者信息
            }
            
            // 智能合并临时样式：更新现有的或添加新的
            setStylesWithVariants(prev => {
              const existingIndex = prev.findIndex(s => s.id === tempStyle.id)
              if (existingIndex !== -1) {
                // 如果已经存在，合并数据（使用更完整的变体信息）
                const updatedStyles = [...prev]
                updatedStyles[existingIndex] = {
                  ...updatedStyles[existingIndex],
                  ...tempStyle, // 使用临时样式的完整数据
                  variants: tempStyle.variants || updatedStyles[existingIndex].variants || [],
                  hasVariants: (tempStyle.variants || updatedStyles[existingIndex].variants || []).length > 0
                }
                console.log('🔄 更新现有样式的数据:', tempStyle.displayName)
                return updatedStyles
              } else {
                // 如果不存在，添加到列表开头
                console.log('➕ 添加新的临时样式:', tempStyle.displayName)
                return [tempStyle, ...prev]
              }
            })
            
            // 应用选择
            setSelectedStyle(selectionData.styleId)
            setSelectedVariant(selectionData.variantId || null)
            
            // 清除已使用的选择状态
            localStorage.removeItem('selectedStyleFromExplore')
            
            console.log('✅ 临时样式应用成功')
          } else {
            console.log('❌ 在公共样式中也未找到该样式')
            localStorage.removeItem('selectedStyleFromExplore')
          }
        } catch (error) {
          console.error('获取公共样式失败:', error)
          localStorage.removeItem('selectedStyleFromExplore')
        }
        
      } catch (error) {
        console.error('应用探索页选择状态失败:', error)
        localStorage.removeItem('selectedStyleFromExplore')
      }
    }
    
    if (styles.length > 0) {
      handleExploreStyleSelection()
    }
  }, [styles, userId]) // 依赖 styles，当风格数据加载完成后执行
  
  // 设置默认选中的风格
  useEffect(() => {
    if (hasStyles && stylesWithVariants.length > 0) {
      // 如果没有选中的风格，或者选中的风格不存在，选择第一个
      const currentStyleExists = stylesWithVariants.some(style => style.id === selectedStyle)
      
      if (!selectedStyle || !currentStyleExists) {
        setSelectedStyle(stylesWithVariants[0].id)
        setSelectedVariant(null) // 重置变体选择
      }
    }
  }, [hasStyles, stylesWithVariants, selectedStyle])

  // 监听样式更新事件，强制刷新样式数据
  useEffect(() => {
    const unsubscribe = eventBus.on(EVENTS.STYLES_UPDATED, (data) => {
      // 只有当userId匹配时才刷新
      if (data.userId === userId) {
        console.log('useDisguise: 检测到样式更新事件，强制刷新样式数据')
        // 直接调用loadStyles来刷新
        if (loadStyles) {
          loadStyles()
        }
      }
    })

    return unsubscribe
  }, [userId, loadStyles])

  // 更新免费使用次数信息
  useEffect(() => {
    const updateUsageInfo = async () => {
      try {
        // 首先获取用户的 API 配置
        let apiConfig = null
        if (isAuthenticated && userId) {
          apiConfig = await getUserApiConfig(userId)
        }

        // 如果是免费模式，获取使用次数
        const isFreeMode = !apiConfig || apiConfig.mode === 'free'
        if (isFreeMode) {
          const usageLimit = await checkFreeUsageLimit(isAuthenticated ? userId : null)
          setUsageInfo({
            used: usageLimit.used,
            limit: usageLimit.limit,
            remaining: usageLimit.remaining
          })
        } else {
          // 自定义 API 模式，不显示限制
          setUsageInfo({ used: 0, limit: 0, remaining: 0 })
        }
      } catch (error) {
        console.error('获取使用次数信息失败:', error)
      }
    }

    updateUsageInfo()
  }, [isAuthenticated, userId, output]) // 当用户状态变化或有新输出时更新

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
      // 检查免费使用限制（对所有用户，包括游客）
      // 首先获取用户的 API 配置
      let apiConfig = null
      if (isAuthenticated && userId) {
        apiConfig = await getUserApiConfig(userId)
      }

      // 如果是免费模式（游客或未配置自定义 API 的用户），检查次数限制
      const isFreeMode = !apiConfig || apiConfig.mode === 'free'
      if (isFreeMode) {
        const usageLimit = await checkFreeUsageLimit(isAuthenticated ? userId : null)

        if (!usageLimit.allowed) {
          // 抛出特殊错误，包含 limitReached 标记
          const limitError = new Error('LIMIT_REACHED')
          limitError.limitReached = true
          throw limitError
        }
      }

      // 保存原文
      setOriginalText(inputText)

      // 检测输入语言（如果启用了多语言功能）
      let inputLang = ''
      if (LANGUAGE_FEATURE.ENABLED) {
        inputLang = detectTextLanguage(inputText)
        setDetectedLanguage(inputLang)
      }

      // 调用 API 进行转换
      let result
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
      
      // 设置输出结果
      setOutput(result)

      // 记录免费使用次数（仅在免费模式下）
      if (isFreeMode) {
        recordFreeUsage(isAuthenticated ? userId : null).catch(err => {
          console.error('记录免费使用次数失败（不影响主功能）:', err)
        })
      }

      // 获取风格和变体的显示名称
      let styleDisplayName = null
      let variantDisplayName = null

      if (selectedStyle) {
        const currentStyle = stylesWithVariants.find(style => style.id === selectedStyle)
        styleDisplayName = currentStyle?.displayName || currentStyle?.name || 'Custom Style'

        if (selectedVariant) {
          const variant = currentStyle?.variants?.find(v => v.id === selectedVariant)
          variantDisplayName = variant?.name || 'Custom Variant'
        }

        // 增加风格使用次数（仅登录用户，游客无 Firestore 写权限）
        if (isAuthenticated && userId) {
          incrementUsageCount(selectedStyle).catch(err => {
            console.error('增加使用次数失败（不影响主功能）:', err)
          })
        }
      }

      // 准备历史记录数据
      const historyRecordData = {
        original: inputText,
        disguised: result,
        conversionMode: 'style',
        style: selectedStyle,
        styleDisplayName: styleDisplayName, // 保存风格显示名称
        variant: selectedVariant,
        variantDisplayName: variantDisplayName, // 保存变体显示名称
        purpose: null,
        recipient: null,
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
  }, [inputText, selectedStyle, selectedVariant, outputLanguage, styles, stylesWithVariants, isAuthenticated, userId])


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
        conversionMode: 'style',
        authorId: userId,
        authorName: userName || userEmail.split('@')[0],
        outputLanguage,
        detectedLanguage,
        isPublic: true
      }

      // 添加风格信息
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
    isAuthenticated, output, originalText, userId, userName, userEmail,
    outputLanguage, detectedLanguage, selectedStyle, selectedVariant, styles, stylesWithVariants
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

    // 语言相关状态
    outputLanguage,
    detectedLanguage,

    // 使用次数信息
    usageInfo,

    // 基础方法
    updateInputText,
    updateSelectedStyle,
    updateSelectedVariant,
    handleDisguise,
    handleClear,
    copyToClipboard,
    handleShare,

    // 语言相关方法
    updateOutputLanguage,

    // 样式管理方法
    removePublicStyleFromAccount,

    // 计算属性
    hasOutput: Boolean(output),
    hasOriginal: Boolean(originalText),
    isLanguageFeatureEnabled: LANGUAGE_FEATURE.ENABLED
  }
}