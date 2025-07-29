// 风格市场组件
// 展示所有公共风格，支持搜索和分类

import { useState, useEffect } from 'react'
import { useStyles } from '../../hooks/useStyles.js'
import { useAuth } from '../../hooks/useAuth.js'
import '../../styles/Explore.css'

function StyleMarket() {
  const { publicStyles, isLoading } = useStyles()
  const { isAuthenticated } = useAuth()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [filteredStyles, setFilteredStyles] = useState([])

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

  const handleUseStyle = (styleId) => {
    // TODO: 集成到主页面，设置为当前选中的风格
    console.log('使用风格:', styleId)
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
            />
          ))}
        </div>
      )}
    </div>
  )
}

// 风格卡片组件
function StyleCard({ style, onUse, onFavorite, canFavorite }) {
  const isOfficial = style.createdBy === 'system'
  
  return (
    <div className="style-card">
      <div className="style-card-header">
        <h3 className="style-card-title">{style.displayName}</h3>
        <span className={`style-card-badge ${isOfficial ? 'official' : ''}`}>
          {isOfficial ? 'Official' : 'Community'}
        </span>
      </div>
      
      <p className="style-card-description">{style.description}</p>
      
      <div className="style-card-meta">
        <span>By {isOfficial ? 'AI Disguiser' : style.createdBy}</span>
        <span>{style.usageCount || 0} uses</span>
      </div>
      
      <div className="style-card-actions">
        <button
          className="style-action-button"
          onClick={() => onUse(style.id)}
        >
          Use Style
        </button>
        
        {canFavorite && (
          <button
            className="style-action-button secondary"
            onClick={() => onFavorite(style.id)}
          >
            Favorite
          </button>
        )}
      </div>
    </div>
  )
}

export default StyleMarket