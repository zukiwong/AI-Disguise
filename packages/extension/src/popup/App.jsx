import { useState, useEffect } from 'react'
import searchIcon from '../assets/images/search-icon.svg'
import logo from '../assets/images/logo.svg'
import CustomSelect from './CustomSelect.jsx'
import { syncUserData } from '../services/userDataService.js'

// 默认公共风格（系统内置）
const DEFAULT_STYLES = [
  {
    id: 'chat',
    displayName: 'Chat',
    description: 'Casual and friendly conversational tone',
    promptTemplate: 'Transform the following text into a casual, friendly chat style'
  },
  {
    id: 'poem',
    displayName: 'Poem',
    description: 'Poetic and artistic expression',
    promptTemplate: 'Transform the following text into poetic style'
  },
  {
    id: 'social',
    displayName: 'Social',
    description: 'Perfect for social media posts',
    promptTemplate: 'Transform the following text into social media style'
  },
  {
    id: 'story',
    displayName: 'Story',
    description: 'Narrative storytelling approach',
    promptTemplate: 'Transform the following text into story style'
  }
]

function App() {
  // 页面状态：'main' 或 'search'
  const [currentPage, setCurrentPage] = useState('main')

  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [styles, setStyles] = useState(DEFAULT_STYLES) // 所有可用风格（默认 + 用户自定义 + 社区添加）
  const [selectedStyle, setSelectedStyle] = useState('chat') // 默认选中 chat
  const [error, setError] = useState('')
  const [usageInfo, setUsageInfo] = useState({ remaining: 20 })
  const [user, setUser] = useState(null) // 用户登录状态
  const [copied, setCopied] = useState(false) // 复制状态
  const [apiConfig, setApiConfig] = useState(null) // API 配置状态

  // 加载所有风格（用户自定义 + 社区添加的）
  const loadAllStyles = () => {
    console.log('📋 Popup: 开始加载所有风格...')
    chrome.storage.local.get(['userStyles', 'additionalStyles'], (result) => {
      const userStyles = result.userStyles || [] // 用户在网站创建的风格
      const additionalStyles = result.additionalStyles || [] // 从社区搜索添加的风格

      // 合并所有风格：默认 + 用户自定义 + 社区添加
      const allStyles = [...DEFAULT_STYLES, ...userStyles, ...additionalStyles]
      setStyles(allStyles)
      console.log('✅ Popup: 已加载风格:', {
        default: DEFAULT_STYLES.length,
        user: userStyles.length,
        additional: additionalStyles.length,
        total: allStyles.length
      })
      console.log('📝 Popup: 用户风格详情:', userStyles)
    })
  }

  // 从 Firestore 同步用户数据
  const syncUserDataFromFirestore = async (userData) => {
    try {
      console.log('🔄 Popup: 开始同步用户数据...')
      const result = await syncUserData(userData)

      if (result.success) {
        console.log('✅ Popup: 用户数据同步成功，重新加载风格')
        // 重新加载所有风格
        loadAllStyles()
      } else {
        console.warn('⚠️ Popup: 用户数据同步失败:', result.error)
      }
    } catch (error) {
      console.error('❌ Popup: 同步用户数据失败:', error)
    }
  }

  // 加载 API 配置
  const loadApiConfig = () => {
    chrome.storage.local.get(['apiConfig'], (result) => {
      if (result.apiConfig) {
        setApiConfig(result.apiConfig)
        console.log('📡 Popup: 已加载 API 配置:', result.apiConfig.provider || 'free')
      } else {
        setApiConfig(null)
      }
    })
  }

  // 加载用户信息和所有风格
  useEffect(() => {
    loadUserInfo()
    loadAllStyles()
    loadApiConfig()

    // 监听 Chrome Storage 变化（当 background worker 保存用户数据时）
    const storageListener = (changes, areaName) => {
      if (areaName === 'local') {
        // 监听用户登录状态变化
        if (changes.user) {
          console.log('检测到用户数据变化:', changes.user.newValue)
          if (changes.user.newValue) {
            setUser(changes.user.newValue)
            // 同步用户数据
            syncUserDataFromFirestore(changes.user.newValue)
          } else {
            setUser(null)
          }
        }

        // 监听 userStyles 或 additionalStyles 变化
        if (changes.userStyles || changes.additionalStyles) {
          console.log('检测到风格变化，重新加载')
          loadAllStyles() // 重新加载所有风格
        }

        // 监听 apiConfig 变化
        if (changes.apiConfig) {
          console.log('检测到 API 配置变化，重新加载')
          loadApiConfig()
        }
      }
    }

    chrome.storage.onChanged.addListener(storageListener)

    return () => {
      chrome.storage.onChanged.removeListener(storageListener)
    }
  }, [])

  const loadUserInfo = async () => {
    chrome.storage.local.get(['user'], async (result) => {
      if (result.user) {
        setUser(result.user)
        // 登录后同步用户数据
        await syncUserDataFromFirestore(result.user)
      }
    })
  }

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

      // 获取 API 配置（优先使用用户的配置）
      const storageData = await new Promise((resolve) => {
        chrome.storage.local.get(['apiConfig'], resolve)
      })

      const userApiConfig = storageData.apiConfig || {}
      const hasCustomKey = userApiConfig.hasCustomKey || false

      // 如果用户有自定义 API Key，跳过免费额度检查
      if (hasCustomKey) {
        console.log('使用用户自定义 API Key:', userApiConfig.provider)
      }

      // 获取选中的风格配置
      const currentStyle = styles.find(s => s.id === selectedStyle)
      if (!currentStyle) {
        throw new Error('Please select a style')
      }

      // 构建传递给后端的 apiConfig
      // 后端期望的格式：{ mode: 'custom', activeProvider: 'gemini', customApis: { gemini: { apiKey: 'xxx' } } }
      let apiConfigForBackend = null
      if (hasCustomKey && userApiConfig.provider && userApiConfig.apiKey) {
        apiConfigForBackend = {
          mode: 'custom',
          activeProvider: userApiConfig.provider,
          customApis: {
            [userApiConfig.provider]: {
              apiKey: userApiConfig.apiKey
            }
          }
        }
      }

      // 调用 API
      console.log('Sending request with API config:', hasCustomKey ? `custom (${userApiConfig.provider})` : 'free')
      const response = await fetch('https://ai-disguise.vercel.app/api/disguise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: inputText,
          mode: 'custom_style',
          styleConfig: {
            id: currentStyle.id,
            name: currentStyle.displayName,
            displayName: currentStyle.displayName,
            description: currentStyle.description,
            promptTemplate: currentStyle.promptTemplate
          },
          outputLanguage: 'auto',
          apiConfig: apiConfigForBackend
        })
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error:', errorText)
        throw new Error(`API request failed (${response.status}): ${errorText}`)
      }

      const data = await response.json()
      console.log('API 返回数据:', data)

      // 检查 API 返回的错误
      if (data.error) {
        throw new Error(data.error)
      }

      const transformedText = data.result || data.transformedText
      console.log('transformedText:', transformedText)
      setOutputText(transformedText)
      console.log('outputText 已设置')

      // 增加使用次数（仅免费模式，使用自定义 Key 不计数）
      if (!hasCustomKey) {
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

  const openLogin = () => {
    // 简单打开登录页面，Service Worker 会自动检测并处理登录流程
    const loginUrl = 'https://ai-disguise.vercel.app/auth?from=extension'
    chrome.tabs.create({ url: loginUrl })
  }

  const openProfile = () => {
    chrome.tabs.create({ url: 'https://ai-disguise.vercel.app/profile' })
  }

  const openSearch = () => {
    setCurrentPage('search')
  }

  const backToMain = () => {
    setCurrentPage('main')
    loadAllStyles() // 重新加载风格列表
  }

  // 添加风格到本地（从社区搜索添加）
  const handleAddStyle = (style) => {
    // 先从 storage 读取当前的 additionalStyles
    chrome.storage.local.get(['additionalStyles'], (result) => {
      const currentAdditional = result.additionalStyles || []

      const isAdded = currentAdditional.some(s => s.id === style.id)
      if (isAdded) {
        alert('This style is already added!')
        return
      }

      const newAdditionalStyles = [...currentAdditional, {
        id: style.id,
        displayName: style.displayName,
        description: style.description,
        promptTemplate: style.promptTemplate
      }]

      chrome.storage.local.set({ additionalStyles: newAdditionalStyles }, () => {
        // storage 变化会自动触发 loadAllStyles()
        console.log('已添加新风格:', style.displayName)
      })
    })
  }

  // 处理复制功能
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputText)
      setCopied(true)
      // 2秒后恢复按钮文本
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  return (
    <div className="popup-container">
      {currentPage === 'main' ? (
        // 主页面
        <>
          {/* 头部 */}
          <div className="popup-header">
            <div className="header-left">
              {user ? (
                <button className="sign-in-btn" onClick={openProfile} title="Open Profile">
                  {user.displayName || user.email || 'User'}
                </button>
              ) : (
                <button className="sign-in-btn" onClick={openLogin}>
                  Sign in
                </button>
              )}
            </div>
            <div className="header-buttons">
              <button className="search-btn" onClick={openSearch} title="Search Styles">
                <img src={searchIcon} alt="Search" />
              </button>
            </div>
          </div>

          {/* 风格选择 */}
          <div className="style-selector">
            <label>Style</label>
            <CustomSelect
              options={styles.map(style => ({
                value: style.id,
                label: `${style.displayName} Style`
              }))}
              value={selectedStyle}
              onChange={setSelectedStyle}
              disabled={isLoading}
            />
          </div>

          {/* 输入区域 */}
          <div className="input-section">
            <label>What are you trying to say?</label>
            <textarea
              value={inputText}
              onChange={(e) => {
                const text = e.target.value
                if (text.length <= 300) {
                  setInputText(text)
                }
              }}
              placeholder="Describe your situation or what's on your mind.."
              rows="4"
              maxLength={300}
            />
            <div className="character-count">
              {inputText.length}/300
            </div>
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
                onClick={handleCopy}
              >
                {copied ? 'Copied successfully' : 'Copy'}
              </button>
            </div>
          )}

          {/* 底部提示 */}
          <div className="popup-footer">
            <small>
              {apiConfig && apiConfig.hasCustomKey ? (
                <>
                  Using: {apiConfig.provider.charAt(0).toUpperCase() + apiConfig.provider.slice(1)} API (Unlimited) | <a href="#" onClick={(e) => { e.preventDefault(); openProfile(); }}>Manage</a>
                </>
              ) : (
                <>
                  Free: {usageInfo.remaining}/20 remaining | <a href="#" onClick={(e) => { e.preventDefault(); openProfile(); }}>Get unlimited</a>
                </>
              )}
            </small>
          </div>

          {/* Logo */}
          <div className="popup-logo">
            <img src={logo} alt="AIDisguise" />
          </div>
        </>
      ) : (
        // 搜索页面
        <SearchPage
          onBack={backToMain}
          onAddStyle={handleAddStyle}
        />
      )}
    </div>
  )
}

// 搜索页面组件
function SearchPage({ onBack, onAddStyle }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [publicStyles, setPublicStyles] = useState([])
  const [additionalStyles, setAdditionalStyles] = useState([])

  useEffect(() => {
    loadPublicStyles()
    loadAdditionalStyles()
  }, [])

  const loadPublicStyles = async () => {
    try {
      const response = await fetch('https://ai-disguise.vercel.app/api/styles/public')
      if (response.ok) {
        const data = await response.json()
        setPublicStyles(data.styles || [])
      }
    } catch (error) {
      console.error('加载社区风格失败:', error)
    }
  }

  const loadAdditionalStyles = () => {
    chrome.storage.local.get(['additionalStyles'], (result) => {
      setAdditionalStyles(result.additionalStyles || [])
    })
  }

  const filteredStyles = publicStyles.filter(style =>
    !searchTerm ||
    style.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (style.description && style.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="search-page">
      {/* 搜索页头部 */}
      <div className="search-header">
        <button className="back-btn" onClick={onBack}>
          Back
        </button>
        <div className="header-right"></div>
      </div>

      {/* 搜索区域（标题 + 搜索框） */}
      <div className="search-section">
        <h2>Search Styles</h2>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search styles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      {/* 风格列表 */}
      <div className="search-results">
        {filteredStyles.length === 0 ? (
          <div className="empty-message">No styles found</div>
        ) : (
          filteredStyles.map(style => {
            const isAdded = additionalStyles.some(s => s.id === style.id)
            return (
              <div key={style.id} className="search-item">
                <div className="search-item-info">
                  <strong>{style.displayName}</strong>
                  <p>{style.description}</p>
                </div>
                <button
                  className={`search-add-btn ${isAdded ? 'added' : ''}`}
                  onClick={() => {
                    onAddStyle(style)
                    // 添加后重新加载列表以更新按钮状态
                    setTimeout(loadAdditionalStyles, 100)
                  }}
                  disabled={isAdded}
                >
                  {isAdded ? '✓' : '+'}
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default App
