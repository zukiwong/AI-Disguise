import { useState, useEffect } from 'react'

function App() {
  const [apiMode, setApiMode] = useState('free')
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // 加载设置
    chrome.storage.local.get(['apiMode', 'apiKey'], (result) => {
      if (result.apiMode) setApiMode(result.apiMode)
      if (result.apiKey) setApiKey(result.apiKey)
    })
  }, [])

  const handleSave = () => {
    chrome.storage.local.set({
      apiMode,
      apiKey
    }, () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const openWebsite = () => {
    chrome.tabs.create({ url: 'https://ai-disguise.vercel.app' })
  }

  return (
    <div className="options-container">
      <header className="options-header">
        <h1>AI Disguise Settings</h1>
        <button className="website-btn" onClick={openWebsite}>
          Open Website
        </button>
      </header>

      <div className="options-content">
        <section className="option-section">
          <h2>API Configuration</h2>

          <div className="radio-group">
            <label className="radio-option">
              <input
                type="radio"
                value="free"
                checked={apiMode === 'free'}
                onChange={(e) => setApiMode(e.target.value)}
              />
              <div>
                <strong>Free Mode</strong>
                <p>20 transformations per day</p>
              </div>
            </label>

            <label className="radio-option">
              <input
                type="radio"
                value="custom"
                checked={apiMode === 'custom'}
                onChange={(e) => setApiMode(e.target.value)}
              />
              <div>
                <strong>Custom API Key</strong>
                <p>Unlimited transformations with your own key</p>
              </div>
            </label>
          </div>

          {apiMode === 'custom' && (
            <div className="api-key-input">
              <label>API Key:</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
              />
              <p className="hint">
                Get your API key from <a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer">Google AI Studio</a>
              </p>
            </div>
          )}

          <button className="save-btn" onClick={handleSave}>
            {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </section>

        <section className="option-section">
          <h2>About</h2>
          <p>AI Disguise Extension v1.0.0</p>
          <p>Transform your text with AI-powered style adjustments</p>
          <button className="secondary-btn" onClick={openWebsite}>
            Visit Website
          </button>
        </section>
      </div>
    </div>
  )
}

export default App
