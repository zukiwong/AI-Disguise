import { useState } from 'react'

function Home() {
  // Basic states | 基本状态
  const [inputText, setInputText] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('chat')
  const [output, setOutput] = useState('')

  // Simple style options | 简单的风格选项
  const styles = [
    'chat',
    'poem', 
    'social',
    'story'
  ]

  // Basic disguise function | 基本伪装函数
  const handleDisguise = () => {
    if (!inputText.trim()) {
      alert('Please enter text')
      return
    }
    // Simple mock transformation | 简单的模拟转换
    setOutput(`[${selectedStyle}] ${inputText} (transformed)`)
  }

  return (
    <div>
      <h1>AI Disguiser</h1>
      <p>Transform your text into different styles</p>
      
      <div>
        <h3>Input Text:</h3>
        <textarea 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter your text here..."
        />
      </div>

      <div>
        <h3>Select Style:</h3>
        <select 
          value={selectedStyle}
          onChange={(e) => setSelectedStyle(e.target.value)}
        >
          {styles.map(style => (
            <option key={style} value={style}>{style}</option>
          ))}
        </select>
        <button onClick={handleDisguise}>
          Disguise
        </button>
      </div>

      {output && (
        <div>
          <h3>Result:</h3>
          <div>{output}</div>
        </div>
      )}
    </div>
  )
}

export default Home