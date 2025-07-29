// 风格选择器组件
// 数据驱动的风格选择界面

import { useState } from 'react'
import { useStyles } from '../../hooks/useStyles.js'
import StyleManager from './StyleManager.jsx'
import '../../styles/StyleManager.css'

function StyleSelector({ 
  selectedStyle, 
  onStyleChange, 
  disabled = false,
  userId = null,
  showManageButton = true
}) {
  const { 
    styles, 
    isLoading, 
    error, 
    hasStyles 
  } = useStyles(userId)
  
  const [showStyleManager, setShowStyleManager] = useState(false)

  // 处理风格选择
  const handleStyleSelect = (styleId) => {
    if (disabled) return
    onStyleChange(styleId)
  }

  // 打开风格管理器
  const handleManageStyles = () => {
    setShowStyleManager(true)
  }

  // 关闭风格管理器
  const handleCloseManager = () => {
    setShowStyleManager(false)
  }

  if (isLoading) {
    return (
      <div className="style-selector">
        <div className="loading-state">Loading styles...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="style-selector">
        <div className="error-message">Error loading styles: {error}</div>
      </div>
    )
  }

  return (
    <div className="style-selector">
      <div className="style-manager-header">
        <h3 className="style-manager-title">Select Style</h3>
        {showManageButton && (
          <button 
            className="manage-styles-button"
            onClick={handleManageStyles}
            disabled={disabled}
          >
            Manage Styles
          </button>
        )}
      </div>

      {!hasStyles ? (
        <div className="empty-state">
          <p>No styles available. Create your first style!</p>
        </div>
      ) : (
        <div className="style-list">
          {styles.map((style) => (
            <div 
              key={style.id}
              className={`style-item ${selectedStyle === style.id ? 'selected' : ''}`}
              onClick={() => handleStyleSelect(style.id)}
              style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
            >
              <div className="style-info">
                <div className="style-name">{style.displayName}</div>
                <div className="style-description">{style.description}</div>
              </div>
              
              {selectedStyle === style.id && (
                <div className="selection-indicator">Selected</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 风格管理器模态框 */}
      {showStyleManager && (
        <StyleManager 
          userId={userId}
          onClose={handleCloseManager}
        />
      )}
    </div>
  )
}


export default StyleSelector