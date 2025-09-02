import { useState, useEffect, useRef } from 'react'
import { useDisguise } from '../hooks/useDisguise.js'
import { STYLE_CONFIG, TEXT_LIMITS } from '../services/config.js'
import LanguageSelector from '../components/LanguageSelector.jsx'
import { StyleSelector } from '../components/StyleManager/index.js'
import { gsap } from 'gsap'

function Home() {
  // 使用自定义 Hook 管理伪装功能
  const {
    inputText,
    selectedStyle,
    selectedVariant, // 新增变体状态
    output,
    isLoading,
    error,
    outputLanguage,
    detectedLanguage,
    conversionMode,
    selectedPurpose,
    selectedRecipient,
    updateInputText,
    updateSelectedStyle,
    updateSelectedVariant, // 新增变体更新方法
    updateOutputLanguage,
    updateConversionMode,
    updateSelectedPurpose,
    updateSelectedRecipient,
    handleDisguise,
    handleClear,
    copyToClipboard,
    handleShare,
    hasOutput,
    isLanguageFeatureEnabled,
    isSharing,
    shareStatus,
    CONVERSION_MODE,
    PURPOSE_CONFIG,
    RECIPIENT_CONFIG
  } = useDisguise()

  // 复制状态管理
  const [copyStatus, setCopyStatus] = useState('')
  
  // 进度条动画引用
  const progressBarRef = useRef(null)
  const progressTextRef = useRef(null)

  // 检查并应用来自历史记录的预填充数据和预选风格
  useEffect(() => {
    const prefillData = localStorage.getItem('prefillFromHistory')
    const preselectedStyle = localStorage.getItem('preselectedStyle')
    
    if (prefillData) {
      try {
        const data = JSON.parse(prefillData)
        
        // 清除预填充数据，避免重复应用
        localStorage.removeItem('prefillFromHistory')
        
        // 应用预填充数据
        if (data.inputText) updateInputText(data.inputText)
        if (data.conversionMode) updateConversionMode(data.conversionMode)
        if (data.style) updateSelectedStyle(data.style)
        if (data.variant) updateSelectedVariant(data.variant)
        if (data.purpose) updateSelectedPurpose(data.purpose)
        if (data.recipient) updateSelectedRecipient(data.recipient)
        if (data.outputLanguage) updateOutputLanguage(data.outputLanguage)
        
      } catch (error) {
        console.error('应用预填充数据失败:', error)
        localStorage.removeItem('prefillFromHistory')
      }
    }
    
    // 处理从未登录历史页面预选的风格
    if (preselectedStyle) {
      localStorage.removeItem('preselectedStyle') // 清除预选数据，避免重复应用
      updateConversionMode(CONVERSION_MODE.STYLE) // 切换到风格模式
      updateSelectedStyle(preselectedStyle) // 应用预选风格
      
      // 滚动到输入区域，引导用户输入文本
      setTimeout(() => {
        const textarea = document.querySelector('textarea')
        if (textarea) {
          textarea.focus()
          textarea.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }, [])

  // 处理复制操作
  const handleCopy = async (text, type) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopyStatus(`${type} copied`)
      setTimeout(() => setCopyStatus(''), 2000)
    } else {
      setCopyStatus('Copy failed')
      setTimeout(() => setCopyStatus(''), 2000)
    }
  }

  // 处理随机变装功能
  const handleRandomDisguise = () => {
    // 获取可用的风格列表
    let availableStyles = []
    
    if (conversionMode === CONVERSION_MODE.STYLE) {
      // 风格模式：从STYLE_CONFIG中获取可用风格
      availableStyles = Object.keys(STYLE_CONFIG)
    } else {
      // 目的+对象模式：随机选择目的和对象
      const purposes = Object.keys(PURPOSE_CONFIG)
      const recipients = Object.keys(RECIPIENT_CONFIG)
      
      // 随机选择目的和对象
      const randomPurpose = purposes[Math.floor(Math.random() * purposes.length)]
      const randomRecipient = recipients[Math.floor(Math.random() * recipients.length)]
      
      // 更新选择的目的和对象
      updateSelectedPurpose(randomPurpose)
      updateSelectedRecipient(randomRecipient)
      
      // 直接开始转换
      handleDisguise()
      return
    }
    
    // 风格模式：随机选择一个风格
    if (availableStyles.length > 0) {
      const randomStyle = availableStyles[Math.floor(Math.random() * availableStyles.length)]
      updateSelectedStyle(randomStyle)
      
      // 延迟一下确保状态更新后再执行转换
      setTimeout(() => {
        handleDisguise()
      }, 100)
    }
  }

  // 进度条动画效果
  useEffect(() => {
    if (isLoading && progressBarRef.current && progressTextRef.current) {
      // 重置进度条
      gsap.set(progressBarRef.current, { width: '0%' })
      gsap.set(progressTextRef.current, { opacity: 1 })
      
      // 创建进度动画时间线
      const tl = gsap.timeline()
      
      // 阶段1: 快速到30%
      tl.to(progressBarRef.current, {
        width: '30%',
        duration: 0.5,
        ease: 'power2.out'
      })
      
      // 阶段2: 慢速到70%
      .to(progressBarRef.current, {
        width: '70%',
        duration: 2,
        ease: 'power1.inOut'
      })
      
      // 阶段3: 非常慢到85%
      .to(progressBarRef.current, {
        width: '85%',
        duration: 3,
        ease: 'power1.out'
      })
      
      // 文字呼吸动画
      gsap.to(progressTextRef.current, {
        opacity: 0.6,
        duration: 1,
        yoyo: true,
        repeat: -1,
        ease: 'power2.inOut'
      })
      
      return () => {
        tl.kill()
        gsap.killTweensOf(progressTextRef.current)
      }
    }
    
    // 当加载完成时，快速完成进度条
    if (!isLoading && progressBarRef.current) {
      gsap.to(progressBarRef.current, {
        width: '100%',
        duration: 0.3,
        ease: 'power2.out',
        onComplete: () => {
          // 稍后重置
          setTimeout(() => {
            if (progressBarRef.current) {
              gsap.set(progressBarRef.current, { width: '0%' })
            }
          }, 500)
        }
      })
    }
  }, [isLoading])

  return (
    <div className="home-container">
      <h1>AI Disguiser</h1>
      <p>Transform your text into different styles using AI</p>
      
      {/* 输入区域 */}
      <div className="input-section">
        <h3>Input Text:</h3>
        <div className="input-wrapper">
          <textarea 
            value={inputText}
            onChange={(e) => updateInputText(e.target.value)}
            placeholder="Enter text to transform..."
            maxLength={TEXT_LIMITS.MAX_INPUT_LENGTH}
            disabled={isLoading}
            className={error ? 'error' : ''}
          />
          <div className="input-info">
            <span className="char-count">
              {inputText.length}/{TEXT_LIMITS.MAX_INPUT_LENGTH}
            </span>
            {inputText.length > TEXT_LIMITS.MAX_INPUT_LENGTH - 50 && (
              <span className="char-warning">
                {TEXT_LIMITS.MAX_INPUT_LENGTH - inputText.length} characters remaining
              </span>
            )}
          </div>
        </div>
        
      </div>

      {/* 控制区域 */}
      <div className="control-section">
        {/* 模式切换 */}
        <div className="mode-selector">
          <h3>Conversion Mode:</h3>
          <div className="mode-tabs">
            <button 
              className={`mode-tab ${conversionMode === CONVERSION_MODE.STYLE ? 'active' : ''}`}
              onClick={() => updateConversionMode(CONVERSION_MODE.STYLE)}
              disabled={isLoading}
            >
              Style Mode
            </button>
            <button 
              className={`mode-tab ${conversionMode === CONVERSION_MODE.PURPOSE ? 'active' : ''}`}
              onClick={() => updateConversionMode(CONVERSION_MODE.PURPOSE)}
              disabled={isLoading}
            >
              Purpose + Recipient Mode
            </button>
          </div>
        </div>

        {/* 根据模式显示不同的选择器 */}
        {conversionMode === CONVERSION_MODE.STYLE ? (
          <StyleSelector
            selectedStyle={selectedStyle}
            selectedVariant={selectedVariant} // 传递变体状态
            onStyleChange={updateSelectedStyle}
            onVariantChange={updateSelectedVariant} // 传递变体更新方法
            disabled={isLoading}
            showManageButton={true}
          />
        ) : (
          <div className="purpose-recipient-selector">
            <div className="purpose-selector">
              <h3>Expression Purpose:</h3>
              <select 
                value={selectedPurpose}
                onChange={(e) => updateSelectedPurpose(e.target.value)}
                disabled={isLoading}
              >
                {Object.entries(PURPOSE_CONFIG).map(([key, purpose]) => (
                  <option key={key} value={key}>
                    {purpose.displayName} - {purpose.description}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="recipient-selector">
              <h3>Target Recipient:</h3>
              <select 
                value={selectedRecipient}
                onChange={(e) => updateSelectedRecipient(e.target.value)}
                disabled={isLoading}
              >
                {Object.entries(RECIPIENT_CONFIG).map(([key, recipient]) => (
                  <option key={key} value={key}>
                    {recipient.displayName} - {recipient.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        
        {/* 语言选择器 - 只在启用时显示 */}
        <LanguageSelector
          selectedLanguage={outputLanguage}
          onLanguageChange={updateOutputLanguage}
          disabled={isLoading}
        />
        
        <div className="action-buttons">
          <button 
            onClick={handleDisguise}
            disabled={!inputText.trim() || isLoading}
            className="primary-button"
          >
            {isLoading ? 'Converting...' : 'Start Transform'}
          </button>
          
          <button 
            onClick={handleRandomDisguise}
            disabled={!inputText.trim() || isLoading}
            className="random-button"
            title="Can't decide? Let AI pick a random style for you!"
          >
            Random
          </button>
          
          <button 
            onClick={handleClear}
            disabled={isLoading}
          >
            Clear
          </button>
        </div>
      </div>

      {/* 错误信息显示 */}
      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* 复制状态提示 */}
      {copyStatus && (
        <div className="copy-status">
          ✅ {copyStatus}
        </div>
      )}

      {/* 分享状态提示 */}
      {shareStatus && (
        <div className="share-status">
          🎉 {shareStatus}
        </div>
      )}

      {/* 结果显示区域 */}
      {(hasOutput || isLoading) && (
        <div className="result-section">
          {isLoading ? (
            <div className="loading-indicator">
              <div className="progress-container">
                <div className="progress-bar-bg">
                  <div 
                    ref={progressBarRef}
                    className="progress-bar-fill"
                  />
                </div>
                <p ref={progressTextRef} className="progress-text">
                  AI is transforming your text, please wait...
                </p>
              </div>
            </div>
          ) : (
            <div className="output-section">
              <div className="result-header">
                <h3>Result:</h3>
                {/* 显示语言检测信息（仅在启用多语言功能时） */}
                {isLanguageFeatureEnabled && detectedLanguage && (
                  <div className="language-info">
                    <span className="detected-language">
                      Detected input language: {detectedLanguage.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="result-container">
                <div className="text-content">
                  {output}
                </div>
                <div className="result-actions">
                  <button 
                    onClick={() => handleCopy(output, 'Result')}
                    disabled={isLoading}
                  >
                    Copy Result
                  </button>
                  <button 
                    onClick={handleShare}
                    disabled={isLoading || isSharing}
                    className="share-button"
                  >
                    {isSharing ? 'Sharing...' : 'Share to Explore'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Home