import { useState } from 'react'
import { useDisguise } from '../hooks/useDisguise.js'
import { STYLE_CONFIG, TEXT_LIMITS } from '../services/config.js'

function Home() {
  // 使用自定义 Hook 管理伪装功能
  const {
    inputText,
    selectedStyle,
    output,
    originalText,
    isLoading,
    error,
    updateInputText,
    updateSelectedStyle,
    handleDisguise,
    handleRegenerate,
    handleClear,
    copyToClipboard,
    hasOutput,
    hasOriginal,
    canRegenerate
  } = useDisguise()

  // 复制状态管理
  const [copyStatus, setCopyStatus] = useState('')

  // 处理复制操作
  const handleCopy = async (text, type) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopyStatus(`${type}已复制`)
      setTimeout(() => setCopyStatus(''), 2000)
    } else {
      setCopyStatus('复制失败')
      setTimeout(() => setCopyStatus(''), 2000)
    }
  }

  return (
    <div className="home-container">
      <h1>AI Disguiser</h1>
      <p>使用 AI 将你的文本转换为不同风格</p>
      
      {/* 输入区域 */}
      <div className="input-section">
        <h3>输入文本:</h3>
        <div className="input-wrapper">
          <textarea 
            value={inputText}
            onChange={(e) => updateInputText(e.target.value)}
            placeholder="请输入要转换的文本..."
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
                还可输入 {TEXT_LIMITS.MAX_INPUT_LENGTH - inputText.length} 个字符
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 控制区域 */}
      <div className="control-section">
        <div className="style-selector">
          <h3>选择风格:</h3>
          <select 
            value={selectedStyle}
            onChange={(e) => updateSelectedStyle(e.target.value)}
            disabled={isLoading}
          >
            {Object.entries(STYLE_CONFIG).map(([key, style]) => (
              <option key={key} value={key}>
                {style.displayName} - {style.description}
              </option>
            ))}
          </select>
        </div>
        
        <div className="action-buttons">
          <button 
            onClick={handleDisguise}
            disabled={!inputText.trim() || isLoading}
            className="primary-button"
          >
            {isLoading ? '转换中...' : '开始伪装'}
          </button>
          
          <button 
            onClick={handleClear}
            disabled={isLoading}
            className="secondary-button"
          >
            清空
          </button>
          
          {canRegenerate && (
            <button 
              onClick={handleRegenerate}
              disabled={isLoading}
              className="secondary-button"
            >
              重新生成
            </button>
          )}
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

      {/* 输出区域 */}
      {hasOutput && (
        <div className="output-section">
          <h3>转换结果:</h3>
          
          <div className="result-container">
            <div className="text-content">
              {output}
            </div>
            <button 
              onClick={() => handleCopy(output, '转换结果')}
              className="copy-button"
            >
              复制结果
            </button>
          </div>
        </div>
      )}

      {/* 加载指示器 */}
      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>AI 正在为你转换文本，请稍候...</p>
        </div>
      )}
    </div>
  )
}

export default Home