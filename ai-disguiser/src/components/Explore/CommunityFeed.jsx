// 社区分享组件
// 展示用户分享的转换内容

import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import '../../styles/Explore.css'

function CommunityFeed() {
  const { isAuthenticated } = useAuth()
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState('recent') // 'recent', 'popular'

  // 模拟数据加载
  useEffect(() => {
    // TODO: 从 Firestore 加载真实的分享内容
    const mockPosts = [
      {
        id: '1',
        originalText: 'I need to finish this project by tomorrow.',
        transformedText: 'Ah, the delicate dance of deadlines approaches! Tomorrow\'s dawn shall witness the completion of this creative endeavor, a testament to dedication and artistry.',
        styleName: 'Poetic Style',
        authorId: 'user1',
        authorName: 'John Doe',
        authorAvatar: '',
        createdAt: new Date('2024-01-15T10:30:00'),
        likes: 12,
        isLiked: false
      },
      {
        id: '2',
        originalText: 'The weather is really nice today.',
        transformedText: 'Yo, the weather is absolutely FIRE today! Perfect vibes all around!',
        styleName: 'Social Style',
        authorId: 'user2',
        authorName: 'Jane Smith',
        authorAvatar: '',
        createdAt: new Date('2024-01-15T09:15:00'),
        likes: 8,
        isLiked: true
      }
    ]
    
    setTimeout(() => {
      setPosts(mockPosts)
      setIsLoading(false)
    }, 1000)
  }, [sortBy])

  const handleLike = (postId) => {
    if (!isAuthenticated) {
      // TODO: 显示登录提示
      console.log('需要登录才能点赞')
      return
    }

    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
        : post
    ))
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