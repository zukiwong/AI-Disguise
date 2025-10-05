import { useState } from 'react'

function App() {
  const openWebsite = () => {
    chrome.tabs.create({ url: 'https://ai-disguise.vercel.app' })
  }

  const openAPISettings = () => {
    chrome.tabs.create({ url: 'https://ai-disguise.vercel.app/profile' })
  }

  return (
    <div className="options-container">
      <header className="options-header">
        <h1>AI Disguise Extension</h1>
        <button className="website-btn" onClick={openWebsite}>
          Open Website
        </button>
      </header>

      <div className="options-content">
        <section className="option-section">
          <h2>API Configuration</h2>
          <p className="info-text">
            Configure your API settings on the website. After logging in, your settings will be synced automatically to the extension.
          </p>
          <button className="primary-btn" onClick={openAPISettings}>
            Configure API on Website
          </button>

          <div className="divider"></div>

          <h3>How it works</h3>
          <ul className="info-list">
            <li>Free Mode: 20 transformations per day (no login required)</li>
            <li>Custom API: Unlimited with your own key</li>
            <li>Login on website to manage styles and settings</li>
            <li>Use the search button (🔍) in popup to find and add styles</li>
          </ul>
        </section>

        <section className="option-section">
          <h2>About</h2>
          <p className="info-text">AI Disguise Extension v1.0.0</p>
          <p className="info-text">Transform your text with AI-powered style adjustments</p>
          <button className="secondary-btn" onClick={openWebsite}>
            Visit Website for Full Features
          </button>
        </section>
      </div>
    </div>
  )
}

export default App
