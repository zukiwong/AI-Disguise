// 社区分享组件
// 展示用户分享的转换内容

import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { getPublicShares, toggleLike } from '../../services/shareService.js'
import '../../styles/Explore.css'

function CommunityFeed() {
  const { isAuthenticated, userId } = useAuth()
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState('recent') // 'recent', 'popular'

  // 从 Firestore 加载真实的分享内容
  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true)
      try {
        const shares = await getPublicShares(20)
        
        // 转换数据格式以匹配组件期望的结构
        const transformedPosts = shares.map(share => ({
          id: share.id,
          originalText: share.originalText,
          transformedText: share.transformedText,
          styleName: getStyleDisplayName(share),
          authorId: share.authorId,
          authorName: share.authorName,
          authorAvatar: '',
          createdAt: share.createdAt?.toDate ? share.createdAt.toDate() : new Date(share.createdAt),
          likes: share.likes || 0,
          isLiked: share.likedBy ? share.likedBy.includes(userId) : false,
          conversionMode: share.conversionMode
        }))

        // 根据排序方式排序
        const sortedPosts = sortBy === 'popular' 
          ? transformedPosts.sort((a, b) => b.likes - a.likes)
          : transformedPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

        setPosts(sortedPosts)
      } catch (error) {
        console.error('加载分享内容失败:', error)
        setPosts([])
      } finally {
        setIsLoading(false)
      }
    }

    loadPosts()
  }, [sortBy, userId])

  // 获取风格显示名称的辅助函数
  const getStyleDisplayName = (share) => {
    if (share.conversionMode === 'style' || share.conversionMode === 'custom_style') {
      return share.styleInfo?.displayName || share.styleInfo?.name || 'Unknown Style'
    } else if (share.conversionMode === 'purpose') {
      const purpose = share.purposeInfo?.displayName || 'Unknown Purpose'
      const recipient = share.recipientInfo?.displayName || 'Unknown Recipient'
      return `${purpose} → ${recipient}`
    }
    return 'Text Transformation'
  }

  const handleLike = async (postId) => {
    if (!isAuthenticated) {
      console.log('需要登录才能点赞')
      return
    }

    try {
      // 乐观更新 UI
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1
            }
          : post
      ))

      // 调用 Firestore 更新
      await toggleLike(postId, userId)
    } catch (error) {
      console.error('点赞操作失败:', error)
      
      // 如果操作失败，回滚 UI 更新
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes + 1 : post.likes - 1
            }
          : post
      ))
    }
  }

  const handleShare = (postId) => {
    // TODO: 实现分享功能
    console.log('分享内容:', postId)
  }

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading community posts...</p>
      </div>
    )
  }

  return (
    <div className="community-feed">
      {/* 排序选项 */}
      <div className="explore-filters">
        <select
          className="filter-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="recent">Most Recent</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>

      {/* 分享内容列表 */}
      {posts.length === 0 ? (
        <div className="empty-state">
          <h3 className="empty-state-title">No posts yet</h3>
          <p className="empty-state-message">
            Be the first to share your text transformations with the community!
          </p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={handleLike}
            onShare={handleShare}
            canInteract={isAuthenticated}
          />
        ))
      )}
    </div>
  )
}

// 分享内容卡片组件
function PostCard({ post, onLike, onShare, canInteract }) {
  const formatDate = (date) => {
    const now = new Date()
    const diffMs = now - date
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `${diffDays}d ago`
    } else if (diffHours > 0) {
      return `${diffHours}h ago`
    } else {
      return 'Just now'
    }
  }

  const getAuthorInitials = (name) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase()
  }

  return (
    <div className="post-card">
      <div className="post-card-header">
        <div className="post-author">
          <div className="post-author-avatar">
            {getAuthorInitials(post.authorName)}
          </div>
          <div className="post-author-info">
            <div className="post-author-name">{post.authorName}</div>
            <div className="post-date">{formatDate(post.createdAt)}</div>
          </div>
        </div>
        
        <div className="post-style-tag">{post.styleName}</div>
      </div>

      <div className="post-content">
        <div className="post-content-label">Original:</div>
        <div className="post-text original">{post.originalText}</div>
        
        <div className="post-content-label">Transformed:</div>
        <div className="post-text transformed">{post.transformedText}</div>
      </div>

      <div className="post-actions">
        <button
          className={`post-action-button ${post.isLiked ? 'liked' : ''}`}
          onClick={() => onLike(post.id)}
          disabled={!canInteract}
        >
          <HeartIcon filled={post.isLiked} />
          {post.likes}
        </button>
        
        <button
          className="post-action-button"
          onClick={() => onShare(post.id)}
        >
          <ShareIcon />
          Share
        </button>
      </div>
    </div>
  )
}

// 简单的心形图标
function HeartIcon({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  )
}

// 简单的分享图标
function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3"></circle>
      <circle cx="6" cy="12" r="3"></circle>
      <circle cx="18" cy="19" r="3"></circle>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
    </svg>
  )
}

export default CommunityFeed