import { useState, useEffect } from 'react'

function App() {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState('chat')
  const [error, setError] = useState('')
  const [usageInfo, setUsageInfo] = useState({ remaining: 20 })

  // 加载使用信息
  useEffect(() => {
    chrome.runtime.sendMessage({ action: 'checkUsageLimit' }, (response) => {
      if (response) {
        setUsageInfo({ remaining: response.remaining })
      }
    })
  }, [])

  const handleTransform = async () => {
    if (!inputText.trim()) return

    setIsLoading(true)
    setError('')

    try {
      // 检查使用次数限制
      const limitCheck = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'checkUsageLimit' },
          resolve
        )
      })

      if (!limitCheck.allowed) {
        setError('Daily limit reached (20/20). Use custom API key for unlimited access.')
        setIsLoading(false)
        return
      }

      // 获取 API 配置
      const config = await new Promise((resolve) => {
        chrome.storage.local.get(['apiMode', 'apiKey'], resolve)
      })

      // 调用 API
      console.log('Sending request with config:', config)
      const response = await fetch('https://ai-disguise.vercel.app/api/disguise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: inputText,
          mode: 'style',
          style: selectedStyle,
          outputLanguage: 'auto',
          apiConfig: config.apiMode === 'custom' ? {
            useCustomKey: true,
            customApiKey: config.apiKey
          } : null
        })
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error:', errorText)
        throw new Error(`API request failed (${response.status}): ${errorText}`)
      }

      const data = await response.json()

      // 检查 API 返回的错误
      if (data.error) {
        throw new Error(data.error)
      }

      setOutputText(data.transformedText)

      // 增加使用次数（仅免费模式）
      if (config.apiMode !== 'custom') {
        chrome.runtime.sendMessage({ action: 'incrementUsage' }, (response) => {
          if (response && response.success) {
            setUsageInfo({ remaining: 20 - response.count })
          }
        })
      }

    } catch (error) {
      console.error('转换失败:', error)
      setError(`Error: ${error.message || 'Failed to transform text. Please try again.'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const openWebsite = () => {
    chrome.tabs.create({ url: 'https://ai-disguise.vercel.app' })
  }

  return (
    <div className="popup-container">
      {/* 头部 */}
      <div className="popup-header">
        <h1>AI Disguise</h1>
        <button className="website-btn" onClick={openWebsite} title="Open Website">
          🌐
        </button>
      </div>

      {/* 风格选择 */}
      <div className="style-selector">
        <label>Style:</label>
        <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)}>
          <option value="chat">Chat</option>
          <option value="poem">Poem</option>
          <option value="social">Social</option>
          <option value="story">Story</option>
        </select>
      </div>

      {/* 输入区域 */}
      <div className="input-section">
        <label>Original Text:</label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter your text here..."
          rows="4"
        />
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* 转换按钮 */}
      <button
        className="transform-btn"
        onClick={handleTransform}
        disabled={isLoading || !inputText.trim()}
      >
        {isLoading ? 'Transforming...' : 'Transform'}
      </button>

      {/* 输出区域 */}
      {outputText && (
        <div className="output-section">
          <label>Transformed:</label>
          <div className="output-text">{outputText}</div>
          <button
            className="copy-btn"
            onClick={() => navigator.clipboard.writeText(outputText)}
          >
            Copy
          </button>
        </div>
      )}

      {/* 底部提示 */}
      <div className="popup-footer">
        <small>
          Free: {usageInfo.remaining}/20 remaining |
          <a href="#" onClick={openWebsite}> Get unlimited</a>
        </small>
      </div>
    </div>
  )
}

export default App
