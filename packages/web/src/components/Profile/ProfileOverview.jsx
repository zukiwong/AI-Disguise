// Profile概览组件
// 显示用户基本信息、使用统计和成就

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { useHistoryManager } from '../../hooks/useHistoryManager.js'
import { useDisguise } from '../../hooks/useDisguise.js'
import { getUserProfile } from '../../services/authService.js'
import { getPublicShares } from '../../services/shareService.js'
import { STYLE_CONFIG } from '../../services/config.js'

// 导入图标
import ChartIcon from '../../assets/icons/chart.svg'
import StarIcon from '../../assets/icons/star.svg'
import TagIcon from '../../assets/icons/tag.svg'
import ShareIcon from '../../assets/icons/share.svg'
import MaskIcon from '../../assets/icons/mask.svg'
import HandshakeIcon from '../../assets/icons/handshake.svg'
import HomeIcon from '../../assets/icons/home.svg'
import EditIcon from '../../assets/icons/edit.svg'
import ExploreIcon from '../../assets/icons/explore.svg'

function ProfileOverview() {
  const navigate = useNavigate()
  const { 
    userId, 
    userName, 
    userEmail, 
    userAvatar 
  } = useAuth()
  
  // 使用历史记录管理器获取统计数据
  const { historyRecords, userTags } = useHistoryManager()
  const { stylesWithVariants } = useDisguise()
  
  // 状态管理
  const [userProfile, setUserProfile] = useState(null)
  const [sharedPosts, setSharedPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // 加载用户详细资料
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!userId) return
      
      setIsLoading(true)
      try {
        const profileResult = await getUserProfile(userId)
        if (profileResult.success) {
          setUserProfile(profileResult.data)
        }
        
        // 加载用户的分享内容
        const shares = await getPublicShares(50)
        const userShares = shares.filter(share => share.authorId === userId)
        setSharedPosts(userShares)
        
      } catch (error) {
        console.error('加载用户资料失败:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserProfile()
  }, [userId])

  // 计算统计数据
  const getStats = () => {
    const totalRecords = historyRecords.length
    const favoriteRecords = historyRecords.filter(record => record.isFavorited).length
    const totalTags = userTags.length
    const totalShares = sharedPosts.length
    
    // 统计最常用的风格
    const styleUsage = {}
    historyRecords.forEach(record => {
      if (record.style) {
        styleUsage[record.style] = (styleUsage[record.style] || 0) + 1
      }
    })
    const styleKeys = Object.keys(styleUsage)
    const mostUsedStyleKey = styleKeys.length > 0 ? 
      styleKeys.reduce((a, b) => styleUsage[a] > styleUsage[b] ? a : b) : null
    
    // 根据 style ID 查找对应的 displayName
    let mostUsedStyle = null
    if (mostUsedStyleKey && stylesWithVariants.length > 0) {
      const currentStyle = stylesWithVariants.find(style => style.id === mostUsedStyleKey)
      mostUsedStyle = currentStyle ? (currentStyle.displayName || currentStyle.name || 'Custom Style') : mostUsedStyleKey
    } else if (mostUsedStyleKey) {
      // 回退到 STYLE_CONFIG 查找
      mostUsedStyle = STYLE_CONFIG[mostUsedStyleKey]?.displayName || mostUsedStyleKey
    }
    
    // 统计转换模式偏好
    const modeUsage = {}
    historyRecords.forEach(record => {
      if (record.conversionMode) {
        modeUsage[record.conversionMode] = (modeUsage[record.conversionMode] || 0) + 1
      }
    })
    
    // 计算活跃天数（近30天内有记录的天数）
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const activeDays = new Set()
    historyRecords.forEach(record => {
      const recordDate = new Date(record.createdAt)
      if (recordDate > thirtyDaysAgo) {
        const dayKey = recordDate.toDateString()
        activeDays.add(dayKey)
      }
    })

    return {
      totalRecords,
      favoriteRecords,
      totalTags,
      totalShares,
      mostUsedStyle,
      modeUsage,
      activeDaysCount: activeDays.size
    }
  }

  // 格式化时间显示
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown'
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  // 获取用户名首字母作为占位符
  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  // 获取成就徽章
  const getAchievements = (stats) => {
    const achievements = []
    
    if (stats.totalRecords >= 1) {
      achievements.push({ name: 'First Disguise', description: 'Created your first disguise', icon: <img src={MaskIcon} alt="Mask" className="achievement-icon-svg" /> })
    }
    if (stats.totalRecords >= 10) {
      achievements.push({ name: 'Active User', description: 'Created 10+ disguises', icon: '⭐' })
    }
    if (stats.totalRecords >= 50) {
      achievements.push({ name: 'Master Disguiser', description: 'Created 50+ disguises', icon: '🏆' })
    }
    if (stats.totalShares >= 1) {
      achievements.push({ name: 'Contributor', description: 'Shared content to community', icon: <img src={HandshakeIcon} alt="Handshake" className="achievement-icon-svg" /> })
    }
    if (stats.totalTags >= 5) {
      achievements.push({ name: 'Organizer', description: 'Created 5+ custom tags', icon: '🏷️' })
    }
    if (stats.activeDaysCount >= 7) {
      achievements.push({ name: 'Regular User', description: 'Active for 7+ days this month', icon: '📅' })
    }
    
    return achievements
  }

  if (isLoading) {
    return (
      <div className="profile-overview-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    )
  }

  const stats = getStats()
  const achievements = getAchievements(stats)

  return (
    <div className="profile-overview">
      {/* 用户基本信息卡片 */}
      <div className="profile-user-card">
        <div className="user-card-avatar">
          {userAvatar ? (
            <img 
              src={userAvatar} 
              alt={userName || 'User'} 
              className="user-card-image"
            />
          ) : (
            <div className="user-card-placeholder">
              {getInitials(userName || userEmail)}
            </div>
          )}
        </div>
        
        <div className="user-card-info">
          <h2 className="user-card-name">
            {userName || userEmail.split('@')[0]}
          </h2>
          <p className="user-card-email">{userEmail}</p>
          
          <div className="user-card-meta">
            <div className="meta-item">
              <span className="meta-label">Joined:</span>
              <span className="meta-value">
                {formatDate(userProfile?.createdAt)}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Last active:</span>
              <span className="meta-value">
                {formatDate(userProfile?.lastLoginAt)}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Provider:</span>
              <span className="meta-value">
                {userProfile?.provider === 'google.com' ? 'Google' : 
                 userProfile?.provider === 'github.com' ? 'GitHub' : 
                 userProfile?.provider || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 使用统计卡片组 */}
      <div className="profile-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <img src={ChartIcon} alt="Chart" className="icon-svg" />
          </div>
          <div className="stat-number">{stats.totalRecords}</div>
          <div className="stat-label">Total Disguises</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <img src={StarIcon} alt="Star" className="icon-svg" />
          </div>
          <div className="stat-number">{stats.favoriteRecords}</div>
          <div className="stat-label">Favorites</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <img src={TagIcon} alt="Tag" className="icon-svg" />
          </div>
          <div className="stat-number">{stats.totalTags}</div>
          <div className="stat-label">Custom Tags</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <img src={ShareIcon} alt="Share" className="icon-svg" />
          </div>
          <div className="stat-number">{stats.totalShares}</div>
          <div className="stat-label">Shared Posts</div>
        </div>
      </div>

      {/* 使用偏好分析 */}
      <div className="profile-preferences">
        <h3 className="preferences-title">Usage Preferences</h3>
        
        <div className="preferences-grid">
          <div className="preference-card">
            <h4>Most Used Style</h4>
            <div className="preference-value">
              {stats.mostUsedStyle || 'None yet'}
            </div>
          </div>
          
          <div className="preference-card">
            <h4>Conversion Modes</h4>
            <div className="mode-stats">
              {Object.entries(stats.modeUsage).map(([mode, count]) => (
                <div key={mode} className="mode-stat">
                  <span className="mode-name">
                    {mode === 'style' ? 'Style Mode' : 'Purpose Mode'}
                  </span>
                  <span className="mode-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="preference-card">
            <h4>Activity This Month</h4>
            <div className="preference-value">
              {stats.activeDaysCount} active days
            </div>
          </div>
        </div>
      </div>

      {/* 成就徽章 */}
      {achievements.length > 0 && (
        <div className="profile-achievements">
          <h3 className="achievements-title">Achievements</h3>
          <div className="achievements-grid">
            {achievements.map((achievement, index) => (
              <div key={index} className="achievement-badge">
                <div className="achievement-icon">{achievement.icon}</div>
                <div className="achievement-info">
                  <div className="achievement-name">{achievement.name}</div>
                  <div className="achievement-description">{achievement.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 快速操作 */}
      <div className="profile-quick-actions">
        <h3 className="quick-actions-title">Quick Actions</h3>
        <div className="quick-actions-grid">
          <button className="quick-action-button" onClick={() => navigate('/?openStyleManager=true')}>
            <span className="action-icon">
              <img src={HomeIcon} alt="Home" className="quick-action-icon-svg" />
            </span>
            <span className="action-label">Create New Style</span>
          </button>
          
          <button className="quick-action-button" onClick={() => navigate('/history')}>
            <span className="action-icon">
              <img src={EditIcon} alt="Edit" className="quick-action-icon-svg" />
            </span>
            <span className="action-label">View History</span>
          </button>
          
          <button className="quick-action-button" onClick={() => navigate('/explore')}>
            <span className="action-icon">
              <img src={ExploreIcon} alt="Explore" className="quick-action-icon-svg" />
            </span>
            <span className="action-label">Explore Community</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileOverview