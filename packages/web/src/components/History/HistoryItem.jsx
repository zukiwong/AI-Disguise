// 单个历史记录项组件
// 显示单条历史记录的详细信息和操作按钮

import { useState, useEffect, useRef } from 'react'
import { useDisguise } from '../../hooks/useDisguise.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useToast } from '../../hooks/useToast.js'
import TagManager from './TagManager.jsx'
import { gsap } from 'gsap'

// 导入图标
import CopyIcon from '../../assets/icons/copy.svg'
import StarCollectionIcon from '../../assets/icons/star-collection.svg'
import StarIcon from '../../assets/icons/star.svg'

function HistoryItem({ 
  record, 
  viewMode = 'list', 
  onToggleFavorite, 
  onDelete, 
  onReuse,
  onTagsUpdate,
  userTags = []
}) {
  // 双层展开状态管理
  const [isExpanded, setIsExpanded] = useState(false) // 整体展开状态（折叠显示结果 vs 展开显示原文）
  const [isResultTextExpanded, setIsResultTextExpanded] = useState(false) // 结果文本展开状态
  const [isOriginalTextExpanded, setIsOriginalTextExpanded] = useState(false) // 原文展开状态
  const [showTagManager, setShowTagManager] = useState(false)
  const [tagManagerRef, setTagManagerRef] = useState(null)
  
  // GSAP 动画引用
  const expandedContentRef = useRef(null)
  
  // 获取认证信息
  const { isAuthenticated, userId, userName, userEmail } = useAuth()

  // 获取伪装功能和风格数据
  const { copyToClipboard, stylesWithVariants } = useDisguise()

  // Toast 提示
  const { showToast } = useToast()

  // 格式化时间显示
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMs = now - date
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else if (diffInDays === 1) {
      return 'Yesterday'
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  // 获取转换模式显示文本
  const getConversionModeText = () => {
    // 添加安全检查
    if (!stylesWithVariants || stylesWithVariants.length === 0) {
      return 'Loading...'
    }

    const currentStyle = stylesWithVariants.find(style => style.id === record.style)

    if (currentStyle) {
      return currentStyle.displayName || currentStyle.name || 'Custom Style'
    } else {
      return 'Custom Style'
    }
  }

  // 获取风格显示名称
  const getStyleDisplayName = () => {
    // 添加安全检查
    if (!stylesWithVariants || stylesWithVariants.length === 0) {
      if (record.variant) {
        return `Custom Style (${record.variant})`
      }
      return 'Custom Style'
    }
    
    // 查找风格的displayName
    const currentStyle = stylesWithVariants.find(style => style.id === record.style)
    if (currentStyle) {
      const styleDisplayName = currentStyle.displayName || currentStyle.name || 'Custom Style'
      
      if (record.variant) {
        // 查找变体的名称
        const variant = currentStyle.variants?.find(v => v.id === record.variant)
        const variantName = variant?.name || record.variant
        return `${styleDisplayName} (${variantName})`
      }
      
      return styleDisplayName
    } else {
      // 找不到对应风格时，显示友好的占位文本
      if (record.variant) {
        return `Custom Style (${record.variant})`
      }
      return 'Custom Style'
    }
  }

  // 获取变体显示名称
  const getVariantDisplayName = () => {
    if (!record.variant) return ''
    
    // 添加安全检查
    if (!stylesWithVariants || stylesWithVariants.length === 0) {
      return record.variant
    }
    
    // 查找风格和变体的名称
    const currentStyle = stylesWithVariants.find(style => style.id === record.style)
    const variant = currentStyle?.variants?.find(v => v.id === record.variant)
    return variant?.name || record.variant
  }

  // 复制原文
  const handleCopyOriginal = async () => {
    const success = await copyToClipboard(record.original)
    if (success) {
      showToast('Copied')
    } else {
      showToast('Copy failed')
    }
  }

  // 复制结果
  const handleCopyResult = async () => {
    const success = await copyToClipboard(record.disguised)
    if (success) {
      showToast('Copied')
    } else {
      showToast('Copy failed')
    }
  }

  // 再次使用（重新生成）
  const handleReuse = () => {
    // 这里需要导航到首页并填入相同的参数
    // 暂时简化处理
    onReuse(record.id)
    
    // TODO: 导航到首页并预填充表单
    // 可以使用 localStorage 或 React Router 的 state 传递数据
    localStorage.setItem('prefillFromHistory', JSON.stringify({
      inputText: record.original,
      conversionMode: record.conversionMode,
      style: record.style,
      variant: record.variant,
      purpose: record.purpose,
      recipient: record.recipient,
      outputLanguage: record.outputLanguage
    }))
    
    // 导航到首页
    window.location.href = '/'
  }

  // 分享到Explore
  const handleShareToExplore = async () => {
    // 使用createShare服务直接分享
    const { createShare } = await import('../../services/shareService.js')
    
    try {
      // 检查认证状态
      if (!isAuthenticated) {
        alert('Please log in to share content.')
        return
      }

      // 准备分享数据
      const shareData = {
        originalText: record.original,
        transformedText: record.disguised,
        conversionMode: record.conversionMode,
        authorId: userId,
        authorName: userName || userEmail.split('@')[0],
        outputLanguage: record.outputLanguage,
        detectedLanguage: record.detectedLanguage,
        isPublic: true
      }

      // 根据转换模式添加相应信息
      if (record.conversionMode === 'style') {
        shareData.styleInfo = {
          id: record.style,
          name: record.style,
          displayName: getStyleDisplayName(),
          description: ''
        }
        if (record.variant) {
          shareData.variantInfo = {
            id: record.variant,
            name: record.variant,
            description: ''
          }
        }
      } else if (record.conversionMode === 'purpose') {
        shareData.purposeInfo = { name: record.purpose }
        shareData.recipientInfo = { name: record.recipient }
      }

      await createShare(shareData)
      alert('Content shared successfully!')
      
    } catch (error) {
      console.error('分享失败:', error)
      alert('Failed to share content. Please try again.')
    }
  }

  // 切换收藏状态
  const handleToggleFavorite = () => {
    onToggleFavorite(record.id)
  }

  // 删除记录
  const handleDelete = () => {
    onDelete(record.id)
  }

  // 可展开文本组件
  const ExpandableText = ({ text, isExpanded, onToggle, label, copyHandler, maxLength = 150 }) => {
    const shouldTruncate = text.length > maxLength
    const displayText = isExpanded || !shouldTruncate ? text : `${text.substring(0, maxLength)}...`
    
    return (
      <div className="expandable-text-section">
        <div className="content-header">
          <h4>{label}</h4>
          <button 
            className="copy-button"
            onClick={(e) => {
              e.stopPropagation()
              copyHandler()
            }}
            title={`Copy ${label.toLowerCase()}`}
          >
            <img src={CopyIcon} alt="Copy" className="copy-icon-svg" />
          </button>
        </div>
        <div 
          className={`expandable-text-content ${isExpanded ? 'expanded' : 'collapsed'}`}
          onClick={(e) => {
            e.stopPropagation()
            if (shouldTruncate) {
              onToggle()
            }
          }}
          style={{ cursor: shouldTruncate ? 'pointer' : 'default' }}
        >
          {displayText}
          {shouldTruncate && (
            <span className="expand-hint">
              {isExpanded ? ' (click to collapse)' : ' (click to expand)'}
            </span>
          )}
        </div>
      </div>
    )
  }

  // 处理整个卡片点击展开/折叠
  const handleCardClick = (e) => {
    // 检查点击的是否是交互元素，如果是则不处理
    const clickedElement = e.target
    const isInteractiveElement = 
      clickedElement.closest('.favorite-button') ||
      clickedElement.closest('.copy-button') ||
      clickedElement.closest('.action-button') ||
      clickedElement.closest('.manage-tags-button') ||
      clickedElement.closest('.expandable-text-content') ||
      clickedElement.closest('.tag-management')
    
    if (!isInteractiveElement) {
      setIsExpanded(!isExpanded)
    }
  }

  // GSAP 展开/折叠动画效果
  useEffect(() => {
    const expandedContent = expandedContentRef.current
    
    if (expandedContent) {
      if (isExpanded) {
        // 展开动画
        gsap.set(expandedContent, {
          height: 'auto',
          opacity: 0,
          y: -20
        })
        
        const expandedHeight = expandedContent.offsetHeight
        gsap.set(expandedContent, { height: 0 })
        
        gsap.to(expandedContent, {
          height: expandedHeight,
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "power2.out"
        })
      } else {
        // 折叠动画
        gsap.to(expandedContent, {
          height: 0,
          opacity: 0,
          y: -20,
          duration: 0.3,
          ease: "power2.in"
        })
      }
    }
  }, [isExpanded])

  // 监听TagManager显示状态变化，重新调整容器高度
  useEffect(() => {
    const expandedContent = expandedContentRef.current
    
    if (expandedContent && isExpanded) {
      // 添加小延时确保TagManager完全渲染
      const timer = setTimeout(() => {
        // 重新计算高度
        gsap.set(expandedContent, { height: 'auto' })
        const newHeight = expandedContent.offsetHeight
        
        // 平滑过渡到新高度
        gsap.to(expandedContent, {
          height: newHeight,
          duration: 0.3,
          ease: "power2.out"
        })
      }, 50) // 50ms延时确保DOM完全更新
      
      return () => clearTimeout(timer)
    }
  }, [showTagManager, isExpanded])

  return (
    <div 
      className={`history-item ${viewMode}-view ${isExpanded ? 'expanded' : ''}`}
      onClick={handleCardClick}
    >
      {/* 记录头部 */}
      <div className="history-item-header">
        <div className="header-main">
          <div className="conversion-info">
            <span className="conversion-mode">{getConversionModeText()}</span>
            {record.variant && (
              <span className="variant-badge">{getVariantDisplayName()}</span>
            )}
          </div>
          <div className="timestamp">
            {formatTimestamp(record.createdAt)}
          </div>
        </div>
        
        <div className="header-actions">
          {/* 收藏按钮 */}
          <button
            className={`favorite-button ${record.isFavorited ? 'favorited' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              handleToggleFavorite()
            }}
            title={record.isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            {record.isFavorited ? (
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="star-collection-icon favorited">
                <g clipPath="url(#clip0_41_106)">
                  <path d="M30.9375 12.4112C30.6785 11.6819 30.0089 11.151 29.2052 11.0352L21.3728 9.90819L17.9686 3.06873C17.6122 2.35044 16.8434 1.89209 16.0002 1.89209C15.1588 1.89209 14.39 2.35044 14.0327 3.06873L10.6286 9.90819L2.79621 11.0352C1.98975 11.151 1.3238 11.6819 1.06384 12.4112C0.803893 13.1406 1.00139 13.9433 1.56997 14.4908L7.30809 20.0369L5.97712 27.7288C5.84304 28.5031 6.19023 29.2802 6.86813 29.7349C7.24381 29.982 7.68288 30.1078 8.12101 30.1078C8.48202 30.1078 8.84484 30.0224 9.17089 29.8552L16.0003 26.408L22.8296 29.8552C23.1567 30.0224 23.5204 30.1078 23.8804 30.1078C24.3186 30.1078 24.7586 29.9819 25.1342 29.7349C25.8112 29.2802 26.1584 28.5031 26.0215 27.7288L24.6924 20.0369L30.4324 14.4908C31.001 13.9434 31.1938 13.1406 30.9375 12.4112Z" fill="#2E7D32"/>
                </g>
                <defs>
                  <clipPath id="clip0_41_106">
                    <rect width="32" height="32" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
            ) : (
              <img
                src={StarCollectionIcon}
                alt="Add to favorites"
                className="star-collection-icon"
              />
            )}
          </button>
          
        </div>
      </div>

      {/* 基础内容：始终显示转换结果和标签 */}
      <div className="base-content">
        <ExpandableText
          text={record.disguised}
          isExpanded={isResultTextExpanded}
          onToggle={() => setIsResultTextExpanded(!isResultTextExpanded)}
          label="Transformed Result"
          copyHandler={handleCopyResult}
          maxLength={150}
        />
        
        {/* 标签显示 */}
        {record.tags && record.tags.length > 0 && (
          <div className="tags-preview">
            {record.tags.map((tag, index) => (
              <span key={index} className="tag-item">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 展开内容：只包含新增的原文和详细信息 - 用GSAP控制显示 */}
      <div ref={expandedContentRef} className="additional-content" style={{ height: 0, opacity: 0, overflow: 'hidden' }}>
        {/* 原始文本 */}
        <ExpandableText
          text={record.original}
          isExpanded={isOriginalTextExpanded}
          onToggle={() => setIsOriginalTextExpanded(!isOriginalTextExpanded)}
          label="Original Input"
          copyHandler={handleCopyOriginal}
          maxLength={150}
        />

        {/* 技术详情 */}
        <div className="record-metadata">
          <h4>Technical Details</h4>
          <div className="metadata-row">
            <span className="metadata-label">Mode:</span>
            <span className="metadata-value">{record.conversionMode}</span>
          </div>
          
          {record.style && (
            <div className="metadata-row">
              <span className="metadata-label">Style:</span>
              <span className="metadata-value">{getStyleDisplayName()}</span>
            </div>
          )}
          
          
          <div className="metadata-row">
            <span className="metadata-label">Language:</span>
            <span className="metadata-value">
              {record.detectedLanguage} → {record.outputLanguage}
            </span>
          </div>

          <div className="metadata-row">
            <span className="metadata-label">Created:</span>
            <span className="metadata-value">
              {new Date(record.createdAt).toLocaleString()}
            </span>
          </div>
          
          {record.usageCount > 0 && (
            <div className="metadata-row">
              <span className="metadata-label">Used:</span>
              <span className="metadata-value">{record.usageCount} times</span>
            </div>
          )}
        </div>

        {/* 标签管理 */}
        <div className="tag-management">
          <div className="tags-header">
            <h4>Tags</h4>
            <button
              className="manage-tags-button"
              onClick={async () => {
                if (showTagManager) {
                  // 点击 Done 时，先保存未保存的更改
                  if (tagManagerRef && typeof tagManagerRef.saveIfHasChanges === 'function') {
                    await tagManagerRef.saveIfHasChanges()
                  }
                }
                setShowTagManager(!showTagManager)
              }}
            >
              {showTagManager ? 'Done' : '+ Add Tags'}
            </button>
          </div>
          
          {record.tags && record.tags.length > 0 && (
            <div className="current-tags">
              {record.tags.map((tag, index) => (
                <span key={index} className="tag-item">
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {showTagManager && (
            <TagManager
              ref={setTagManagerRef}
              recordId={record.id}
              currentTags={record.tags || []}
              userTags={userTags}
              onTagsUpdate={async (newTags) => {
                try {
                  await onTagsUpdate(record.id, newTags)
                  setShowTagManager(false)
                } catch (error) {
                  console.error('更新标签失败:', error)
                }
              }}
            />
          )}
        </div>

        {/* 操作按钮 */}
        <div className="record-actions">
          <button
            className="action-button primary"
            onClick={handleReuse}
            title="Use this configuration again"
          >
            Reuse
          </button>
          
          <button
            className="action-button secondary"
            onClick={handleShareToExplore}
            title="Share to Explore page"
          >
            Share
          </button>
          
          <button
            className="action-button danger"
            onClick={handleDelete}
            title="Delete this record"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default HistoryItem