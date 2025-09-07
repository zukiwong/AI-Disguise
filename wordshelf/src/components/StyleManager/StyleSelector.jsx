// 风格选择器组件
// 数据驱动的风格选择界面

import { useState, useEffect } from 'react'
import { useStyles } from '../../hooks/useStyles.js'
import { useAuth } from '../../hooks/useAuth.js'
import StyleManager from './StyleManager.jsx'
import gsap from 'gsap'
import '../../styles/StyleManager.css'

function StyleSelector({ 
  selectedStyle, 
  selectedVariant = null, // 新增变体选择状态
  stylesWithVariants: propStylesWithVariants, // 从 props 接收样式数据
  isLoadingVariants: propIsLoadingVariants = false, // 从 props 接收加载状态
  onStyleChange, 
  onVariantChange, // 新增变体变化回调
  disabled = false,
  showManageButton = true
}) {
  const { userId, isAuthenticated } = useAuth()
  
  // 如果没有从 props 传入样式数据，则使用内部的 useStyles Hook
  const shouldUseInternalStyles = !propStylesWithVariants
  const fallbackStylesResult = useStyles(userId)
  
  // 只在需要时使用内部样式数据
  const { 
    styles, 
    isLoading, 
    error, 
    hasStyles,
    removePublicStyleFromAccount  // 添加移除方法
  } = shouldUseInternalStyles ? fallbackStylesResult : {
    styles: [],
    isLoading: false,
    error: null,
    hasStyles: false,
    removePublicStyleFromAccount: () => Promise.resolve(false)
  }
  
  // 使用带变体的风格数据 - 优先使用从 props 传入的数据
  const [internalStylesWithVariants, setInternalStylesWithVariants] = useState([])
  const [internalIsLoadingVariants, setInternalIsLoadingVariants] = useState(false)
  
  // 确定使用的数据源
  const stylesWithVariants = propStylesWithVariants || internalStylesWithVariants
  const isLoadingVariants = propIsLoadingVariants || internalIsLoadingVariants

  
  const [showStyleManager, setShowStyleManager] = useState(false)
  const [removingStyleId, setRemovingStyleId] = useState(null) // 追踪正在移除的风格
  const [expandedStyleId, setExpandedStyleId] = useState(null) // 追踪展开变体的风格

  // 处理风格选择
  const handleStyleSelect = (styleId, variantId = null) => {
    if (disabled) return
    onStyleChange(styleId)
    if (onVariantChange) {
      onVariantChange(variantId)
    }
  }
  
  // 处理变体选择
  const handleVariantSelect = (styleId, variantId) => {
    if (disabled) return
    handleStyleSelect(styleId, variantId)
  }
  
  // 切换变体展开/收起
  const toggleVariants = (styleId, e) => {
    e.stopPropagation()
    setExpandedStyleId(expandedStyleId === styleId ? null : styleId)
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
      // 使用 useStyles 提供的移除方法，这会正确更新所有相关状态
      const removePromise = removePublicStyleFromAccount(styleId)
      
      // 创建GSAP动画时间线
      const tl = gsap.timeline({
        onComplete: async () => {
          // 等待API完成
          try {
            await removePromise
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
  
  // 只在使用内部样式数据时才加载变体
  useEffect(() => {
    if (shouldUseInternalStyles && styles.length > 0) {
      setInternalIsLoadingVariants(true)
      
      // 检查styles是否已经包含变体数据
      const hasVariantData = styles.some(style => style.variants || style.hasVariants)
      
      if (hasVariantData) {
        // 如果已经包含变体数据，直接使用
        setInternalStylesWithVariants(styles)
      } else {
        // 如果不包含变体数据，使用基础数据
        setInternalStylesWithVariants(styles || [])
      }
      
      setInternalIsLoadingVariants(false)
    }
  }, [shouldUseInternalStyles, styles])

  if (shouldUseInternalStyles && isLoading) {
    return (
      <div className="style-selector">
        <div className="loading-state">Loading styles...</div>
      </div>
    )
  }

  if (shouldUseInternalStyles && error) {
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
        <div className="header-buttons">
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

      {(!hasStyles && stylesWithVariants.length === 0) ? (
        <div className="empty-state">
          <p>No styles available. Create your first style!</p>
        </div>
      ) : (
        <div className="style-list">
          {stylesWithVariants.map((style) => {
            // 判断是否可以移除（登录用户可以移除公共风格和自己创建的私人风格）
            const canRemove = isAuthenticated && (style.isPublic || style.createdBy === userId)
            const hasVariants = style.variants && style.variants.length > 0
            const isExpanded = expandedStyleId === style.id
            const isStyleSelected = selectedStyle === style.id
            
            
            
            return (
              <div key={style.id} className="style-item-container">
                <div 
                  className={`style-item ${isStyleSelected ? 'selected' : ''}`}
                  onClick={() => handleStyleSelect(style.id)}
                  style={{ 
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    pointerEvents: disabled ? 'none' : 'auto',
                    userSelect: 'none'
                  }}
                >
                  <div className="style-info">
                    <div className="style-name">{style.displayName}</div>
                    <div className="style-description">
                      {(() => {
                        // 如果选中了变体，显示变体的描述
                        if (isStyleSelected && selectedVariant && hasVariants) {
                          const selectedVariantObj = style.variants.find(v => v.id === selectedVariant)
                          return selectedVariantObj ? selectedVariantObj.description : style.description
                        }
                        // 否则显示默认样式描述
                        return style.description
                      })()}
                    </div>
                    
                    {/* 变体标签预览 */}
                    {hasVariants && !isExpanded && (
                      <div className="variant-tags variant-preview">
                        {/* 默认标签 */}
                        <button
                          className={`variant-tag ${isStyleSelected && !selectedVariant ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleVariantSelect(style.id, null)
                          }}
                        >
                          Default
                        </button>
                        
                        {/* 变体标签 */}
                        {style.variants.slice(0, 2).map((variant) => (
                          <button
                            key={variant.id}
                            className={`variant-tag ${selectedVariant === variant.id ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleVariantSelect(style.id, variant.id)
                            }}
                          >
                            {variant.name}
                          </button>
                        ))}
                        
                        {/* 更多变体按钮 */}
                        {style.variants.length > 2 && (
                          <button
                            className="variant-tag view-all"
                            onClick={(e) => toggleVariants(style.id, e)}
                          >
                            +{style.variants.length - 2} more
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="style-item-actions">
                    {/* 变体展开按钮 */}
                    {hasVariants && (
                      <button
                        className={`variant-toggle-btn ${isExpanded ? 'expanded' : ''}`}
                        onClick={(e) => toggleVariants(style.id, e)}
                        disabled={disabled}
                        title={isExpanded ? '收起变体' : '展开变体'}
                      >
                        {isExpanded ? '▲' : '▼'}
                      </button>
                    )}
                    
                    {/* 移除按钮 - 叉号 */}
                    {canRemove && (
                      <button
                        className="remove-style-btn"
                        onClick={(e) => handleRemoveStyle(style.id, style.displayName, e)}
                        disabled={disabled || removingStyleId === style.id}
                        title="Remove from my list"
                      ></button>
                    )}
                  </div>
                </div>
                
                {/* 展开的变体列表 */}
                {hasVariants && isExpanded && (
                  <div className="variant-list">
                    {/* 默认变体 */}
                    <div 
                      className={`variant-item ${isStyleSelected && !selectedVariant ? 'selected' : ''}`}
                      onClick={() => handleVariantSelect(style.id, null)}
                    >
                      <div className="variant-info">
                        <div className="variant-name">Default</div>
                        <div className="variant-description">{style.description}</div>
                      </div>
                    </div>
                    
                    {/* 风格变体 */}
                    {style.variants.map((variant) => (
                      <div 
                        key={variant.id}
                        className={`variant-item ${selectedVariant === variant.id ? 'selected' : ''}`}
                        onClick={() => handleVariantSelect(style.id, variant.id)}
                      >
                        <div className="variant-info">
                          <div className="variant-name">{variant.name}</div>
                          <div className="variant-description">{variant.description}</div>
                        </div>
                        <div className="variant-usage">{variant.usageCount || 0} uses</div>
                      </div>
                    ))}
                  </div>
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