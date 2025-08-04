// 风格市场组件
// 展示所有公共风格，支持搜索和分类

import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { getPublicStylesWithVariants } from '../../services/styleService.js'
import { createVariant } from '../../services/variantService.js'
import '../../styles/Explore.css'

/**
 * 生成变体的最终prompt的帮助函数
 * 
 * 新的变体逻辑：
 * - 用户只需要填写变体名称和描述
 * - 系统会自动根据主风格的基础prompt + 变体描述生成最终prompt
 * - 这样用户操作简单，同时保持灵活性
 * - 向后兼容：已有的自定义promptOverride继续有效
 */
const generateVariantPrompt = (baseStyle, variant) => {
  // 如果变体有自定义的promptOverride，直接使用（向后兼容）
  if (variant.promptOverride && variant.promptOverride.trim()) {
    return variant.promptOverride
  }
  
  // 否则基于主风格prompt + 变体描述生成
  const basePrompt = baseStyle.promptTemplate || 'Transform the following text:'
  const variantRequirement = variant.description || ''
  
  if (variantRequirement) {
    return `${basePrompt} 特别要求：${variantRequirement}`
  }
  
  return basePrompt
}

function StyleMarket() {
  const { isAuthenticated, userId } = useAuth()
  
  // 使用本地状态管理探索页数据
  const [publicStyles, setPublicStyles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [filteredStyles, setFilteredStyles] = useState([])

  // 加载探索页公共风格数据  
  useEffect(() => {
    const loadExploreStyles = async () => {
      setIsLoading(true)
      try {
        const styles = await getPublicStylesWithVariants(userId)
        setPublicStyles(styles)
      } catch (error) {
        console.error('加载探索页风格失败:', error)
        setPublicStyles([])
      } finally {
        setIsLoading(false)
      }
    }

    loadExploreStyles()
  }, [userId]) // 当用户登录状态变化时重新加载

  // 过滤风格
  useEffect(() => {
    let filtered = publicStyles

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(style =>
        style.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        style.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 分类过滤（可以根据需要扩展）
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(style => style.category === categoryFilter)
    }

    setFilteredStyles(filtered)
  }, [publicStyles, searchTerm, categoryFilter])

  const handleUseStyle = (styleId, variantId = null) => {
    // TODO: 集成到主页面，设置为当前选中的风格和变体
    const style = publicStyles.find(s => s.id === styleId)
    if (!style) {
      console.log('风格未找到:', styleId)
      return
    }

    if (variantId) {
      const variant = style.variants?.find(v => v.id === variantId)
      if (variant) {
        const finalPrompt = generateVariantPrompt(style, variant)
        console.log('使用风格变体:', { 
          styleId, 
          variantId, 
          styleName: style.displayName,
          variantName: variant.name,
          finalPrompt 
        })
      } else {
        console.log('变体未找到:', { styleId, variantId })
      }
    } else {
      console.log('使用默认风格:', { 
        styleId, 
        styleName: style.displayName,
        prompt: style.promptTemplate || 'Transform the following text:'
      })
    }
  }

  const handleFavoriteStyle = (styleId) => {
    if (!isAuthenticated) {
      // TODO: 显示登录提示
      console.log('需要登录才能收藏')
      return
    }
    // TODO: 实现收藏功能
    console.log('收藏风格:', styleId)
  }

  // 更新风格的变体列表
  const updateStyleVariants = (styleId, newVariant) => {
    setPublicStyles(prevStyles => 
      prevStyles.map(style => {
        if (style.id === styleId) {
          const updatedVariants = [...(style.variants || []), newVariant]
          return {
            ...style,
            variants: updatedVariants,
            hasVariants: updatedVariants.length > 0
          }
        }
        return style
      })
    )
  }



  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading styles...</p>
      </div>
    )
  }

  return (
    <div className="style-market">
      {/* 搜索和筛选 */}
      <div className="explore-filters">
        <input
          type="text"
          className="filter-input"
          placeholder="Search styles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <select
          className="filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="creative">Creative</option>
          <option value="professional">Professional</option>
          <option value="casual">Casual</option>
        </select>
        
      </div>

      {/* 风格卡片网格 */}
      {filteredStyles.length === 0 ? (
        <div className="empty-state">
          <h3 className="empty-state-title">No styles found</h3>
          <p className="empty-state-message">
            {searchTerm ? 'Try a different search term.' : 'No public styles available yet.'}
          </p>
        </div>
      ) : (
        <div className="style-grid">
          {filteredStyles.map((style) => (
            <StyleCard
              key={style.id}
              style={style}
              onUse={handleUseStyle}
              onFavorite={handleFavoriteStyle}
              canFavorite={isAuthenticated}
              onVariantAdded={updateStyleVariants}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// 爱心图标组件
function HeartIcon({ filled, className }) {
  return (
    <svg 
      className={className}
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor" 
      strokeWidth="2"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}

// 风格卡片组件（支持变体）
function StyleCard({ style, onUse, onFavorite, canFavorite, onVariantAdded }) {
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false) // 临时状态，后续可连接真实数据
  
  const isOfficial = style.createdBy === 'system'
  const hasVariants = style.hasVariants && style.variants && style.variants.length > 0
  
  // 当前显示的内容（基于选中的变体或默认风格）
  const currentContent = selectedVariant || {
    name: 'Default',
    description: style.description,
    promptOverride: style.promptTemplate
  }
  
  // 显示的变体标签（最多4个）
  const displayVariants = hasVariants ? style.variants.slice(0, 4) : []
  const hasMoreVariants = hasVariants && style.variants.length > 4
  
  const handleVariantClick = (variant) => {
    setSelectedVariant(variant)
  }
  
  const handleViewAllClick = () => {
    setShowVariantModal(true)
  }
  
  const handleUseStyle = () => {
    if (selectedVariant) {
      // 使用选中的变体
      onUse(style.id, selectedVariant.id)
    } else {
      // 使用默认风格
      onUse(style.id, null)
    }
  }

  const handleFavoriteClick = (e) => {
    e.stopPropagation() // 阻止事件冒泡
    if (!canFavorite) return
    
    setIsFavorited(!isFavorited)
    onFavorite(style.id)
  }

  const handleCardClick = () => {
    // 点击卡片空白处打开变体窗口
    // 即使没有变体也打开窗口，用户可以在里面添加变体
    setShowVariantModal(true)
  }
  
  return (
    <>
      <div className="style-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
        {/* 卡片主要内容区域 */}
        <div className="style-card-content">
          <div className="style-card-header">
            <h3 className="style-card-title">{style.displayName}</h3>
            <span className={`style-card-badge ${isOfficial ? 'official' : ''}`}>
              {isOfficial ? 'Official' : 'Community'}
            </span>
          </div>
          
          <p className="style-card-description">{currentContent.description}</p>
          
          {/* 变体标签区域 */}
          {hasVariants && (
            <div className="style-variants">
              <div className="variant-tags">
                {/* 默认标签 */}
                <button
                  className={`variant-tag ${!selectedVariant ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedVariant(null)
                  }}
                >
                  Default
                </button>
                
                {/* 变体标签 */}
                {displayVariants.map((variant) => (
                  <button
                    key={variant.id}
                    className={`variant-tag ${selectedVariant?.id === variant.id ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleVariantClick(variant)
                    }}
                  >
                    {variant.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* 固定在底部的按钮区域 */}
        <div className="style-card-bottom">
          <div className="style-card-actions">
            <button
              className="style-action-button"
              onClick={(e) => {
                e.stopPropagation()
                handleUseStyle()
              }}
            >
              Use Style {selectedVariant ? `(${selectedVariant.name})` : ''}
            </button>
            
            {/* View All 按钮 - 只要有变体就显示 */}
            {hasVariants && (
              <button
                className="style-action-button view-all-button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleViewAllClick()
                }}
              >
                View All{hasMoreVariants ? ` (+${style.variants.length - 4})` : ''}
              </button>
            )}
          </div>
          
          {/* 收藏按钮移到右下角 */}
          {canFavorite && (
            <button
              className={`favorite-button ${isFavorited ? 'favorited' : ''}`}
              onClick={handleFavoriteClick}
              title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <HeartIcon filled={isFavorited} />
            </button>
          )}
        </div>
      </div>
      
      {/* 变体详情模态框 */}
      {showVariantModal && (
        <VariantModal
          style={style}
          onClose={() => setShowVariantModal(false)}
          onUse={onUse}
          onVariantAdded={onVariantAdded}
        />
      )}
    </>
  )
}

// 变体详情模态框组件
function VariantModal({ style, onClose, onUse, onVariantAdded }) {
  const { isAuthenticated, userId } = useAuth()
  
  // 添加变体的表单状态
  const [isAddingVariant, setIsAddingVariant] = useState(false)
  const [newVariant, setNewVariant] = useState({
    name: '',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 合并默认风格和变体，并按热度排序
  const allVariants = [
    // 默认风格
    {
      id: 'default',
      name: 'Default',
      description: style.description,
      createdBy: style.createdBy === 'system' ? 'AI Disguiser' : style.createdBy,
      usageCount: style.usageCount || 0,
      isDefault: true
    },
    // 变体列表（已经在variantService中按使用次数排序）
    ...(style.variants || []).map(variant => ({
      ...variant,
      createdBy: variant.createdBy === 'system' ? 'AI Disguiser' : variant.createdBy,
      isDefault: false
    }))
  ]

  // 确保按使用次数降序排序
  allVariants.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
  
  // 处理添加新变体
  const handleAddVariant = () => {
    if (!isAuthenticated) {
      alert('请先登录后再添加变体')
      return
    }
    setIsAddingVariant(true)
  }
  
  // 取消添加
  const handleCancelAdd = () => {
    setIsAddingVariant(false)
    setNewVariant({ name: '', description: '' })
  }
  
  // 提交新变体
  const handleSubmitVariant = async () => {
    if (!newVariant.name.trim() || !newVariant.description.trim()) {
      alert('请填写变体名称和描述')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // 创建变体时只传入name和description，不需要promptOverride
      // 实际使用时会通过generateVariantPrompt动态生成最终prompt
      const newVariantData = await createVariant(style.id, {
        ...newVariant,
        createdBy: userId || 'anonymous',
        isPublic: true
        // promptOverride将自动设置为空字符串，使用时动态生成
      })
      
      // 成功后只刷新当前窗口数据，不刷新整个页面
      alert('变体添加成功！')
      
      // 通知父组件更新主状态
      if (onVariantAdded) {
        onVariantAdded(style.id, newVariantData)
      }
      
      // 更新本地的 style.variants 数据（用于当前模态框显示）
      if (style.variants) {
        style.variants.push(newVariantData)
      } else {
        style.variants = [newVariantData]
      }
      
      // 重置表单状态
      setIsAddingVariant(false)  
      setNewVariant({ name: '', description: '' })
      
    } catch (error) {
      console.error('添加变体失败:', error)
      alert('添加变体失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content variant-modal-table" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{style.displayName} - All Variants</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="variant-table-container">
            <table className="variant-table">
              <thead>
                <tr>
                  <th className="variant-col-name">变体名称</th>
                  <th className="variant-col-description">描述</th>
                  <th className="variant-col-usage">使用数</th>
                  <th className="variant-col-action">操作</th>
                </tr>
              </thead>
              <tbody>
                {allVariants.map((variant) => (
                  <tr key={variant.id} className="variant-row">
                    <td className="variant-col-name">
                      <div className="variant-name-cell">
                        {variant.name}
                        {variant.isDefault && <span className="default-badge">Default</span>}
                      </div>
                    </td>
                    <td className="variant-col-description">
                      <div className="variant-description-cell" title={variant.description}>
                        {variant.description}
                      </div>
                    </td>
                    <td className="variant-col-usage">
                      <span className="usage-count">{variant.usageCount || 0} uses</span>
                    </td>
                    <td className="variant-col-action">
                      <button
                        className="variant-table-use-button"
                        onClick={() => {
                          onUse(style.id, variant.isDefault ? null : variant.id)
                          onClose()
                        }}
                      >
                        Use
                      </button>
                    </td>
                  </tr>
                ))}
                
                {/* 添加新变体的行 */}
                {isAddingVariant ? (
                  <tr className="variant-row variant-add-row">
                    <td className="variant-col-name">
                      <input
                        type="text"
                        className="variant-input"
                        placeholder="变体名称"
                        value={newVariant.name}
                        onChange={(e) => setNewVariant({...newVariant, name: e.target.value})}
                      />
                    </td>
                    <td className="variant-col-description">
                      <textarea
                        className="variant-textarea"
                        placeholder="变体描述"
                        value={newVariant.description}
                        onChange={(e) => {
                          setNewVariant({...newVariant, description: e.target.value})
                          // 自动调整高度
                          e.target.style.height = 'auto'
                          e.target.style.height = e.target.scrollHeight + 'px'
                        }}
                        rows="1"
                        style={{ minHeight: '36px', maxHeight: '120px' }}
                      />
                    </td>
                    <td className="variant-col-usage">
                      <span style={{ color: '#999', fontSize: '12px' }}>新变体</span>
                    </td>
                    <td className="variant-col-action">
                      <button
                        className="variant-table-cancel-button"
                        onClick={handleCancelAdd}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr className="variant-row variant-add-prompt-row">
                    <td colSpan="4" className="variant-add-prompt">
                      <button
                        className="variant-add-prompt-button"
                        onClick={handleAddVariant}
                        disabled={!isAuthenticated}
                      >
                        {isAuthenticated ? '+ Add New Variant' : 'Login to Add Variant'}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {isAddingVariant && (
            <div className="variant-modal-actions">
              <button
                className="variant-submit-button"
                onClick={handleSubmitVariant}
                disabled={isSubmitting || !newVariant.name.trim() || !newVariant.description.trim()}
              >
                {isSubmitting ? 'Submitting...' : 'Submit New Variant'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StyleMarket