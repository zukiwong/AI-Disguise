// 历史记录搜索和筛选组件
// 提供搜索框、标签筛选、风格筛选等功能

import { useState, useMemo } from 'react'
import { CONVERSION_MODE } from '../../services/config.js'
import { useDisguise } from '../../hooks/useDisguise.js'

function HistoryFilters({
  searchQuery,
  filters,
  onSearchChange,
  onFiltersChange,
  historyRecords = []
}) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // 获取风格数据用于显示名称
  const { stylesWithVariants } = useDisguise()

  // 获取风格显示名称
  const getStyleDisplayName = (styleId) => {
    if (!stylesWithVariants || stylesWithVariants.length === 0) {
      return styleId || 'Custom Style'
    }

    const currentStyle = stylesWithVariants.find(style => style.id === styleId)
    if (currentStyle) {
      return currentStyle.displayName || currentStyle.name || 'Custom Style'
    }

    return styleId || 'Custom Style'
  }

  // 从历史记录中提取可用的筛选选项
  const availableOptions = useMemo(() => {
    const tags = new Set()
    const styles = new Set()
    const conversionModes = new Set()

    historyRecords.forEach(record => {
      // 收集标签
      if (record.tags) {
        record.tags.forEach(tag => tags.add(tag))
      }
      
      // 收集风格
      if (record.style) {
        styles.add(record.style)
      }
      
      // 收集转换模式
      if (record.conversionMode) {
        conversionModes.add(record.conversionMode)
      }
    })

    return {
      tags: Array.from(tags).sort(),
      styles: Array.from(styles).sort(),
      conversionModes: Array.from(conversionModes).sort()
    }
  }, [historyRecords])

  // 处理搜索输入
  const handleSearchChange = (event) => {
    onSearchChange(event.target.value)
  }

  // 清除搜索
  const clearSearch = () => {
    onSearchChange('')
  }

  // 处理标签筛选
  const handleTagToggle = (tag) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag]
    
    onFiltersChange({ ...filters, tags: newTags })
  }

  // 处理风格筛选
  const handleStyleChange = (event) => {
    onFiltersChange({ ...filters, style: event.target.value })
  }

  // 处理转换模式筛选
  const handleConversionModeChange = (event) => {
    onFiltersChange({ ...filters, conversionMode: event.target.value })
  }

  // 切换收藏筛选
  const handleFavoriteToggle = () => {
    onFiltersChange({ ...filters, favoriteOnly: !filters.favoriteOnly })
  }

  // 处理日期范围筛选
  const handleDateRangeChange = (range) => {
    let dateRange = null
    const now = new Date()
    
    switch (range) {
      case 'today':
        dateRange = {
          start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          end: now
        }
        break
      case 'week':
        dateRange = {
          start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: now
        }
        break
      case 'month':
        dateRange = {
          start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          end: now
        }
        break
      case 'clear':
      default:
        dateRange = null
        break
    }

    onFiltersChange({ ...filters, dateRange })
  }

  // 清除所有筛选
  const clearAllFilters = () => {
    onSearchChange('')
    onFiltersChange({
      tags: [],
      style: '',
      conversionMode: '',
      favoriteOnly: false,
      dateRange: null
    })
  }

  // 检查是否有激活的筛选
  const hasActiveFilters = searchQuery || 
    filters.tags.length > 0 || 
    filters.style || 
    filters.conversionMode || 
    filters.favoriteOnly || 
    filters.dateRange

  return (
    <div className="history-filters">
      {/* 搜索框 */}
      <div className="search-section">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search in original text, results, tags, or notes..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <button
              className="clear-search-button"
              onClick={clearSearch}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 快速筛选按钮 */}
      <div className="quick-filters">
        <button
          className={`filter-button ${filters.favoriteOnly ? 'active' : ''}`}
          onClick={handleFavoriteToggle}
        >
          ★ Favorites {filters.favoriteOnly && `(${historyRecords.filter(r => r.isFavorited).length})`}
        </button>

        <button
          className={`filter-button ${showAdvancedFilters ? 'active' : ''}`}
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          🔧 Filters {hasActiveFilters && '●'}
        </button>

        {hasActiveFilters && (
          <button
            className="filter-button clear"
            onClick={clearAllFilters}
          >
            Clear All
          </button>
        )}
      </div>

      {/* 高级筛选面板 */}
      {showAdvancedFilters && (
        <div className="advanced-filters">
          {/* 标签筛选 */}
          {availableOptions.tags.length > 0 && (
            <div className="filter-group">
              <h4 className="filter-group-title">Tags</h4>
              <div className="tag-filters">
                {availableOptions.tags.map(tag => (
                  <button
                    key={tag}
                    className={`tag-filter-button ${filters.tags.includes(tag) ? 'active' : ''}`}
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 风格筛选 */}
          {availableOptions.styles.length > 0 && (
            <div className="filter-group">
              <h4 className="filter-group-title">Style</h4>
              <select
                className="filter-select"
                value={filters.style}
                onChange={handleStyleChange}
              >
                <option value="">All Styles</option>
                {availableOptions.styles.map(style => (
                  <option key={style} value={style}>
                    {getStyleDisplayName(style)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 转换模式筛选 */}
          {availableOptions.conversionModes.length > 0 && (
            <div className="filter-group">
              <h4 className="filter-group-title">Mode</h4>
              <select
                className="filter-select"
                value={filters.conversionMode}
                onChange={handleConversionModeChange}
              >
                <option value="">All Modes</option>
                {availableOptions.conversionModes.map(mode => (
                  <option key={mode} value={mode}>
                    {mode === CONVERSION_MODE.STYLE ? 'Style Mode' : 
                     mode === CONVERSION_MODE.PURPOSE ? 'Purpose Mode' : mode}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 时间范围筛选 */}
          <div className="filter-group">
            <h4 className="filter-group-title">Time Range</h4>
            <div className="date-range-buttons">
              <button
                className={`date-button ${!filters.dateRange ? 'active' : ''}`}
                onClick={() => handleDateRangeChange('clear')}
              >
                All Time
              </button>
              <button
                className={`date-button ${filters.dateRange && 
                  new Date() - filters.dateRange.start < 24 * 60 * 60 * 1000 ? 'active' : ''}`}
                onClick={() => handleDateRangeChange('today')}
              >
                Today
              </button>
              <button
                className={`date-button ${filters.dateRange && 
                  new Date() - filters.dateRange.start < 7 * 24 * 60 * 60 * 1000 && 
                  new Date() - filters.dateRange.start >= 24 * 60 * 60 * 1000 ? 'active' : ''}`}
                onClick={() => handleDateRangeChange('week')}
              >
                This Week
              </button>
              <button
                className={`date-button ${filters.dateRange && 
                  new Date() - filters.dateRange.start < 30 * 24 * 60 * 60 * 1000 && 
                  new Date() - filters.dateRange.start >= 7 * 24 * 60 * 60 * 1000 ? 'active' : ''}`}
                onClick={() => handleDateRangeChange('month')}
              >
                This Month
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 激活的筛选摘要 */}
      {hasActiveFilters && (
        <div className="active-filters-summary">
          <span className="summary-label">Active filters:</span>
          <div className="active-filters-list">
            {searchQuery && (
              <span className="active-filter">
                Search: "{searchQuery}"
                <button onClick={clearSearch}>✕</button>
              </span>
            )}
            {filters.favoriteOnly && (
              <span className="active-filter">
                Favorites only
                <button onClick={handleFavoriteToggle}>✕</button>
              </span>
            )}
            {filters.tags.map(tag => (
              <span key={tag} className="active-filter">
                Tag: {tag}
                <button onClick={() => handleTagToggle(tag)}>✕</button>
              </span>
            ))}
            {filters.style && (
              <span className="active-filter">
                Style: {getStyleDisplayName(filters.style)}
                <button onClick={() => onFiltersChange({ ...filters, style: '' })}>✕</button>
              </span>
            )}
            {filters.conversionMode && (
              <span className="active-filter">
                Mode: {filters.conversionMode}
                <button onClick={() => onFiltersChange({ ...filters, conversionMode: '' })}>✕</button>
              </span>
            )}
            {filters.dateRange && (
              <span className="active-filter">
                Time range
                <button onClick={() => handleDateRangeChange('clear')}>✕</button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default HistoryFilters