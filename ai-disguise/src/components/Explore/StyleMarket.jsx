// 风格市场组件
// 展示所有公共风格，支持搜索和分类

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { useStyles } from '../../hooks/useStyles.js'
import { getPublicStylesWithVariants } from '../../services/styleService.js'
import { createVariant } from '../../services/variantService.js'
import CustomSelect from '../CustomSelect'
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
import ConfirmDialog from '../Common/ConfirmDialog.jsx'
import '../../styles/Explore.css'
import '../../styles/Modal.css'

// 开发环境下导入变体添加工具
if (import.meta.env.DEV) {
  import('../../utils/addVariants.js')
}


function StyleMarket() {
  const { isAuthenticated, userId } = useAuth()
  const navigate = useNavigate()
  
  // 使用统一的风格管理Hook
  const { 
    addedStyleIds, 
    addPublicStyleToAccount
  } = useStyles(userId)
  
  // 使用本地状态管理探索页数据
  const [publicStyles, setPublicStyles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  // 确认对话框状态
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmDialogConfig, setConfirmDialogConfig] = useState({
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'info',
    onConfirm: null
  })

  // 加载探索页公共风格数据  
  useEffect(() => {
    const loadExploreStyles = async () => {
      setIsLoading(true)
      try {
        const styles = await getPublicStylesWithVariants(userId)
        // 数据去重，防止重复的style ID
        const uniqueStyles = styles.filter((style, index, self) =>
          index === self.findIndex(s => s.id === style.id)
        )
        setPublicStyles(uniqueStyles)
      } catch (error) {
        console.error('加载探索页风格失败:', error)
        setPublicStyles([])
      } finally {
        setIsLoading(false)
      }
    }

    loadExploreStyles()
  }, [userId]) // 当用户登录状态变化时重新加载

  // 分离公共样式和社区样式
  const [officialStyles, setOfficialStyles] = useState([])
  const [communityStyles, setCommunityStyles] = useState([])
  
  // 过滤、排序和分组风格
  useEffect(() => {
    let filtered = publicStyles

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(style =>
        style.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        style.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 排序功能
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          // 按创建时间降序（最新的在前）
          return new Date(b.createdAt?.toDate?.() || b.createdAt || 0) - new Date(a.createdAt?.toDate?.() || a.createdAt || 0)
        case 'popular':
          // 按使用次数降序（最热门的在前）
          const usageCountDiff = (b.usageCount || 0) - (a.usageCount || 0)
          // 如果使用次数相同，则按创建时间降序（最新的在前）
          if (usageCountDiff === 0) {
            return new Date(b.createdAt?.toDate?.() || b.createdAt || 0) - new Date(a.createdAt?.toDate?.() || a.createdAt || 0)
          }
          return usageCountDiff
        default:
          return 0
      }
    })

    // 分离公共样式（系统创建）和社区样式（用户创建）
    const official = filtered.filter(style => style.createdBy === 'system')
    const community = filtered.filter(style => style.createdBy !== 'system')

    // 额外的去重保护，防止任何潜在的重复
    const uniqueOfficial = official.filter((style, index, self) =>
      index === self.findIndex(s => s.id === style.id)
    )
    const uniqueCommunity = community.filter((style, index, self) =>
      index === self.findIndex(s => s.id === style.id)
    )

    setOfficialStyles(uniqueOfficial)
    setCommunityStyles(uniqueCommunity)
  }, [publicStyles, searchTerm, sortBy])

  // 显示确认对话框的辅助函数
  const showConfirm = (config) => {
    setConfirmDialogConfig(config)
    setShowConfirmDialog(true)
  }

  // 隐藏确认对话框
  const hideConfirm = () => {
    setShowConfirmDialog(false)
    setConfirmDialogConfig({
      title: '',
      message: '',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      type: 'info',
      onConfirm: null
    })
  }

  const handleUseStyle = (styleId, variantId = null, requiresAuth = false) => {
    // 检查权限：社区样式需要登录
    if (requiresAuth && !isAuthenticated) {
      showConfirm({
        title: 'Login Required',
        message: 'Please login first to use community styles',
        confirmText: 'OK',
        type: 'info',
        onConfirm: hideConfirm
      })
      return
    }
    
    // 将选择的风格和变体保存到 localStorage，然后跳转到首页
    const style = publicStyles.find(s => s.id === styleId)
    if (!style) {
      console.log('风格未找到:', styleId)
      return
    }

    try {
      // 保存选择状态到 localStorage
      const selectedStyleData = {
        styleId: styleId,
        variantId: variantId,
        timestamp: Date.now()
      }
      localStorage.setItem('selectedStyleFromExplore', JSON.stringify(selectedStyleData))
      
      // 跳转到首页
      navigate('/')
    } catch (error) {
      console.error('保存风格选择失败:', error)
      // 即使保存失败也可以跳转
      navigate('/')
    }
  }


  // 处理添加风格到个人列表
  const handleAddToMyList = async (styleId) => {
    if (!isAuthenticated) {
      showConfirm({
        title: 'Login Required',
        message: 'Please login first to add styles to your personal list',
        confirmText: 'OK',
        type: 'info',
        onConfirm: hideConfirm
      })
      return
    }

    try {
      // 检查是否已经添加过
      if (addedStyleIds.includes(styleId)) {
        showConfirm({
          title: 'Already Added',
          message: 'This style has already been added to your personal list',
          confirmText: 'OK',
          type: 'info',
          onConfirm: hideConfirm
        })
        return
      }

      console.log('开始添加风格到个人列表:', styleId)
      console.log('当前addedStyleIds:', addedStyleIds)

      // 使用统一的风格管理方法添加
      const success = await addPublicStyleToAccount(styleId)
      
      console.log('添加结果:', success)

      if (success) {
        showConfirm({
          title: 'Success',
          message: 'Style added to your personal list successfully!',
          confirmText: 'OK',
          type: 'success',
          onConfirm: hideConfirm
        })
      } else {
        showConfirm({
          title: 'Failed',
          message: 'Failed to add style, please try again',
          confirmText: 'OK',
          type: 'danger',
          onConfirm: hideConfirm
        })
      }
    } catch (error) {
      console.error('添加风格失败:', error)
      showConfirm({
        title: 'Error',
        message: 'Failed to add style, please try again',
        confirmText: 'OK',
        type: 'danger',
        onConfirm: hideConfirm
      })
    }
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
        
        <CustomSelect
          options={[
            { value: 'newest', label: 'Newest First', description: 'Latest styles first' },
            { value: 'popular', label: 'Most Popular', description: 'Most used styles' }
          ]}
          value={sortBy}
          onChange={setSortBy}
          placeholder="Sort by..."
        />
        
      </div>

      {/* 公共样式区域 */}
      <div className="styles-section">
        <h3 className="section-title">Official Styles</h3>
        <p className="section-description">High-quality styles created by AI Disguise team. Available to all users.</p>
        
        {officialStyles.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-message">
              {searchTerm ? 'No official styles match your search.' : 'No official styles available yet.'}
            </p>
          </div>
        ) : (
          <div className="style-grid">
            {officialStyles.map((style) => (
              <StyleCard
                key={`official-${style.id}`}
                style={style}
                onUse={(styleId, variantId) => handleUseStyle(styleId, variantId, false)} // 公共样式不需要登录
                onAddToMyList={handleAddToMyList}
                canAddToList={isAuthenticated}
                isAddedToList={addedStyleIds.includes(style.id)}
                onVariantAdded={updateStyleVariants}
                requiresAuth={false} // 标记为不需要认证
                showConfirm={showConfirm}
                hideConfirm={hideConfirm}
              />
            ))}
          </div>
        )}
      </div>

      {/* 社区样式区域 */}
      <div className="styles-section">
        <h3 className="section-title">Community Styles</h3>
        <p className="section-description">Styles shared by our community members. Login required to use.</p>
        
        {communityStyles.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-message">
              {searchTerm ? 'No community styles match your search.' : 'No community styles available yet.'}
            </p>
          </div>
        ) : (
          <div className="style-grid">
            {communityStyles.map((style) => (
              <StyleCard
                key={`community-${style.id}`}
                style={style}
                onUse={(styleId, variantId) => handleUseStyle(styleId, variantId, true)} // 社区样式需要登录
                onAddToMyList={handleAddToMyList}
                canAddToList={isAuthenticated}
                isAddedToList={addedStyleIds.includes(style.id)}
                onVariantAdded={updateStyleVariants}
                requiresAuth={true} // 标记为需要认证
                showConfirm={showConfirm}
                hideConfirm={hideConfirm}
              />
            ))}
          </div>
        )}
      </div>

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title={confirmDialogConfig.title}
        message={confirmDialogConfig.message}
        confirmText={confirmDialogConfig.confirmText}
        cancelText={confirmDialogConfig.cancelText}
        type={confirmDialogConfig.type}
        onConfirm={confirmDialogConfig.onConfirm}
        onCancel={hideConfirm}
      />
    </div>
  )
}


// 风格卡片组件（支持变体）
function StyleCard({ style, onUse, onAddToMyList, canAddToList, isAddedToList, onVariantAdded, requiresAuth = false, showConfirm, hideConfirm }) {
  const { isAuthenticated } = useAuth() // 获取用户认证状态
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [showVariantModal, setShowVariantModal] = useState(false)
  
  const isOfficial = style.createdBy === 'system'
  const hasVariants = style.hasVariants && style.variants && style.variants.length > 0
  
  // 当前显示的内容（基于选中的变体或默认风格）
  const currentContent = selectedVariant || {
    name: 'Default',
    description: style.description,
    promptOverride: style.promptTemplate
  }
  
  // 显示的变体标签（最多5个，为"更多"按钮留出空间）
  const displayVariants = hasVariants ? style.variants.slice(0, 5) : []
  const hasMoreVariants = hasVariants && style.variants.length > 5
  
  const handleVariantClick = (variant) => {
    setSelectedVariant(variant)
  }
  
  const handleUseStyle = () => {
    // 检查权限：社区样式需要登录
    if (requiresAuth && !isAuthenticated) {
      showConfirm({
        title: 'Login Required',
        message: 'Please login first to use community styles',
        confirmText: 'OK',
        type: 'info',
        onConfirm: hideConfirm
      })
      return
    }
    
    if (selectedVariant) {
      // 使用选中的变体
      onUse(style.id, selectedVariant.id)
    } else {
      // 使用默认风格
      onUse(style.id, null)
    }
  }
  
  // 检查是否可以使用
  const canUse = !requiresAuth || isAuthenticated


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
          
          {/* 变体标签区域 - 总是显示 */}
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
              {hasVariants && displayVariants.map((variant) => (
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
              
              {/* 更多按钮 */}
              {hasMoreVariants && (
                <button
                  className="variant-tag more-variants"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowVariantModal(true)
                  }}
                >
                  +{style.variants.length - 5} more
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* 固定在底部的按钮区域 */}
        <div className="style-card-bottom">
          <div className="style-card-actions">
            {/* 官方风格显示Use Style按钮 */}
            {isOfficial && (
              <button
                className="style-action-button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleUseStyle()
                }}
              >
                Use Style
              </button>
            )}

            {/* 社区风格只显示Add按钮，已添加时变灰色带打勾 */}
            {!isOfficial && (
              <button
                className={`style-action-button ${isAddedToList ? 'added disabled' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isAddedToList && canAddToList) {
                    onAddToMyList(style.id)
                  }
                }}
                disabled={isAddedToList || !canAddToList}
                title={
                  !canAddToList
                    ? 'Login required to add styles'
                    : isAddedToList
                      ? 'Already in your personal list'
                      : 'Add to your personal list'
                }
                style={{
                  backgroundColor: isAddedToList ? '#e0e0e0' : '',
                  color: isAddedToList ? '#666' : '',
                  cursor: isAddedToList ? 'default' : 'pointer'
                }}
              >
                {!canAddToList
                  ? 'Login Required'
                  : isAddedToList
                    ? '✓ Added'
                    : '+ Add to My List'
                }
              </button>
            )}
          </div>
          
        </div>
      </div>
      
      {/* 变体详情模态框 */}
      {showVariantModal && (
        <VariantModal
          style={style}
          onClose={() => setShowVariantModal(false)}
          onUse={onUse}
          onVariantAdded={onVariantAdded}
          requiresAuth={requiresAuth}
          showConfirm={showConfirm}
          hideConfirm={hideConfirm}
        />
      )}
    </>
  )
}

// 可拖拽的表格行组件
function SortableVariantRow({ variant, style, onUse, onClose, isDragDisabled, requiresAuth = false, showConfirm, hideConfirm }) {
  const { isAuthenticated } = useAuth() // 获取用户认证状态
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: variant.id,
    disabled: isDragDisabled // Default 行禁用拖拽
  })

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // 检查是否可以使用
  const canUse = !requiresAuth || isAuthenticated
  
  const handleUse = () => {
    if (requiresAuth && !isAuthenticated) {
      showConfirm({
        title: 'Login Required',
        message: 'Please login first to use community styles',
        confirmText: 'OK',
        type: 'info',
        onConfirm: hideConfirm
      })
      return
    }
    onUse(style.id, variant.id)
    onClose()
  }

  return (
    <tr 
      ref={setNodeRef} 
      style={dragStyle} 
      className={`variant-row ${isDragging ? 'dragging' : ''}`}
      {...attributes}
    >
      <td className="variant-col-name">
        <div className="variant-name-cell">
          {/* 拖拽手柄 */}
          {!isDragDisabled && (
            <span className="drag-handle" {...listeners}>
              ⋮⋮
            </span>
          )}
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
        <span className="usage-count">{variant.usageCount || 0}</span>
      </td>
      <td className="variant-col-action">
        <button
          className={`variant-table-use-button ${!canUse ? 'disabled' : ''}`}
          onClick={handleUse}
          disabled={!canUse}
          title={!canUse ? 'Login required to use community styles' : ''}
        >
          {!canUse ? 'Login Required' : 'Use'}
        </button>
      </td>
    </tr>
  )
}

// 变体详情模态框组件
function VariantModal({ style, onClose, onUse, onVariantAdded, requiresAuth = false, showConfirm, hideConfirm }) {
  const { isAuthenticated, userId } = useAuth()
  
  // 添加变体的表单状态
  const [isAddingVariant, setIsAddingVariant] = useState(false)
  const [newVariant, setNewVariant] = useState({
    name: '',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  // 初始化变体列表状态
  const [variants, setVariants] = useState(() => {
    // 合并默认风格和变体
    const defaultVariant = {
      id: 'default',
      name: 'Default',
      description: style.description,
      createdBy: style.createdBy === 'system' ? 'AI Disguise' : style.createdBy,
      usageCount: style.usageCount || 0,
      isDefault: true
    }
    
    const normalVariants = (style.variants || []).map(variant => ({
      ...variant,
      createdBy: variant.createdBy === 'system' ? 'AI Disguise' : variant.createdBy,
      isDefault: false
    }))

    // 变体去重，防止重复的variant ID
    const uniqueVariants = normalVariants.filter((variant, index, self) =>
      index === self.findIndex(v => v.id === variant.id)
    )

    // 按使用次数降序排序普通变体
    uniqueVariants.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))

    // Default 始终在顶部，其他按使用次数排序
    return [defaultVariant, ...uniqueVariants]
  })
  
  // 处理拖拽结束
  const handleDragEnd = (event) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    // 不允许拖拽 Default 变体
    if (active.id === 'default') {
      return
    }

    setVariants((items) => {
      const oldIndex = items.findIndex(item => item.id === active.id)
      const newIndex = items.findIndex(item => item.id === over.id)
      
      // 如果拖拽到 Default 位置，则不允许
      if (newIndex === 0) {
        return items
      }
      
      const newVariants = arrayMove(items, oldIndex, newIndex)
      
      // 直接更新父组件中的style.variants以同步新的顺序
      const reorderedVariants = newVariants
        .filter(v => !v.isDefault)
        .map(v => ({ ...v, isDefault: false }))
      
      // 更新style对象，这样关闭模态框后卡片会显示新的顺序
      style.variants = reorderedVariants
      
      return newVariants
    })
  }
  
  // 处理添加新变体
  const handleAddVariant = () => {
    if (!isAuthenticated) {
      showConfirm({
        title: 'Login Required',
        message: 'Please login first to add variants',
        confirmText: 'OK',
        type: 'info',
        onConfirm: hideConfirm
      })
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
      showConfirm({
        title: 'Missing Information',
        message: 'Please fill in variant name and description',
        confirmText: 'OK',
        type: 'warning',
        onConfirm: hideConfirm
      })
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
      showConfirm({
        title: 'Success',
        message: 'Variant added successfully!',
        confirmText: 'OK',
        type: 'success',
        onConfirm: hideConfirm
      })
      
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
      
      // 更新当前模态框的变体列表
      const newVariantForModal = {
        ...newVariantData,
        createdBy: newVariantData.createdBy === 'system' ? 'AI Disguise' : newVariantData.createdBy,
        isDefault: false
      }
      setVariants(prev => [...prev, newVariantForModal])
      
      // 重置表单状态
      setIsAddingVariant(false)  
      setNewVariant({ name: '', description: '' })
      
    } catch (error) {
      console.error('添加变体失败:', error)
      showConfirm({
        title: 'Error',
        message: 'Failed to add variant, please try again',
        confirmText: 'OK',
        type: 'danger',
        onConfirm: hideConfirm
      })
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
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className="variant-table">
                <thead>
                  <tr>
                    <th className="variant-col-name">Variant Name</th>
                    <th className="variant-col-description">Description</th>
                    <th className="variant-col-usage">Usage Count</th>
                    <th className="variant-col-action">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <SortableContext 
                    items={variants.map(v => v.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {variants.map((variant) => (
                      <SortableVariantRow
                        key={variant.id}
                        variant={variant}
                        style={style}
                        onUse={onUse}
                        onClose={onClose}
                        isDragDisabled={variant.isDefault}
                        requiresAuth={requiresAuth}
                        showConfirm={showConfirm}
                        hideConfirm={hideConfirm}
                      />
                    ))}
                  </SortableContext>
                
                {/* 添加新变体的行 */}
                {isAddingVariant ? (
                  <tr className="variant-row variant-add-row">
                    <td className="variant-col-name">
                      <input
                        type="text"
                        className="variant-input"
                        placeholder="Variant Name"
                        value={newVariant.name}
                        onChange={(e) => setNewVariant({...newVariant, name: e.target.value})}
                      />
                    </td>
                    <td className="variant-col-description">
                      <textarea
                        className="variant-textarea"
                        placeholder="Variant Description"
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
                      <span style={{ color: '#999', fontSize: '12px' }}>New Variant</span>
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
          </DndContext>
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