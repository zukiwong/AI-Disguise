// 风格选择器组件
// 数据驱动的风格选择界面

import { useState, useEffect } from 'react'
import { useStyles } from '../../hooks/useStyles.js'
import { useAuth } from '../../hooks/useAuth.js'
import StyleManager from './StyleManager.jsx'
import gsap from 'gsap'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import {
  CSS,
} from '@dnd-kit/utilities'
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
  
  // 简化逻辑：优先使用从 props 传入的数据，否则使用内部 Hook
  const internalStylesResult = useStyles(userId)
  
  // 确定使用的数据源
  const stylesWithVariants = propStylesWithVariants || internalStylesResult.styles
  const isLoading = propIsLoadingVariants || internalStylesResult.isLoading
  const error = internalStylesResult.error
  const hasStyles = stylesWithVariants.length > 0
  const removePublicStyleFromAccount = internalStylesResult.removePublicStyleFromAccount

  
  const [showStyleManager, setShowStyleManager] = useState(false)
  const [removingStyleId, setRemovingStyleId] = useState(null) // 追踪正在移除的风格
  const [expandedStyleId, setExpandedStyleId] = useState(null) // 追踪展开变体的风格
  
  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  // 本地排序状态
  const [sortedStyles, setSortedStyles] = useState([])
  
  // 当 stylesWithVariants 变化时更新本地排序状态
  useEffect(() => {
    setSortedStyles(stylesWithVariants)
  }, [stylesWithVariants])

  // 处理风格选择和展开/收起
  const handleStyleSelect = (styleId, variantId = null) => {
    if (disabled) return
    
    const currentStyle = stylesWithVariants.find(s => s.id === styleId)
    const hasVariants = currentStyle?.variants?.length > 0
    
    // 如果点击的是已经选中的风格
    if (selectedStyle === styleId) {
      // 如果有变体，则切换展开状态
      if (hasVariants) {
        setExpandedStyleId(expandedStyleId === styleId ? null : styleId)
      }
      // 如果没有变体，不做任何操作（避免重复选择）
    } else {
      // 选择新的风格
      onStyleChange(styleId)
      if (onVariantChange) {
        onVariantChange(variantId)
      }
      // 选择新风格时，如果之前有展开的变体列表，先收起
      if (expandedStyleId && expandedStyleId !== styleId) {
        setExpandedStyleId(null)
      }
    }
  }
  
  // 处理变体选择
  const handleVariantSelect = (styleId, variantId) => {
    if (disabled) return
    // 直接选择风格和变体，不触发展开/收起逻辑
    onStyleChange(styleId)
    if (onVariantChange) {
      onVariantChange(variantId)
    }
  }
  
  // 切换变体展开/收起
  const toggleVariants = (styleId, e) => {
    e.stopPropagation()
    setExpandedStyleId(expandedStyleId === styleId ? null : styleId)
  }
  
  // 处理拖拽结束
  const handleDragEnd = (event) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    setSortedStyles((items) => {
      const oldIndex = items.findIndex(item => item.id === active.id)
      const newIndex = items.findIndex(item => item.id === over.id)
      return arrayMove(items, oldIndex, newIndex)
    })
  }
  
  // 处理拖拽开始
  const handleDragStart = () => {
    // 拖拽开始时的处理逻辑
  }

  // 处理移除风格（带GSAP动画）
  const handleRemoveStyle = async (styleId, _, e) => {
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
      const remainingStyles = stylesWithVariants.filter(s => s.id !== styleId)
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

      {!hasStyles ? (
        <div className="empty-state">
          <p>No styles available. Create your first style!</p>
        </div>
      ) : (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="style-list">
            <SortableContext 
              items={sortedStyles.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {sortedStyles.map((style) => {
                // 判断是否可以移除（登录用户可以移除公共风格和自己创建的私人风格）
                const canRemove = isAuthenticated && (style.isPublic || style.createdBy === userId)
                const hasVariants = style.variants && style.variants.length > 0
                const isExpanded = expandedStyleId === style.id
                const isStyleSelected = selectedStyle === style.id
                
                return (
                  <SortableStyleItem
                    key={style.id}
                    style={style}
                    isStyleSelected={isStyleSelected}
                    hasVariants={hasVariants}
                    isExpanded={isExpanded}
                    selectedVariant={selectedVariant}
                    canRemove={canRemove}
                    disabled={disabled}
                    removingStyleId={removingStyleId}
                    handleStyleSelect={handleStyleSelect}
                    handleVariantSelect={handleVariantSelect}
                    toggleVariants={toggleVariants}
                    handleRemoveStyle={handleRemoveStyle}
                  />
                )
              })}
            </SortableContext>
          </div>
        </DndContext>
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

// 可拖拽的样式项组件
function SortableStyleItem({ 
  style, 
  isStyleSelected, 
  hasVariants, 
  isExpanded, 
  selectedVariant, 
  canRemove, 
  disabled, 
  removingStyleId, 
  handleStyleSelect, 
  handleVariantSelect, 
  toggleVariants, 
  handleRemoveStyle 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: style.id,
    disabled: disabled
  })

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <div 
      ref={setNodeRef}
      className="style-item-container"
      style={dragStyle}
      {...attributes}
    >
      <div 
        className={`style-item ${isStyleSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
        onClick={() => handleStyleSelect(style.id)}
        style={{ 
          cursor: disabled ? 'not-allowed' : 'pointer',
          pointerEvents: disabled ? 'none' : 'auto',
          userSelect: 'none'
        }}
      >
        {/* 拖拽手柄 */}
        <div 
          className="style-drag-handle" 
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={() => {}}
        >
          ⋮⋮
        </div>
        
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
                  className={`variant-tag ${isStyleSelected && selectedVariant === variant.id ? 'active' : ''}`}
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
              className={`variant-item ${isStyleSelected && selectedVariant === variant.id ? 'selected' : ''}`}
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
}


export default StyleSelector