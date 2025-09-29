// Profile内容管理组件
// 管理用户的风格、分享、收藏和标签库

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { useHistoryManager } from '../../hooks/useHistoryManager.js'
import { useStyles } from '../../hooks/useStyles.js'
import { getUserShares } from '../../services/shareService.js'

// 导入图标
import PaletteIcon from '../../assets/icons/palette.svg'
import UploadIcon from '../../assets/icons/upload.svg'
import BookmarkIcon from '../../assets/icons/bookmark.svg'
import LabelIcon from '../../assets/icons/label.svg'

function ProfileContent() {
  const navigate = useNavigate()
  const { userId } = useAuth()
  const { historyRecords, userTags } = useHistoryManager()
  const { styles } = useStyles(userId)
  
  // 状态管理
  const [activeTab, setActiveTab] = useState('styles')
  const [sharedPosts, setSharedPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // 加载用户分享内容
  useEffect(() => {
    const loadSharedContent = async () => {
      if (!userId) return
      
      setIsLoading(true)
      try {
        console.log('正在获取用户分享内容，userId:', userId) // 调试信息
        const shares = await getUserShares(userId)
        console.log('获取到的分享内容:', shares) // 调试信息
        setSharedPosts(shares)
      } catch (error) {
        console.error('加载分享内容失败:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSharedContent()
  }, [userId])

  // 获取收藏的历史记录
  const favoriteRecords = historyRecords.filter(record => record.isFavorited)

  // 根据风格ID获取风格显示名称
  const getStyleDisplayName = (styleId) => {
    if (!styleId) return 'Custom'

    const style = styles.find(s => s.id === styleId)
    return style ? style.displayName : styleId
  }

  // 获取用户私有风格
  const userStyles = styles.filter(style => style.createdBy === userId && !style.isPublic)

  // 标签页配置
  const tabs = [
    { id: 'styles', label: 'My Styles', count: userStyles.length },
    { id: 'shares', label: 'Shared Posts', count: sharedPosts.length },
    { id: 'favorites', label: 'Favorites', count: favoriteRecords.length },
    { id: 'tags', label: 'Tag Library', count: userTags.length }
  ]

  // 格式化时间显示
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown'
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diffInMs = now - date
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) {
      return 'Today'
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

  // 处理使用风格
  const handleUseStyle = (styleId) => {
    // 跳转到首页并预选该风格
    localStorage.setItem('preselectedStyle', styleId)
    navigate('/')
  }

  if (isLoading) {
    return (
      <div className="profile-content-loading">
        <div className="loading-spinner"></div>
        <p>Loading content...</p>
      </div>
    )
  }

  return (
    <div className="profile-content">
      {/* 标签页导航 */}
      <div className="content-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`content-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-label">{tab.label}</span>
            <span className="tab-count">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* 标签页内容 */}
      <div className="content-tab-content">
        {/* 我的风格 */}
        {activeTab === 'styles' && (
          <div className="content-section">
            <div className="section-header">
              <h3>My Custom Styles</h3>
            </div>
            
            {userStyles.length > 0 ? (
              <div className="styles-grid">
                {userStyles.map(style => (
                  <div key={style.id} className="style-card">
                    <div className="style-card-content">
                      <div className="style-card-header">
                        <h4 className="style-card-title">{style.displayName}</h4>
                        <span className="style-card-badge private">Private</span>
                      </div>
                      <p className="style-card-description">{style.description}</p>
                      <div className="style-card-meta">
                        <span>Created {formatDate(style.createdAt)}</span>
                      </div>
                    </div>
                    <div className="style-card-bottom">
                      <div className="style-card-actions">
                        <button
                          className="action-button primary"
                          onClick={() => handleUseStyle(style.id)}
                        >
                          Use
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <img src={PaletteIcon} alt="Palette" className="empty-state-icon-svg" />
                </div>
                <h4>No Custom Styles Yet</h4>
                <p>Create your own custom styles to personalize your text transformations.</p>
                <button 
                  className="empty-state-button"
                  onClick={() => navigate('/')}
                >
                  Create Your First Style
                </button>
              </div>
            )}
          </div>
        )}

        {/* 分享的帖子 */}
        {activeTab === 'shares' && (
          <div className="content-section">
            <div className="section-header">
              <h3>My Shared Posts</h3>
            </div>
            
            {sharedPosts.length > 0 ? (
              <div className="shares-list">
                {sharedPosts.map(post => (
                  <div key={post.id} className="share-card">
                    <div className="share-card-header">
                      <div className="share-meta">
                        <span className="share-style">
                          {post.styleInfo?.displayName || 'Custom'}
                        </span>
                        <span className="share-date">{formatDate(post.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="share-content">
                      <div className="share-text original">
                        <strong>Original:</strong>
                        <p>{post.originalText.length > 100 
                          ? `${post.originalText.substring(0, 100)}...`
                          : post.originalText
                        }</p>
                      </div>
                      <div className="share-text transformed">
                        <strong>Result:</strong>
                        <p>{post.transformedText.length > 100 
                          ? `${post.transformedText.substring(0, 100)}...`
                          : post.transformedText
                        }</p>
                      </div>
                    </div>
                    
                    <div className="share-actions">
                      <button 
                        className="action-button secondary"
                        onClick={() => navigate(`/explore?tab=community&highlight=${post.id}`)}
                      >
                        View in Community
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <img src={UploadIcon} alt="Upload" className="empty-state-icon-svg" />
                </div>
                <h4>No Shared Posts Yet</h4>
                <p>Share your best text transformations with the community to get feedback and inspire others.</p>
                <button 
                  className="empty-state-button"
                  onClick={() => navigate('/')}
                >
                  Create and Share
                </button>
              </div>
            )}
          </div>
        )}

        {/* 收藏的记录 */}
        {activeTab === 'favorites' && (
          <div className="content-section">
            <div className="section-header">
              <h3>Favorite Records</h3>
            </div>
            
            {favoriteRecords.length > 0 ? (
              <div className="favorites-list">
                {favoriteRecords.slice(0, 10).map(record => (
                  <div key={record.id} className="favorite-card">
                    <div className="favorite-header">
                      <span className="favorite-style">
                        {getStyleDisplayName(record.style)}
                      </span>
                      <span className="favorite-date">{formatDate(record.createdAt)}</span>
                    </div>
                    
                    <div className="favorite-content">
                      <div className="favorite-text">
                        <strong>Original:</strong>
                        <p>{record.original.length > 80 
                          ? `${record.original.substring(0, 80)}...`
                          : record.original
                        }</p>
                      </div>
                      <div className="favorite-text">
                        <strong>Result:</strong>
                        <p>{record.disguised.length > 80 
                          ? `${record.disguised.substring(0, 80)}...`
                          : record.disguised
                        }</p>
                      </div>
                    </div>
                    
                    {record.tags && record.tags.length > 0 && (
                      <div className="favorite-tags">
                        {record.tags.map((tag, index) => (
                          <span key={index} className="tag-badge">{tag}</span>
                        ))}
                      </div>
                    )}
                    
                    <div className="favorite-actions">
                      <button 
                        className="action-button primary"
                        onClick={() => navigate('/history')}
                      >
                        View in History
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <img src={BookmarkIcon} alt="Bookmark" className="empty-state-icon-svg" />
                </div>
                <h4>No Favorites Yet</h4>
                <p>Mark your best transformations as favorites to easily find them later.</p>
                <button 
                  className="empty-state-button"
                  onClick={() => navigate('/history')}
                >
                  Browse History
                </button>
              </div>
            )}
          </div>
        )}

        {/* 标签库 */}
        {activeTab === 'tags' && (
          <div className="content-section">
            <div className="section-header">
              <h3>My Tag Library</h3>
            </div>
            
            {userTags.length > 0 ? (
              <div className="tags-section">
                <div className="tags-grid">
                  {userTags.map((tag, index) => (
                    <div key={index} className="tag-library-item">
                      <span className="tag-name">{tag}</span>
                      <span className="tag-usage">
                        {historyRecords.filter(record => 
                          record.tags && record.tags.includes(tag)
                        ).length} uses
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="tags-stats">
                  <p>
                    You have created <strong>{userTags.length}</strong> custom tags
                    to organize your <strong>{historyRecords.length}</strong> records.
                  </p>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <img src={LabelIcon} alt="Label" className="empty-state-icon-svg" />
                </div>
                <h4>No Tags Yet</h4>
                <p>Create custom tags to organize and categorize your disguise history.</p>
                <button 
                  className="empty-state-button"
                  onClick={() => navigate('/history')}
                >
                  Start Tagging
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfileContent