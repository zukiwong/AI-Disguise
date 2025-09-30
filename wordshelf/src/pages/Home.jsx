import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useDisguise } from '../hooks/useDisguise.js'
import { STYLE_CONFIG, TEXT_LIMITS } from '../services/config.js'
import LanguageSelector from '../components/LanguageSelector.jsx'
import { StyleSelector } from '../components/StyleManager/index.js'
import { gsap } from 'gsap'
import '../styles/Explore.css'
import ManageIcon from '../assets/icons/manage.svg'

function Home() {
  const location = useLocation()

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
    stylesWithVariants, // 获取带变体的样式数据
    isLoadingVariants, // 获取变体加载状态
    removePublicStyleFromAccount, // 样式删除方法
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

  // StyleSelector引用
  const styleSelectorRef = useRef(null)

  // 滚动容器引用，用于蒙版效果
  const scrollableContentRef = useRef(null)

  // 控制是否显示输入界面（true=输入状态，false=输出状态）
  const [showInputMode, setShowInputMode] = useState(true)

  // 检查并应用来自历史记录的预填充数据
  useEffect(() => {
    const prefillData = localStorage.getItem('prefillFromHistory')

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
  }, [updateInputText, updateConversionMode, updateSelectedStyle, updateSelectedVariant, updateSelectedPurpose, updateSelectedRecipient, updateOutputLanguage])

  // 处理预选风格 - 等待styles加载完成
  useEffect(() => {
    const preselectedStyle = localStorage.getItem('preselectedStyle')

    if (preselectedStyle && stylesWithVariants.length > 0) {
      // 检查预选的风格是否存在于当前的风格列表中
      const styleExists = stylesWithVariants.find(s => s.id === preselectedStyle)

      if (styleExists) {
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
        }, 300) // 增加延迟确保UI更新完成
      }
    }
  }, [stylesWithVariants, updateConversionMode, updateSelectedStyle, CONVERSION_MODE.STYLE])

  // 处理URL参数，自动打开StyleManager
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    if (searchParams.get('openStyleManager') === 'true') {
      // 确保StyleSelector已经渲染并且为风格模式
      if (conversionMode !== CONVERSION_MODE.STYLE) {
        updateConversionMode(CONVERSION_MODE.STYLE)
      }

      // 延迟执行以确保StyleSelector已经挂载
      setTimeout(() => {
        if (styleSelectorRef.current) {
          styleSelectorRef.current.openManager()
        }
      }, 300)

      // 清除URL参数以避免重复触发
      const newUrl = new URL(window.location)
      newUrl.searchParams.delete('openStyleManager')
      window.history.replaceState({}, '', newUrl)
    }
  }, [location.search, conversionMode, updateConversionMode])

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

  // 重写清除函数，同时切换到输入状态
  const handleClearWithReset = () => {
    handleClear()
    setShowInputMode(true)
  }

  // 当有输出时，自动切换到输出状态
  useEffect(() => {
    if (hasOutput && !isLoading) {
      setShowInputMode(false)
    }
  }, [hasOutput, isLoading])

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

  // 滚动蒙版效果检测
  useEffect(() => {
    const scrollContainer = scrollableContentRef.current
    if (!scrollContainer) return

    // 找到左侧面板容器
    const leftPanel = scrollContainer.closest('.left-panel.style-panel')
    if (!leftPanel) return

    const checkScrollState = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer
      const hasScroll = scrollHeight > clientHeight
      const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 5 // 5px tolerance

      // 在左侧面板容器上动态添加/移除CSS类
      leftPanel.classList.toggle('has-scroll', hasScroll)
      leftPanel.classList.toggle('at-bottom', isAtBottom)
    }

    // 初始检查
    checkScrollState()

    // 监听滚动事件
    scrollContainer.addEventListener('scroll', checkScrollState)

    // 监听内容变化（当样式列表更新时）
    const resizeObserver = new ResizeObserver(checkScrollState)
    resizeObserver.observe(scrollContainer)

    return () => {
      scrollContainer.removeEventListener('scroll', checkScrollState)
      resizeObserver.disconnect()
    }
  }, [stylesWithVariants, conversionMode]) // 当样式列表或模式变化时重新检测

  return (
    <div className="home-container two-column-layout">
      <div className="main-content-wrapper">
        {/* 左侧：样式选择区域 */}
        <div className="left-panel style-panel">
          {/* 模式切换 - 固定头部 */}
          <div className="mode-selector fixed-header">
            <div className="explore-tabs">
              <div className="tab-buttons">
                <button
                  className={`explore-tab ${conversionMode === CONVERSION_MODE.STYLE ? 'active' : ''}`}
                  onClick={() => updateConversionMode(CONVERSION_MODE.STYLE)}
                  disabled={isLoading}
                >
                  Style Mode
                </button>
                <button
                  className={`explore-tab ${conversionMode === CONVERSION_MODE.PURPOSE ? 'active' : ''}`}
                  onClick={() => updateConversionMode(CONVERSION_MODE.PURPOSE)}
                  disabled={isLoading}
                >
                  Purpose Mode
                </button>
              </div>
              {conversionMode === CONVERSION_MODE.STYLE && (
                <button
                  className="manage-icon-button"
                  onClick={() => {
                    // 直接调用StyleSelector内置的管理功能
                    if (styleSelectorRef.current) {
                      styleSelectorRef.current.openManager();
                    }
                  }}
                  disabled={isLoading}
                  title="Manage Styles"
                >
                  <img src={ManageIcon} alt="Manage Styles" className="manage-icon" />
                </button>
              )}
            </div>
          </div>

          {/* 可滚动内容区域 */}
          <div ref={scrollableContentRef} className="scrollable-content">
            {/* 根据模式显示不同的选择器 */}
            {conversionMode === CONVERSION_MODE.STYLE ? (
              <StyleSelector
                ref={styleSelectorRef}
                selectedStyle={selectedStyle}
                selectedVariant={selectedVariant}
                stylesWithVariants={stylesWithVariants}
                isLoadingVariants={isLoadingVariants}
                removePublicStyleFromAccount={removePublicStyleFromAccount}
                onStyleChange={updateSelectedStyle}
                onVariantChange={updateSelectedVariant}
                disabled={isLoading}
                showManageButton={false}
                showTitle={false}
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
          </div>
        </div>

        {/* 右侧：输入输出区域 */}
        <div className="right-panel content-panel">
          {/* 输入状态：完整输入界面 */}
          {showInputMode && (
            <div className="input-section">
              <h3>What are you trying to say?</h3>
              <div className="input-wrapper">
                <textarea
                  value={inputText}
                  onChange={(e) => updateInputText(e.target.value)}
                  placeholder="Describe your situation or what's on your mind..."
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

              {/* 语言选择器 */}
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
                  {isLoading ? 'Finding the right words...' : 'Transform'}
                </button>

                <button
                  onClick={handleRandomDisguise}
                  disabled={!inputText.trim() || isLoading}
                  className="random-button"
                  title="Need inspiration? Let us pick a style for you!"
                >
                  Random
                </button>

                <button
                  onClick={handleClearWithReset}
                  disabled={isLoading}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* 输出状态：紧凑输入预览 */}
          {!showInputMode && hasOutput && (
            <div className="compact-controls">
              <div className="input-preview">
                <span className="input-preview-text">{inputText.slice(0, 80)}{inputText.length > 80 ? '...' : ''}</span>
                <button
                  className="edit-input-btn"
                  onClick={() => setShowInputMode(true)}
                >
                  Edit
                </button>
              </div>
              <div className="quick-actions">
                <button
                  onClick={handleDisguise}
                  disabled={!inputText.trim() || isLoading}
                  className="primary-button compact"
                >
                  Regenerate
                </button>
                <button
                  onClick={handleClearWithReset}
                  disabled={isLoading}
                  className="clear-btn compact"
                >
                  New
                </button>
              </div>
            </div>
          )}

          {/* 错误信息显示 */}
          {error && (
            <div className="error-message">
              <span>{error}</span>
            </div>
          )}

          {/* 复制状态提示 */}
          {copyStatus && (
            <div className="copy-status">
              {copyStatus}
            </div>
          )}

          {/* 分享状态提示 */}
          {shareStatus && (
            <div className="share-status">
              {shareStatus}
            </div>
          )}

          {/* 结果显示区域 - 加载时始终显示，有输出时只在输出状态显示 */}
          {(isLoading || (hasOutput && !showInputMode)) && (
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
                      Finding the perfect words for you...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="output-section">
                  <div className="result-header">
                    <h3>Your Expression:</h3>
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
                        onClick={() => handleCopy(output, 'Expression')}
                        disabled={isLoading}
                      >
                        Copy Expression
                      </button>
                      <button
                        onClick={handleShare}
                        disabled={isLoading || isSharing}
                        className="share-button"
                      >
                        {isSharing ? 'Sharing...' : 'Help Others in Similar Situations'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home