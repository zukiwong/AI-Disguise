// Profile数据管理组件
// 提供数据导出、清理和同步功能

import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { useHistoryManager } from '../../hooks/useHistoryManager.js'
import { clearAllHistory } from '../../services/historyService.js'

// 导入图标
import ChartReportIcon from '../../assets/icons/chart-report.svg'
import DataPackIcon from '../../assets/icons/data-pack.svg'
import StarCollectionIcon from '../../assets/icons/star-collection.svg'

function ProfileData() {
  const { userId, userEmail } = useAuth()
  const { historyRecords, userTags, refresh } = useHistoryManager()
  
  // 状态管理
  const [isExporting, setIsExporting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState(new Date())

  // 占位符：个人报告导出
  const exportPersonalReport = async () => {
    setIsExporting(true)
    
    setTimeout(() => {
      setIsExporting(false)
      alert('Personal Report export feature is coming soon! This will include your usage statistics, achievements, and favorite transformations in a beautiful PDF format.')
    }, 1000)
  }

  // 占位符：智能数据包导出
  const exportSmartDataPack = async () => {
    setIsExporting(true)
    
    setTimeout(() => {
      setIsExporting(false)
      alert('Smart Data Pack export feature is coming soon! This will include your transformation history, personalized insights, and curated content recommendations.')
    }, 1000)
  }

  // 占位符：收藏集合导出
  const exportFavoriteCollection = async () => {
    setIsExporting(true)
    
    setTimeout(() => {
      setIsExporting(false)
      alert('Favorite Collection export feature is coming soon! This will create a beautifully formatted document with your best transformations and notes.')
    }, 1000)
  }

  // 清空所有历史记录
  const clearAllData = async () => {
    const confirmMessage = `Are you sure you want to delete ALL your history records?\n\nThis will permanently delete:\n• ${historyRecords.length} history records\n• All your tags and favorites\n\nThis action cannot be undone.`
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    // 二次确认
    const secondConfirm = window.prompt(
      'To confirm deletion, please type "DELETE ALL" (without quotes):'
    )
    
    if (secondConfirm !== 'DELETE ALL') {
      alert('Deletion cancelled. The text did not match.')
      return
    }

    setIsClearing(true)
    
    try {
      await clearAllHistory(userId)
      refresh() // 刷新数据
      alert('All history data has been successfully deleted.')
      
    } catch (error) {
      console.error('清空数据失败:', error)
      alert('Failed to clear data. Please try again.')
    } finally {
      setIsClearing(false)
    }
  }

  // 手动同步数据
  const syncData = async () => {
    try {
      refresh()
      setLastSyncTime(new Date())
      alert('Data synchronized successfully!')
    } catch (error) {
      console.error('同步数据失败:', error)
      alert('Failed to sync data. Please try again.')
    }
  }

  return (
    <div className="profile-data">
      {/* 数据概览 */}
      <div className="data-overview">
        <h3>Data Overview</h3>
        <div className="data-stats">
          <div className="data-stat">
            <div className="stat-number">{historyRecords.length}</div>
            <div className="stat-label">History Records</div>
          </div>
          <div className="data-stat">
            <div className="stat-number">{userTags.length}</div>
            <div className="stat-label">Custom Tags</div>
          </div>
          <div className="data-stat">
            <div className="stat-number">
              {historyRecords.filter(r => r.isFavorited).length}
            </div>
            <div className="stat-label">Favorites</div>
          </div>
        </div>
      </div>

      {/* 数据导出 */}
      <div className="data-section">
        <h3 className="data-section-title">Export Data</h3>
        <p className="data-section-description">
          Export your data in beautiful, user-friendly formats. Choose from personalized reports, 
          comprehensive data packs, or curated collections of your favorite content.
        </p>
        
        <div className="export-options-grid">
          <div className="export-option">
            <div className="export-icon">
              <img src={ChartReportIcon} alt="Report" className="export-icon-svg" />
            </div>
            <div className="export-content">
              <h4>Personal Report</h4>
              <p>Beautiful PDF with your usage stats, achievements, and insights</p>
              <div className="export-features">
                <span>• Usage analytics</span>
                <span>• Achievement showcase</span>
                <span>• Top transformations</span>
              </div>
            </div>
            <button
              className="action-button tertiary"
              onClick={exportPersonalReport}
              disabled={isExporting || historyRecords.length === 0}
            >
              {isExporting ? 'Generating...' : 'Generate Report'}
            </button>
          </div>

          <div className="export-option">
            <div className="export-icon">
              <img src={DataPackIcon} alt="Data Pack" className="export-icon-svg" />
            </div>
            <div className="export-content">
              <h4>Smart Data Pack</h4>
              <p>Comprehensive export with personalized insights and recommendations</p>
              <div className="export-features">
                <span>• Complete history</span>
                <span>• Personal insights</span>
                <span>• Usage patterns</span>
              </div>
            </div>
            <button
              className="action-button tertiary"
              onClick={exportSmartDataPack}
              disabled={isExporting || historyRecords.length === 0}
            >
              {isExporting ? 'Preparing...' : 'Download Pack'}
            </button>
          </div>

          <div className="export-option">
            <div className="export-icon">
              <img src={StarCollectionIcon} alt="Star Collection" className="export-icon-svg" />
            </div>
            <div className="export-content">
              <h4>Favorite Collection</h4>
              <p>Curated document featuring your starred transformations and notes</p>
              <div className="export-features">
                <span>• Favorited items</span>
                <span>• Personal notes</span>
                <span>• Clean formatting</span>
              </div>
            </div>
            <button
              className="action-button tertiary"
              onClick={exportFavoriteCollection}
              disabled={isExporting || historyRecords.filter(r => r.isFavorited).length === 0}
            >
              {isExporting ? 'Creating...' : 'Export Favorites'}
            </button>
          </div>
        </div>

        {historyRecords.length === 0 && (
          <div className="data-notice">
            <p>No data available to export. Start creating some text transformations to unlock these beautiful export options!</p>
          </div>
        )}
      </div>

      {/* 数据同步 */}
      <div className="data-section">
        <h3 className="data-section-title">Data Synchronization</h3>
        <p className="data-section-description">
          Your data is automatically synchronized with the cloud. 
          Use manual sync if you experience any issues.
        </p>
        
        <div className="sync-info">
          <div className="sync-status">
            <span className="sync-indicator">🟢</span>
            <span>Connected and synchronized</span>
          </div>
          <div className="sync-last">
            Last sync: {lastSyncTime.toLocaleString()}
          </div>
        </div>
        
        <div className="data-actions">
          <button
            className="action-button secondary"
            onClick={syncData}
          >
            Manual Sync
          </button>
        </div>
      </div>

      {/* 数据管理 */}
      <div className="data-section">
        <h3 className="data-section-title">Data Management</h3>
        <p className="data-section-description">
          Manage your stored data and storage usage.
        </p>
        
        <div className="storage-info">
          <div className="storage-item">
            <span className="storage-label">History Records:</span>
            <span className="storage-value">{historyRecords.length} items</span>
          </div>
          <div className="storage-item">
            <span className="storage-label">Estimated Size:</span>
            <span className="storage-value">
              {Math.round(JSON.stringify(historyRecords).length / 1024)} KB
            </span>
          </div>
          <div className="storage-item">
            <span className="storage-label">Storage Limit:</span>
            <span className="storage-value">1 MB per user</span>
          </div>
        </div>
      </div>

      {/* 危险区域 */}
      <div className="data-section danger-section">
        <h3 className="data-section-title">Danger Zone</h3>
        <p className="data-section-description">
          These actions are permanent and cannot be undone. Please proceed with caution.
        </p>
        
        <div className="danger-actions">
          <div className="danger-action">
            <div className="danger-action-info">
              <h4>Delete All History</h4>
              <p>Permanently delete all your history records, tags, and preferences. This action cannot be undone.</p>
            </div>
            <button
              className="danger-button"
              onClick={clearAllData}
              disabled={isClearing || historyRecords.length === 0}
            >
              {isClearing ? 'Deleting...' : 'Delete All Data'}
            </button>
          </div>
        </div>

        {historyRecords.length === 0 && (
          <div className="data-notice">
            <p>No data to delete.</p>
          </div>
        )}
      </div>

      {/* 数据隐私信息 */}
      <div className="data-section info-section">
        <h3 className="data-section-title">Data Privacy</h3>
        <div className="privacy-info">
          <ul>
            <li>Your data is stored securely and encrypted in transit</li>
            <li>Only you can access your personal history and preferences</li>
            <li>Shared content is public but doesn't include personal identifiers</li>
            <li>You can export or delete your data at any time</li>
            <li>We don't share your personal data with third parties</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ProfileData