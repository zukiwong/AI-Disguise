// 风格管理器主组件
// 整合风格列表、编辑器和各种操作

import { useState } from 'react'
import { useStyles } from '../../hooks/useStyles.js'
import { useAuth } from '../../hooks/useAuth.js'
import { LoginPrompt } from '../Auth/index.js'
import StyleEditor from './StyleEditor.jsx'
import '../../styles/StyleManager.css'
import '../../styles/Modal.css'

function StyleManager({ onClose, onStylesUpdated }) {
  const { isAuthenticated, userId } = useAuth()
  const {
    styles,
    publicStyles,
    userStyles,
    isLoading,
    error,
    handleCreateStyle,
    handleUpdateStyle,
    handleDeleteStyle,
    getStyleById,
    clearError
  } = useStyles(userId)

  // 组件状态
  const [showEditor, setShowEditor] = useState(false)
  const [editingStyle, setEditingStyle] = useState(null)
  const [activeTab, setActiveTab] = useState('all') // 'all', 'public', 'private'

  // 获取当前显示的风格列表
  const getCurrentStyles = () => {
    switch (activeTab) {
      case 'public':
        return publicStyles
      case 'private':
        return userStyles
      default:
        return styles
    }
  }

  // 创建新风格
  const handleCreateNew = () => {
    setEditingStyle(null)
    setShowEditor(true)
  }

  // 编辑风格
  const handleEditStyle = (styleId) => {
    const style = getStyleById(styleId)
    setEditingStyle(style)
    setShowEditor(true)
  }

  // 保存风格
  const handleSaveStyle = async (styleData) => {
    try {
      if (editingStyle) {
        // 更新现有风格
        await handleUpdateStyle(editingStyle.id, styleData)
      } else {
        // 创建新风格
        await handleCreateStyle(styleData)
      }
      
      setShowEditor(false)
      setEditingStyle(null)
      
      // 通知父组件风格已更新
      if (onStylesUpdated) {
        onStylesUpdated()
      }
    } catch (error) {
      console.error('保存风格失败:', error)
    }
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setShowEditor(false)
    setEditingStyle(null)
  }

  // 删除风格
  const handleDelete = async (styleId) => {
    if (!window.confirm('Are you sure you want to delete this style?')) {
      return
    }
    
    try {
      await handleDeleteStyle(styleId)
      
      // 通知父组件风格已更新
      if (onStylesUpdated) {
        onStylesUpdated()
      }
    } catch (error) {
      console.error('删除风格失败:', error)
    }
  }

  // 可删除的风格判断（只有用户创建的私有风格可以删除）
  const canDelete = (style) => {
    return style.createdBy === userId && !style.isPublic
  }

  // 可编辑的风格判断（只有用户创建的风格可以编辑）
  const canEdit = (style) => {
    return style.createdBy === userId
  }

  const currentStyles = getCurrentStyles()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Manage Styles</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {error && (
            <div className="error-message">
              {error}
              <button onClick={clearError} style={{ marginLeft: '10px' }}>×</button>
            </div>
          )}

          {!showEditor ? (
            <>
              {/* 标签页 */}
              <div className="style-tabs">
                <button 
                  className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All Styles ({styles.length})
                </button>
                <button 
                  className={`tab-button ${activeTab === 'public' ? 'active' : ''}`}
                  onClick={() => setActiveTab('public')}
                >
                  Public ({publicStyles.length})
                </button>
                <button 
                  className={`tab-button ${activeTab === 'private' ? 'active' : ''}`}
                  onClick={() => setActiveTab('private')}
                >
                  My Styles ({userStyles.length})
                </button>
              </div>

              {/* 创建按钮 */}
              <div className="manager-actions" style={{ margin: '20px 0' }}>
                {isAuthenticated ? (
                  <button 
                    className="editor-button"
                    onClick={handleCreateNew}
                    disabled={isLoading}
                  >
                    Create New Style
                  </button>
                ) : (
                  <LoginPrompt 
                    title="Login to Create Styles"
                    message="Sign in to create your own custom styles"
                    buttonText="Sign In to Create"
                  />
                )}
              </div>

              {/* 风格列表 */}
              {isLoading ? (
                <div className="loading-state">Loading styles...</div>
              ) : currentStyles.length === 0 ? (
                <div className="empty-state">
                  <p>No styles found in this category.</p>
                  {activeTab === 'private' && (
                    <p>Create your first custom style!</p>
                  )}
                </div>
              ) : (
                <div className="style-list">
                  {currentStyles.map((style) => (
                    <div key={style.id} className="style-item">
                      <div className="style-info">
                        <div className="style-name">
                          {style.displayName}
                          {style.isPublic && <span className="public-badge"> (Public)</span>}
                        </div>
                        <div className="style-description">{style.description}</div>
                        <div className="style-meta">
                          Created by: {style.createdBy || 'Unknown'}
                        </div>
                      </div>
                      
                      <div className="style-actions">
                        {canEdit(style) && (
                          <button 
                            className="action-button"
                            onClick={() => handleEditStyle(style.id)}
                            disabled={isLoading}
                          >
                            Edit
                          </button>
                        )}
                        {canDelete(style) && (
                          <button 
                            className="action-button danger"
                            onClick={() => handleDelete(style.id)}
                            disabled={isLoading}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* 风格编辑器 */
            <StyleEditor
              style={editingStyle}
              onSave={handleSaveStyle}
              onCancel={handleCancelEdit}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default StyleManager