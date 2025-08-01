// 风格选择器组件
// 数据驱动的风格选择界面

import { useState } from 'react'
import { useStyles } from '../../hooks/useStyles.js'
import { useAuth } from '../../hooks/useAuth.js'
import StyleManager from './StyleManager.jsx'
import gsap from 'gsap'
import '../../styles/StyleManager.css'

function StyleSelector({ 
  selectedStyle, 
  onStyleChange, 
  disabled = false,
  showManageButton = true
}) {
  const { userId, isAuthenticated } = useAuth()
  const { 
    styles, 
    isLoading, 
    error, 
    hasStyles,
    loadStyles,
    handleHideStyle  // 添加隐藏风格方法
  } = useStyles(userId)

  
  const [showStyleManager, setShowStyleManager] = useState(false)
  const [removingStyleId, setRemovingStyleId] = useState(null) // 追踪正在移除的风格

  // 处理风格选择
  const handleStyleSelect = (styleId) => {
    if (disabled) return
    onStyleChange(styleId)
  }

  // 处理移除风格（带GSAP动画）
  const handleRemoveStyle = async (styleId, styleName, e) => {
    e.stopPropagation() // 阻止事件冒泡，避免触发选择
    
    if (!isAuthenticated || removingStyleId === styleId) {
      return // 防止重复点击
    }
    
    // 设置正在移除状态
    setRemovingStyleId(styleId)
    
    // 获取要动画的元素
    const styleItem = e.target.closest('.style-item')
    if (!styleItem) {
      setRemovingStyleId(null)
      return
    }
    
    // 如果当前选中的风格被移除，立即重置选择
    if (selectedStyle === styleId) {
      const remainingStyles = styles.filter(s => s.id !== styleId)
      if (remainingStyles.length > 0) {
        onStyleChange(remainingStyles[0].id)
      }
    }

    try {
      // 立即开始API调用（乐观更新）
      const hidePromise = handleHideStyle(styleId)
      
      // 创建GSAP动画时间线
      const tl = gsap.timeline({
        onComplete: async () => {
          // 等待API完成
          try {
            await hidePromise
          } catch (error) {
            console.error('移除风格失败:', error)
            // 如果API失败，恢复元素状态
            gsap.set(styleItem, { y: 0, opacity: 1, height: 'auto', marginBottom: '10px', paddingTop: '12px', paddingBottom: '12px' })
          } finally {
            setRemovingStyleId(null)
          }
        }
      })
      
      // 添加纵向滑动动画序列
      tl.to(styleItem, {
        y: '-100%',
        opacity: 0,
        height: 0,
        marginBottom: 0,
        paddingTop: 0,
        paddingBottom: 0,
        duration: 0.4,
        ease: 'power2.out'
      })
      
    } catch (error) {
      console.error('动画执行失败:', error)
      setRemovingStyleId(null)
    }
  }

  // 打开风格管理器
  const handleManageStyles = () => {
    setShowStyleManager(true)
  }

  // 关闭风格管理器
  const handleCloseManager = () => {
    setShowStyleManager(false)
    // 移除重新加载，依赖乐观更新保持数据一致性
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

  // 处理手动刷新 - 只在没有操作进行中时刷新
  const handleRefresh = () => {
    // 可以考虑检查是否有操作在进行中，但目前先直接刷新
    loadStyles()
  }

  return (
    <div className="style-selector">
      <div className="style-manager-header">
        <h3 className="style-manager-title">Select Style</h3>
        <div className="header-buttons">
          <button 
            className="refresh-button"
            onClick={handleRefresh}
            disabled={disabled || isLoading}
            title="刷新风格列表"
          >
            🔄
          </button>
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
      </div>

      {!hasStyles ? (
        <div className="empty-state">
          <p>No styles available. Create your first style!</p>
        </div>
      ) : (
        <div className="style-list">
          {styles.map((style) => {
            // 判断是否可以移除（登录用户可以移除公共风格和自己创建的私人风格）
            const canRemove = isAuthenticated && (style.isPublic || style.createdBy === userId)
            
            return (
              <div 
                key={style.id}
                className={`style-item ${selectedStyle === style.id ? 'selected' : ''}`}
                onClick={() => handleStyleSelect(style.id)}
                style={{ 
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  pointerEvents: disabled ? 'none' : 'auto',
                  userSelect: 'none'
                }}
              >
                <div className="style-info">
                  <div className="style-name">{style.displayName}</div>
                  <div className="style-description">{style.description}</div>
                </div>
                
                {/* 移除按钮 - 叉号 */}
                {canRemove && (
                  <button
                    className="remove-style-btn"
                    onClick={(e) => handleRemoveStyle(style.id, style.displayName, e)}
                    disabled={disabled || removingStyleId === style.id}
                    title="从我的列表中移除"
                  ></button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 风格管理器模态框 */}
      {showStyleManager && (
        <StyleManager 
          onClose={handleCloseManager}
          onStylesUpdated={() => {}} // 空函数，因为StyleManager已经实现乐观更新
        />
      )}
    </div>
  )
}


export default StyleSelector