import { useState } from 'react'

function App() {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState('chat')

  const handleTransform = async () => {
    if (!inputText.trim()) return

    setIsLoading(true)
    try {
      // TODO: 集成实际的 API 调用
      // 临时模拟
      setTimeout(() => {
        setOutputText(`[${selectedStyle} style] ${inputText}`)
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error('转换失败:', error)
      setIsLoading(false)
    }
  }

  const openWebsite = () => {
    chrome.tabs.create({ url: 'https://ai-disguiser.vercel.app' })
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
        <small>Free: 20 uses/day | <a href="#" onClick={openWebsite}>Get unlimited</a></small>
      </div>
    </div>
  )
}

export default App
