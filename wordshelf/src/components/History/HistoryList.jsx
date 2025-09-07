// 历史记录列表组件
// 显示用户的伪装历史记录

import { useState, useMemo } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { useHistoryManager } from '../../hooks/useHistoryManager.js'
import { searchHistoryRecords } from '../../services/historyService.js'
import HistoryItem from './HistoryItem.jsx'
import HistoryFilters from './HistoryFilters.jsx'
import UnauthenticatedHistoryView from './UnauthenticatedHistoryView.jsx'
import EmptyHistoryView from './EmptyHistoryView.jsx'
import '../../styles/History.css'

function HistoryList() {
  // 用户认证信息
  const { isAuthenticated } = useAuth()
  
  // 历史记录管理
  const {
    historyRecords,
    userTags,
    isLoading,
    error,
    toggleFavorite,
    deleteRecord,
    reuseRecord,
    updateRecordTags
  } = useHistoryManager()
  
  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    tags: [],
    style: '',
    conversionMode: '',
    favoriteOnly: false,
    dateRange: null
  })
  
  // 分页和视图设置
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'card'

  // 搜索和筛选后的记录
  const filteredRecords = useMemo(() => {
    return searchHistoryRecords(historyRecords, searchQuery, filters)
  }, [historyRecords, searchQuery, filters])

  // 分页计算
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage)

  // 处理收藏切换
  const handleToggleFavorite = async (recordId) => {
    try {
      await toggleFavorite(recordId)
    } catch (err) {
      console.error('切换收藏状态失败:', err)
    }
  }

  // 处理删除记录
  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return
    }

    try {
      await deleteRecord(recordId)
    } catch (err) {
      console.error('删除记录失败:', err)
    }
  }

  // 处理重新使用
  const handleReuseRecord = async (recordId) => {
    try {
      await reuseRecord(recordId)
    } catch (err) {
      console.error('更新使用次数失败:', err)
    }
  }

  // 处理筛选变化
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1) // 重置到第一页
  }

  // 处理搜索查询变化
  const handleSearchChange = (query) => {
    setSearchQuery(query)
    setCurrentPage(1) // 重置到第一页
  }

  // 处理分页
  const handlePageChange = (page) => {
    setCurrentPage(page)
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 如果用户未登录，显示丰富的风格展示页面
  if (!isAuthenticated) {
    return <UnauthenticatedHistoryView />
  }

  // 检查是否应该显示WOW页面（用户没有历史记录且没有搜索/筛选）
  const shouldShowWowPage = !isLoading && 
    historyRecords.length === 0 && 
    !searchQuery && 
    !Object.values(filters).some(f => f && (Array.isArray(f) ? f.length > 0 : true))

  // 如果应该显示WOW页面，直接返回
  if (shouldShowWowPage) {
    return <EmptyHistoryView />
  }

  return (
    <div className="history-container">
      {/* 页面标题 */}
      <div className="history-header">
        <h1 className="history-title">History</h1>
        <p className="history-subtitle">
          Manage your disguise history records and find past transformations
        </p>
      </div>

      {/* 搜索和筛选 */}
      <HistoryFilters
        searchQuery={searchQuery}
        filters={filters}
        onSearchChange={handleSearchChange}
        onFiltersChange={handleFiltersChange}
        historyRecords={historyRecords}
      />

      {/* 视图切换和统计信息 */}
      <div className="history-controls">
        <div className="history-stats">
          <span className="stats-text">
            Showing {paginatedRecords.length} of {filteredRecords.length} records
            {filteredRecords.length !== historyRecords.length && 
              ` (filtered from ${historyRecords.length} total)`
            }
          </span>
        </div>
        
        <div className="view-controls">
          <button
            className={`view-toggle-button ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            ☰
          </button>
          <button
            className={`view-toggle-button ${viewMode === 'card' ? 'active' : ''}`}
            onClick={() => setViewMode('card')}
            title="Card View"
          >
            ⊞
          </button>
        </div>
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="history-error">
          <p>{error}</p>
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className="history-loading">
          <div className="loading-spinner"></div>
          <p>Loading history records...</p>
        </div>
      )}

      {/* 历史记录列表 */}
      {!isLoading && (
        <>
          {paginatedRecords.length > 0 ? (
            <div className={`history-list ${viewMode}-view`}>
              {paginatedRecords.map((record) => (
                <HistoryItem
                  key={record.id}
                  record={record}
                  viewMode={viewMode}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={handleDeleteRecord}
                  onReuse={handleReuseRecord}
                  onTagsUpdate={updateRecordTags}
                  userTags={userTags}
                />
              ))}
            </div>
          ) : (
            // 检查是否是搜索/筛选导致的空状态，还是用户真的没有历史记录
            searchQuery || Object.values(filters).some(f => f && (Array.isArray(f) ? f.length > 0 : true)) ? (
              // 搜索/筛选导致的空状态，显示简单的提示
              <div className="history-empty-state">
                <div className="empty-state-icon">🔍</div>
                <h3 className="empty-state-title">No Records Found</h3>
                <p className="empty-state-message">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
              </div>
            ) : (
              // 用户真的没有历史记录，显示WOW页面
              <EmptyHistoryView />
            )
          )}
        </>
      )}

      {/* 分页控件 */}
      {totalPages > 1 && (
        <div className="history-pagination">
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ‹ Previous
          </button>
          
          <div className="pagination-info">
            <span>Page {currentPage} of {totalPages}</span>
          </div>
          
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  )
}

export default HistoryList