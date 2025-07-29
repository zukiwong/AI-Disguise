// 风格编辑器组件
// 用于创建和编辑自定义风格

import { useState, useEffect } from 'react'
import '../../styles/StyleEditor.css'

function StyleEditor({ 
  style = null, 
  onSave, 
  onCancel, 
  isLoading = false 
}) {
  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    promptTemplate: '',
    isPublic: false
  })
  
  // 验证状态
  const [errors, setErrors] = useState({})
  const [isValid, setIsValid] = useState(false)

  // 初始化表单数据
  useEffect(() => {
    if (style) {
      setFormData({
        name: style.name || '',
        displayName: style.displayName || '',
        description: style.description || '',
        promptTemplate: style.promptTemplate || '',
        isPublic: style.isPublic || false
      })
    }
  }, [style])

  // 表单验证
  useEffect(() => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Style name is required'
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.name)) {
      newErrors.name = 'Style name can only contain letters, numbers, hyphens and underscores'
    }
    
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    setErrors(newErrors)
    setIsValid(Object.keys(newErrors).length === 0)
  }, [formData])

  // 处理输入变化
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 处理保存
  const handleSave = async () => {
    if (!isValid || isLoading) return
    
    try {
      await onSave(formData)
    } catch (error) {
      console.error('保存风格失败:', error)
    }
  }

  // 处理取消
  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
  }

  const isEditMode = Boolean(style)

  return (
    <div className="style-editor">
      <div className="editor-header">
        <h3 className="editor-title">
          {isEditMode ? 'Edit Style' : 'Create New Style'}
        </h3>
      </div>

      {/* 风格名称 */}
      <div className="form-group">
        <label className="form-label" htmlFor="style-name">
          Style Name *
        </label>
        <input
          id="style-name"
          type="text"
          className="form-input"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="e.g., academic, casual, formal"
          disabled={isLoading}
        />
        {errors.name && (
          <div className="error-message">{errors.name}</div>
        )}
      </div>

      {/* 显示名称 */}
      <div className="form-group">
        <label className="form-label" htmlFor="display-name">
          Display Name *
        </label>
        <input
          id="display-name"
          type="text"
          className="form-input"
          value={formData.displayName}
          onChange={(e) => handleInputChange('displayName', e.target.value)}
          placeholder="e.g., Academic Style, Casual Chat"
          disabled={isLoading}
        />
        {errors.displayName && (
          <div className="error-message">{errors.displayName}</div>
        )}
      </div>

      {/* 描述 */}
      <div className="form-group">
        <label className="form-label" htmlFor="description">
          Description *
        </label>
        <textarea
          id="description"
          className="form-textarea"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe when and how this style should be used..."
          disabled={isLoading}
        />
        {errors.description && (
          <div className="error-message">{errors.description}</div>
        )}
      </div>

      {/* 提示模板 */}
      <div className="form-group">
        <label className="form-label" htmlFor="prompt-template">
          Prompt Template (Optional)
        </label>
        <textarea
          id="prompt-template"
          className="form-textarea"
          value={formData.promptTemplate}
          onChange={(e) => handleInputChange('promptTemplate', e.target.value)}
          placeholder="Custom prompt template for this style (leave empty to use default)..."
          disabled={isLoading}
        />
        <small style={{ color: '#666', fontSize: '12px' }}>
          Advanced users can define custom prompt templates. Leave empty to use the default template.
        </small>
      </div>

      {/* 公开设置 */}
      <div className="form-group">
        <div className="form-checkbox-group">
          <input
            id="is-public"
            type="checkbox"
            className="form-checkbox"
            checked={formData.isPublic}
            onChange={(e) => handleInputChange('isPublic', e.target.checked)}
            disabled={isLoading}
          />
          <label className="form-label" htmlFor="is-public">
            Make this style public
          </label>
        </div>
        <small style={{ color: '#666', fontSize: '12px' }}>
          Public styles can be used by other users. Private styles are only visible to you.
        </small>
      </div>

      {/* 操作按钮 */}
      <div className="editor-actions">
        <button
          className="editor-button secondary"
          onClick={handleCancel}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          className="editor-button"
          onClick={handleSave}
          disabled={!isValid || isLoading}
        >
          {isLoading ? 'Saving...' : (isEditMode ? 'Update Style' : 'Create Style')}
        </button>
      </div>
    </div>
  )
}

export default StyleEditor