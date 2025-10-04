// Profile设置组件
// 管理用户偏好设置和账户设置

import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import {
  getUserHistoryPreferences,
  updateHistoryPreferences
} from '../../services/historyService.js'
import { updateUserProfile } from '../../services/authService.js'
import {
  getUserApiConfig,
  switchApiMode,
  deleteCustomApiKey,
  AI_PROVIDERS
} from '../../services/apiConfigService.js'
import ApiConfigModal from './ApiConfigModal.jsx'

function ProfileSettings() {
  const { userId, userName, userEmail } = useAuth()
  
  // 状态管理
  const [preferences, setPreferences] = useState({
    defaultView: 'list',
    itemsPerPage: 20,
    autoSaveTags: true,
    showTimestamp: true
  })
  
  const [profileSettings, setProfileSettings] = useState({
    displayName: userName || '',
    emailNotifications: true,
    shareByDefault: false,
    theme: 'light'
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // API 配置状态
  const [apiConfig, setApiConfig] = useState(null)
  const [isApiModalOpen, setIsApiModalOpen] = useState(false)
  const [isApiExpanded, setIsApiExpanded] = useState(false)

  // 加载用户设置
  useEffect(() => {
    const loadSettings = async () => {
      if (!userId) return

      setIsLoading(true)
      try {
        // 加载历史记录偏好
        const historyPrefs = await getUserHistoryPreferences(userId)
        setPreferences(historyPrefs)

        // 设置profile信息
        setProfileSettings(prev => ({
          ...prev,
          displayName: userName || userEmail.split('@')[0]
        }))

        // 加载 API 配置
        const apiConf = await getUserApiConfig(userId)
        setApiConfig(apiConf)

      } catch (error) {
        console.error('加载设置失败:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [userId, userName, userEmail])

  // 保存历史记录偏好
  const saveHistoryPreferences = async () => {
    if (!userId) return
    
    setIsSaving(true)
    try {
      await updateHistoryPreferences(userId, preferences)
      setSaveMessage('History preferences saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('保存历史偏好失败:', error)
      setSaveMessage('Failed to save preferences.')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  // 保存profile设置
  const saveProfileSettings = async () => {
    if (!userId) return
    
    setIsSaving(true)
    try {
      await updateUserProfile(userId, {
        displayName: profileSettings.displayName
      })
      setSaveMessage('Profile settings saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('保存profile设置失败:', error)
      setSaveMessage('Failed to save profile settings.')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  // 处理偏好设置变化
  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // 处理profile设置变化
  const handleProfileChange = (key, value) => {
    setProfileSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // 处理 API 模式切换
  const handleApiModeSwitch = async (mode) => {
    if (!userId) return

    setIsSaving(true)
    try {
      await switchApiMode(userId, mode, apiConfig?.activeProvider)

      // 重新加载配置
      const updatedConfig = await getUserApiConfig(userId)
      setApiConfig(updatedConfig)

      setSaveMessage('API mode updated successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('切换 API 模式失败:', error)
      setSaveMessage('Failed to update API mode.')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  // 处理删除 API Key
  const handleDeleteApiKey = async (provider) => {
    if (!userId) return

    const confirmDelete = window.confirm(
      `Are you sure you want to delete your ${AI_PROVIDERS[provider].name} API key? You will switch back to free mode.`
    )

    if (!confirmDelete) return

    setIsSaving(true)
    try {
      await deleteCustomApiKey(userId, provider)

      // 重新加载配置
      const updatedConfig = await getUserApiConfig(userId)
      setApiConfig(updatedConfig)

      setSaveMessage('API key deleted successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('删除 API Key 失败:', error)
      setSaveMessage('Failed to delete API key.')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  // 处理配置成功
  const handleApiConfigSuccess = async () => {
    // 重新加载配置
    const updatedConfig = await getUserApiConfig(userId)
    setApiConfig(updatedConfig)

    setSaveMessage('API key configured successfully!')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  if (isLoading) {
    return (
      <div className="profile-settings-loading">
        <div className="loading-spinner"></div>
        <p>Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="profile-settings">
      {/* 保存状态消息 */}
      {saveMessage && (
        <div className={`save-message ${saveMessage.includes('success') ? 'success' : 'error'}`}>
          {saveMessage}
        </div>
      )}

      {/* 个人资料设置 */}
      <div className="settings-section">
        <h3 className="settings-section-title">Personal Information</h3>
        <div className="settings-form">
          <div className="form-group">
            <label className="form-label" htmlFor="displayName">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              className="form-input"
              value={profileSettings.displayName}
              onChange={(e) => handleProfileChange('displayName', e.target.value)}
              placeholder="Enter your display name"
            />
            <p className="form-help">This name will be shown in the community and on shared content.</p>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={userEmail}
              disabled
            />
            <p className="form-help">Email cannot be changed and is managed by your authentication provider.</p>
          </div>

          <button
            className="save-button"
            onClick={saveProfileSettings}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* 历史记录偏好设置 */}
      <div className="settings-section">
        <h3 className="settings-section-title">History Preferences</h3>
        <div className="settings-form">
          <div className="form-group">
            <label className="form-label" htmlFor="defaultView">
              Default View Mode
            </label>
            <select
              id="defaultView"
              className="form-select"
              value={preferences.defaultView}
              onChange={(e) => handlePreferenceChange('defaultView', e.target.value)}
            >
              <option value="list">List View</option>
              <option value="card">Card View</option>
            </select>
            <p className="form-help">Choose how you want to view your history records by default.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="itemsPerPage">
              Items Per Page
            </label>
            <select
              id="itemsPerPage"
              className="form-select"
              value={preferences.itemsPerPage}
              onChange={(e) => handlePreferenceChange('itemsPerPage', parseInt(e.target.value))}
            >
              <option value={10}>10 items</option>
              <option value={20}>20 items</option>
              <option value={50}>50 items</option>
            </select>
            <p className="form-help">Number of history records to display per page.</p>
          </div>

          <div className="form-group">
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={preferences.autoSaveTags}
                  onChange={(e) => handlePreferenceChange('autoSaveTags', e.target.checked)}
                />
                <span className="checkbox-text">Auto-save new tags to library</span>
              </label>
              <p className="form-help">Automatically add new tags you create to your tag library.</p>
            </div>
          </div>

          <div className="form-group">
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={preferences.showTimestamp}
                  onChange={(e) => handlePreferenceChange('showTimestamp', e.target.checked)}
                />
                <span className="checkbox-text">Show detailed timestamps</span>
              </label>
              <p className="form-help">Display full date and time for history records.</p>
            </div>
          </div>

          <button
            className="save-button"
            onClick={saveHistoryPreferences}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* 隐私和分享设置 */}
      <div className="settings-section">
        <h3 className="settings-section-title">Privacy & Sharing</h3>
        <div className="settings-form">
          <div className="form-group">
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={profileSettings.shareByDefault}
                  onChange={(e) => handleProfileChange('shareByDefault', e.target.checked)}
                />
                <span className="checkbox-text">Share content publicly by default</span>
              </label>
              <p className="form-help">When enabled, shared content will be public by default.</p>
            </div>
          </div>

          <div className="form-group">
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={profileSettings.emailNotifications}
                  onChange={(e) => handleProfileChange('emailNotifications', e.target.checked)}
                />
                <span className="checkbox-text">Email notifications</span>
              </label>
              <p className="form-help">Receive email updates about new features and community activity.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 界面设置 */}
      <div className="settings-section">
        <h3 className="settings-section-title">Interface</h3>
        <div className="settings-form">
          <div className="form-group">
            <label className="form-label" htmlFor="theme">
              Theme
            </label>
            <select
              id="theme"
              className="form-select"
              value={profileSettings.theme}
              onChange={(e) => handleProfileChange('theme', e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto (System)</option>
            </select>
            <p className="form-help">Choose your preferred color theme. (Coming soon)</p>
          </div>
        </div>
      </div>

      {/* API 配置 (可选) */}
      <div className="settings-section api-config-section">
        <div className="api-config-header" onClick={() => setIsApiExpanded(!isApiExpanded)}>
          <h3 className="settings-section-title">API Configuration (Optional)</h3>
          <button className="expand-button" type="button">
            {isApiExpanded ? '−' : '+'}
          </button>
        </div>

        {apiConfig && apiConfig.mode === 'free' && (
          <p className="api-usage-hint">
            Using free mode: {apiConfig.freeUsage.count}/{apiConfig.freeUsage.dailyLimit} conversions today
          </p>
        )}

        {isApiExpanded && (
          <div className="api-config-content">
            <div className="api-mode-selector">
              <label className="form-label">Current Mode</label>
              <div className="mode-options">
                <button
                  className={`mode-option ${apiConfig?.mode === 'free' ? 'active' : ''}`}
                  onClick={() => handleApiModeSwitch('free')}
                  disabled={isSaving}
                  type="button"
                >
                  <div className="mode-name">Free Mode (Default)</div>
                  <div className="mode-desc">
                    {apiConfig?.freeUsage.dailyLimit} conversions per day
                  </div>
                </button>

                {apiConfig?.customApis && Object.keys(apiConfig.customApis).length > 0 && (
                  <button
                    className={`mode-option ${apiConfig?.mode === 'custom' ? 'active' : ''}`}
                    onClick={() => handleApiModeSwitch('custom')}
                    disabled={isSaving}
                    type="button"
                  >
                    <div className="mode-name">
                      Custom API ({AI_PROVIDERS[apiConfig.activeProvider]?.name || 'Unknown'})
                    </div>
                    <div className="mode-desc">Unlimited conversions</div>
                  </button>
                )}
              </div>
            </div>

            {apiConfig?.customApis && Object.keys(apiConfig.customApis).length > 0 && (
              <div className="configured-apis">
                <label className="form-label">Configured API Keys</label>
                {Object.entries(apiConfig.customApis).map(([provider, config]) => (
                  <div key={provider} className="api-key-item">
                    <div className="api-key-info">
                      <div className="api-provider-name">
                        {AI_PROVIDERS[provider]?.name || provider}
                      </div>
                      <div className="api-model-name">
                        Model: {config.model}
                      </div>
                    </div>
                    <button
                      className="delete-api-button"
                      onClick={() => handleDeleteApiKey(provider)}
                      disabled={isSaving}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="api-config-description">
              <p>
                Want unlimited conversions? Configure your own API key for unlimited access.
                We support multiple AI providers including Gemini, OpenAI, Claude, and DeepSeek.
              </p>
            </div>

            <button
              className="save-button"
              onClick={() => setIsApiModalOpen(true)}
              disabled={isSaving}
            >
              Configure API Keys
            </button>
          </div>
        )}
      </div>

      {/* API 配置 Modal */}
      <ApiConfigModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        onSuccess={handleApiConfigSuccess}
      />

      {/* 危险区域 */}
      <div className="settings-section danger-section">
        <h3 className="settings-section-title">Danger Zone</h3>
        <div className="danger-actions">
          <div className="danger-action">
            <div className="danger-action-info">
              <h4>Reset All Preferences</h4>
              <p>Reset all your preferences to default values. This cannot be undone.</p>
            </div>
            <button className="danger-button" onClick={() => {
              if (window.confirm('Are you sure you want to reset all preferences? This cannot be undone.')) {
                setPreferences({
                  defaultView: 'list',
                  itemsPerPage: 20,
                  autoSaveTags: true,
                  showTimestamp: true
                })
                saveHistoryPreferences()
              }
            }}>
              Reset Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileSettings