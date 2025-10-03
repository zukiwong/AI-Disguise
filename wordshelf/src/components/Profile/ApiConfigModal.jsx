// API Key 配置 Modal 组件
// 用于配置用户自定义 API Key

import { useState } from 'react'
import { AI_PROVIDERS, saveCustomApiKey, testApiKey } from '../../services/apiConfigService.js'
import { useAuth } from '../../hooks/useAuth.js'

function ApiConfigModal({ isOpen, onClose, onSuccess }) {
  const { userId } = useAuth()

  // 状态管理
  const [selectedProvider, setSelectedProvider] = useState('gemini')
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState(AI_PROVIDERS.gemini.defaultModel)
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [error, setError] = useState('')

  // 处理提供商切换
  const handleProviderChange = (providerId) => {
    setSelectedProvider(providerId)
    setSelectedModel(AI_PROVIDERS[providerId].defaultModel)
    setApiKey('')
    setTestResult(null)
    setError('')
  }

  // 测试 API Key
  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key')
      return
    }

    setIsTesting(true)
    setError('')
    setTestResult(null)

    try {
      const result = await testApiKey(selectedProvider, apiKey, selectedModel)
      setTestResult(result)

      if (!result.success) {
        setError(result.message)
      }
    } catch (err) {
      setError('Failed to test API key. Please try again.')
    } finally {
      setIsTesting(false)
    }
  }

  // 保存配置
  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key')
      return
    }

    // 建议先测试，但不强制
    if (!testResult || !testResult.success) {
      const confirmSave = window.confirm(
        'You have not tested this API key or the test failed. Are you sure you want to save it?'
      )
      if (!confirmSave) return
    }

    setIsSaving(true)
    setError('')

    try {
      await saveCustomApiKey(userId, selectedProvider, apiKey, selectedModel)

      // 调用成功回调
      if (onSuccess) {
        onSuccess()
      }

      // 关闭 Modal
      onClose()
    } catch (err) {
      setError('Failed to save API key. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // 关闭 Modal
  const handleClose = () => {
    setApiKey('')
    setTestResult(null)
    setError('')
    onClose()
  }

  if (!isOpen) return null

  const currentProvider = AI_PROVIDERS[selectedProvider]

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content api-config-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal 头部 */}
        <div className="modal-header">
          <h2 className="modal-title">Configure API Key</h2>
          <button className="modal-close" onClick={handleClose}>
            ×
          </button>
        </div>

        {/* Modal 主体 */}
        <div className="modal-body">
          {/* 友好提示 */}
          <div className="api-config-tip">
            <strong>Tip:</strong> We recommend creating API keys with spending limits for better security.
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="api-config-error">
              {error}
            </div>
          )}

          {/* 选择 AI 提供商 */}
          <div className="form-group">
            <label className="form-label">Select AI Provider</label>
            <div className="provider-grid">
              {Object.values(AI_PROVIDERS).map((provider) => (
                <button
                  key={provider.id}
                  className={`provider-card ${selectedProvider === provider.id ? 'active' : ''}`}
                  onClick={() => handleProviderChange(provider.id)}
                  type="button"
                >
                  <div className="provider-name">{provider.name}</div>
                  <div className="provider-description">{provider.description}</div>
                  <div className="provider-quota">Free quota: {provider.freeQuota}</div>
                </button>
              ))}
            </div>
          </div>

          {/* API Key 输入 */}
          <div className="form-group">
            <label className="form-label" htmlFor="apiKey">
              API Key
            </label>
            <input
              type="password"
              id="apiKey"
              className="form-input"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Enter your ${currentProvider.name} API key`}
            />
            <p className="form-help">
              Don't have an API key?{' '}
              <a
                href={currentProvider.getApiKeyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="api-key-link"
              >
                Get one here
              </a>
            </p>
          </div>

          {/* 模型选择 */}
          <div className="form-group">
            <label className="form-label" htmlFor="model">
              Model
            </label>
            <select
              id="model"
              className="form-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {currentProvider.models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          {/* 测试结果 */}
          {testResult && (
            <div className={`api-test-result ${testResult.success ? 'success' : 'error'}`}>
              {testResult.message}
            </div>
          )}

          {/* 安全提示 */}
          <div className="api-security-note">
            <p>
              Your API key is encrypted and stored securely in your account.
              It is only used for your requests and never shared with others.
            </p>
          </div>
        </div>

        {/* Modal 底部 */}
        <div className="modal-footer">
          <button
            className="modal-button secondary"
            onClick={handleClose}
            disabled={isSaving || isTesting}
          >
            Cancel
          </button>
          <button
            className="modal-button test"
            onClick={handleTestKey}
            disabled={isTesting || isSaving || !apiKey.trim()}
          >
            {isTesting ? 'Testing...' : 'Test API Key'}
          </button>
          <button
            className="modal-button primary"
            onClick={handleSave}
            disabled={isSaving || isTesting || !apiKey.trim()}
          >
            {isSaving ? 'Saving...' : 'Save & Activate'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ApiConfigModal
