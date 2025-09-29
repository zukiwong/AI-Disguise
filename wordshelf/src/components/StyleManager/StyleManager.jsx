// 风格管理器主组件
// 整合风格列表、编辑器和各种操作

import { useState, useEffect } from 'react'
import { useStyles } from '../../hooks/useStyles.js'
import { useAuth } from '../../hooks/useAuth.js'
import { LoginPrompt } from '../Auth/index.js'
import StyleEditor from './StyleEditor.jsx'
import { getPublicStylesForExplore } from '../../services/styleService.js'
import eventBus, { EVENTS } from '../../utils/eventBus.js'
import '../../styles/StyleManager.css'
import '../../styles/Modal.css'

function StyleManager({ onClose }) {
  const { isAuthenticated, userId } = useAuth()
  const {
    styles,
    publicStyles,
    userStyles,
    isLoading,
    error,
    handleCreateStyle,
    handleUpdateStyle,
    handleDeleteStyle,
    handleCopyStyle,
    getStyleById,
    clearError,
    addPublicStyleToAccount,
    removePublicStyleFromAccount,
    silentReloadStyles
  } = useStyles(userId)

  // 组件状态
  const [showEditor, setShowEditor] = useState(false)
  const [editingStyle, setEditingStyle] = useState(null)
  const [activeTab, setActiveTab] = useState('all') // 'all', 'public', 'private'
  
  // 三种不同的搜索状态
  const [allTabSearchTerm, setAllTabSearchTerm] = useState('') // 社区公共库搜索
  const [publicTabSearchTerm, setPublicTabSearchTerm] = useState('') // 账户公共风格搜索  
  const [privateTabSearchTerm, setPrivateTabSearchTerm] = useState('') // 账户私人风格搜索
  
  // 搜索结果状态
  const [communitySearchResults, setCommunitySearchResults] = useState([]) // 社区搜索结果
  const [filteredPublicStyles, setFilteredPublicStyles] = useState([]) // 过滤的账户公共风格
  const [filteredPrivateStyles, setFilteredPrivateStyles] = useState([]) // 过滤的账户私人风格
  const [allPublicStyles, setAllPublicStyles] = useState([]) // 用于搜索的完整公共风格库
  
  // 添加风格状态追踪
  const [addingStyleIds, setAddingStyleIds] = useState(new Set())
  // 移除风格状态追踪
  const [removingStyleIds, setRemovingStyleIds] = useState(new Set())

  // 加载完整的公共风格库用于搜索
  useEffect(() => {
    const loadAllPublicStyles = async () => {
      try {
        const allStyles = await getPublicStylesForExplore(userId)
        setAllPublicStyles(allStyles)
      } catch (error) {
        console.error('加载搜索用公共风格失败:', error)
      }
    }

    loadAllPublicStyles()
  }, [userId])

  // All Tab社区搜索逻辑
  useEffect(() => {
    if (allTabSearchTerm && allPublicStyles.length > 0) {
      // 从完整公共库中搜索，但不排除已添加的风格，让组件自己判断显示状态
      const filtered = allPublicStyles.filter(style =>
        style.displayName.toLowerCase().includes(allTabSearchTerm.toLowerCase()) ||
        style.description.toLowerCase().includes(allTabSearchTerm.toLowerCase())
      )
      
      setCommunitySearchResults(filtered)
    } else {
      setCommunitySearchResults([])
    }
  }, [allPublicStyles, allTabSearchTerm])

  // Public Tab账户内搜索逻辑
  useEffect(() => {
    if (publicTabSearchTerm) {
      const filtered = publicStyles.filter(style =>
        style.displayName.toLowerCase().includes(publicTabSearchTerm.toLowerCase()) ||
        style.description.toLowerCase().includes(publicTabSearchTerm.toLowerCase())
      )
      setFilteredPublicStyles(filtered)
    } else {
      setFilteredPublicStyles([])
    }
  }, [publicStyles, publicTabSearchTerm])

  // My Styles Tab账户内搜索逻辑
  useEffect(() => {
    if (privateTabSearchTerm) {
      const filtered = userStyles.filter(style =>
        style.displayName.toLowerCase().includes(privateTabSearchTerm.toLowerCase()) ||
        style.description.toLowerCase().includes(privateTabSearchTerm.toLowerCase())
      )
      setFilteredPrivateStyles(filtered)
    } else {
      setFilteredPrivateStyles([])
    }
  }, [userStyles, privateTabSearchTerm])

  // 获取当前显示的风格列表
  const getCurrentStyles = () => {
    switch (activeTab) {
      case 'public':
        // Public Tab: 如有搜索则显示过滤结果，否则显示全部账户公共风格
        return publicTabSearchTerm ? filteredPublicStyles : publicStyles
      case 'private':
        // Private Tab: 如有搜索则显示过滤结果，否则显示全部账户私人风格
        return privateTabSearchTerm ? filteredPrivateStyles : userStyles
      default:
        // All Tab: 只显示用户账户中的风格（不包括社区搜索结果）
        return styles
    }
  }

  // 获取社区搜索结果（仅用于All Tab）
  const getCommunitySearchResults = () => {
    return allTabSearchTerm ? communitySearchResults : []
  }

  // 创建新风格
  const handleCreateNew = () => {
    setEditingStyle(null)
    setShowEditor(true)
  }

  // 编辑风格
  const handleEditStyle = (styleId) => {
    const style = getStyleById(styleId)
    setEditingStyle(style)
    setShowEditor(true)
  }

  // 保存风格
  const handleSaveStyle = async (styleData) => {
    try {
      if (editingStyle) {
        // 更新现有风格
        await handleUpdateStyle(editingStyle.id, styleData)
      } else {
        // 创建新风格
        await handleCreateStyle(styleData)
      }
      
      setShowEditor(false)
      setEditingStyle(null)

      // 使用静默刷新，避免重新加载，延长时间确保Firebase同步
      setTimeout(() => silentReloadStyles(), 3000)
    } catch (error) {
      console.error('保存风格失败:', error)
    }
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setShowEditor(false)
    setEditingStyle(null)
  }

  // 删除风格
  const handleDelete = async (styleId) => {
    if (!window.confirm('Are you sure you want to delete this style?')) {
      return
    }
    
    try {
      await handleDeleteStyle(styleId)

      // 使用静默刷新，避免重新加载，延长时间确保Firebase同步
      setTimeout(() => silentReloadStyles(), 3000)
    } catch (error) {
      console.error('删除风格失败:', error)
    }
  }


  // 可删除的风格判断（只有用户创建的私有风格可以删除）
  // const canDelete = (style) => {
  //   return style.createdBy === userId && !style.isPublic
  // }

  // 可编辑的风格判断（只有用户创建的私有风格可以编辑）
  // const canEdit = (style) => {
  //   return style.createdBy === userId && !style.isPublic
  // }

  // 检查风格是否已添加到用户账户
  const isStyleAdded = (styleId) => {
    // 优先检查实际显示的数据源：publicStyles和userStyles
    const isInPublicStyles = publicStyles.some(s => s.id === styleId)
    const isInUserStyles = userStyles.some(s => s.id === styleId)
    const isInAllStyles = styles.some(s => s.id === styleId)
    
    // 如果在任何显示列表中找到，就认为已添加
    return isInPublicStyles || isInUserStyles || isInAllStyles
  }

  // 将公共风格添加到账户
  const handleAddToAccount = async (styleId) => {
    if (!isAuthenticated) {
      alert('请先登录后再操作')
      return
    }

    // 防止重复点击
    if (addingStyleIds.has(styleId)) {
      return
    }

    try {
      // 添加到进行中状态
      setAddingStyleIds(prev => new Set([...prev, styleId]))

      // 使用专门的公共风格添加方法
      const result = await addPublicStyleToAccount(styleId)
      
      if (result) {
        // 短暂显示成功状态后移除
        setTimeout(() => {
          setAddingStyleIds(prev => {
            const newSet = new Set(prev)
            newSet.delete(styleId)
            return newSet
          })
        }, 2000)
      } else {
        // 移除进行中状态
        setAddingStyleIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(styleId)
          return newSet
        })
      }
    } catch (error) {
      console.error('添加风格到账户失败:', error)
      
      // 移除进行中状态
      setAddingStyleIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(styleId)
        return newSet
      })
    }
  }

  // 复制公共风格到私人
  const handleCopyToPrivate = async (styleId) => {
    if (!isAuthenticated) {
      alert('请先登录后再操作')
      return
    }

    try {
      const result = await handleCopyStyle(styleId)
      // handleCopyStyle已经实现乐观更新，无需额外操作
      if (result) {
        console.log('风格复制成功')
        // 复制成功后跳转到My Styles标签页
        setActiveTab('private')
      }
    } catch (error) {
      console.error('复制风格失败:', error)
    }
  }

  // 从账户移除公共风格
  const handleRemoveFromAccount = async (styleId) => {
    if (!isAuthenticated) {
      alert('请先登录后再操作')
      return
    }

    // 防止重复点击
    if (removingStyleIds.has(styleId)) {
      return
    }

    try {
      // 添加到进行中状态
      setRemovingStyleIds(prev => new Set([...prev, styleId]))

      // 使用专门的公共风格移除方法
      const result = await removePublicStyleFromAccount(styleId)
      
      if (result) {
        // 移除进行中状态
        setRemovingStyleIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(styleId)
          return newSet
        })
      } else {
        // 移除进行中状态
        setRemovingStyleIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(styleId)
          return newSet
        })
      }
    } catch (error) {
      console.error('从账户移除风格失败:', error)
      
      // 移除进行中状态
      setRemovingStyleIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(styleId)
        return newSet
      })
    }
  }

  const currentStyles = getCurrentStyles()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Manage Styles</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {error && (
            <div className="error-message">
              {error}
              <button onClick={clearError} style={{ marginLeft: '10px' }}>×</button>
            </div>
          )}

          {!showEditor ? (
            <>
              {/* 标签页 */}
              <div className="style-tabs">
                <button 
                  className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All Styles ({styles.length})
                </button>
                <button 
                  className={`tab-button ${activeTab === 'public' ? 'active' : ''}`}
                  onClick={() => setActiveTab('public')}
                >
                  Public ({publicStyles.length})
                </button>
                <button 
                  className={`tab-button ${activeTab === 'private' ? 'active' : ''}`}
                  onClick={() => setActiveTab('private')}
                >
                  My Styles ({userStyles.length})
                </button>
              </div>

              {/* 搜索栏 - 根据不同标签页显示不同搜索 */}
              <div className="search-section" style={{ margin: '20px 0' }}>
                <div className="search-input-wrapper">
                  {activeTab === 'all' && (
                    <>
                      <input
                        type="text"
                        className="style-search-input"
                        placeholder="Search community public styles"
                        value={allTabSearchTerm}
                        onChange={(e) => setAllTabSearchTerm(e.target.value)}
                      />
                      {allTabSearchTerm && (
                        <button 
                          className="clear-search-btn"
                          onClick={() => setAllTabSearchTerm('')}
                          title="Clear search"
                        >
                          ×
                        </button>
                      )}
                    </>
                  )}
                  
                  {activeTab === 'public' && (
                    <>
                      <input
                        type="text"
                        className="style-search-input"
                        placeholder="Search my public styles..."
                        value={publicTabSearchTerm}
                        onChange={(e) => setPublicTabSearchTerm(e.target.value)}
                      />
                      {publicTabSearchTerm && (
                        <button 
                          className="clear-search-btn"
                          onClick={() => setPublicTabSearchTerm('')}
                          title="Clear search"
                        >
                          ×
                        </button>
                      )}
                    </>
                  )}
                  
                  {activeTab === 'private' && (
                    <>
                      <input
                        type="text"
                        className="style-search-input"
                        placeholder="Search my private styles..."
                        value={privateTabSearchTerm}
                        onChange={(e) => setPrivateTabSearchTerm(e.target.value)}
                      />
                      {privateTabSearchTerm && (
                        <button 
                          className="clear-search-btn"
                          onClick={() => setPrivateTabSearchTerm('')}
                          title="Clear search"
                        >
                          ×
                        </button>
                      )}
                    </>
                  )}
                </div>
                
                {/* 搜索结果统计 */}
                {activeTab === 'all' && allTabSearchTerm && (
                  <div className="search-results-info">
                    找到 {getCommunitySearchResults().length} 个社区风格
                  </div>
                )}
                {activeTab === 'public' && publicTabSearchTerm && (
                  <div className="search-results-info">
                    找到 {filteredPublicStyles.length} 个公共风格
                  </div>
                )}
                {activeTab === 'private' && privateTabSearchTerm && (
                  <div className="search-results-info">
                    找到 {filteredPrivateStyles.length} 个私人风格
                  </div>
                )}
              </div>

              {/* 创建按钮 */}
              <div className="manager-actions" style={{ margin: '20px 0' }}>
                {isAuthenticated ? (
                  <button 
                    className="editor-button"
                    onClick={handleCreateNew}
                    disabled={isLoading}
                  >
                    Create New Style
                  </button>
                ) : (
                  <LoginPrompt 
                    title="Login to Create Styles"
                    message="Sign in to use public styles and create your own custom styles"
                    buttonText="Sign In to Create"
                  />
                )}
              </div>

              {/* 风格列表 */}
              {isLoading ? (
                <div className="loading-state">Loading styles...</div>
              ) : (
                <>
                  {/* All Tab的社区搜索结果 */}
                  {activeTab === 'all' && getCommunitySearchResults().length > 0 && (
                    <div className="community-search-results">
                      <h4 style={{ margin: '20px 0 10px 0', color: '#666' }}>社区风格搜索结果</h4>
                      <div className="style-list">
                        {getCommunitySearchResults().map((style) => (
                          <div key={`community-${style.id}`} className="style-item">
                            <div className="style-info">
                              <div className="style-name">
                                {style.displayName}
                                <span className="public-badge"> (Community)</span>
                              </div>
                              <div className="style-description">{style.description}</div>
                              <div className="style-meta">
                                Created by: {style.createdBy || 'Unknown'}
                              </div>
                            </div>
                            
                            {/* 未登录状态下不显示任何操作按钮 */}
                            {isAuthenticated && (
                              <div className="style-actions">
                                {/* 社区搜索结果显示添加按钮或已添加状态 */}
                                {isStyleAdded(style.id) ? (
                                  <span className="already-added-text">Already Added</span>
                                ) : (
                                  <button 
                                    className={`action-button ${addingStyleIds.has(style.id) ? 'success' : 'copy'}`}
                                    onClick={() => handleAddToAccount(style.id)}
                                    disabled={isLoading || addingStyleIds.has(style.id)}
                                  >
                                    {addingStyleIds.has(style.id) ? 'Added!' : 'Add to Account'}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 当前账户的风格列表 */}
                  {currentStyles.length === 0 && getCommunitySearchResults().length === 0 ? (
                    <div className="empty-state">
                      <p>No styles found in this category.</p>
                      {activeTab === 'private' && (
                        <p>Create your first custom style!</p>
                      )}
                    </div>
                  ) : currentStyles.length > 0 && (
                    <div className="account-styles">
                      {activeTab === 'all' && getCommunitySearchResults().length > 0 && (
                        <h4 style={{ margin: '30px 0 10px 0', color: '#666' }}>我的风格库</h4>
                      )}
                      <div className="style-list">
                        {currentStyles.map((style) => (
                          <div key={style.id} className="style-item">
                            <div className="style-info">
                              <div className="style-name">
                                {style.displayName}
                                {style.isPublic && <span className="public-badge"> (Public)</span>}
                                {!style.isPublic && <span className="private-badge"> (Private)</span>}
                              </div>
                              <div className="style-description">{style.description}</div>
                              <div className="style-meta">
                                Created by: {style.createdBy || 'Unknown'}
                              </div>
                            </div>
                            
                            {/* 未登录状态下不显示任何操作按钮 */}
                            {isAuthenticated && (
                              <div className="style-actions">
                                {/* 根据标签页和风格类型显示不同按钮 */}
                                {activeTab === 'public' && (
                                  <>
                                    <button 
                                      className="action-button copy"
                                      onClick={() => handleCopyToPrivate(style.id)}
                                      disabled={isLoading}
                                      title="复制到私人风格"
                                    >
                                      Copy
                                    </button>
                                    <button 
                                      className="action-button danger"
                                      onClick={() => handleRemoveFromAccount(style.id)}
                                      disabled={isLoading || removingStyleIds.has(style.id)}
                                      title="从账户移除"
                                    >
                                      {removingStyleIds.has(style.id) ? 'Removing...' : 'Remove'}
                                    </button>
                                  </>
                                )}
                                
                                {(activeTab === 'private' || (activeTab === 'all' && !style.isPublic)) && (
                                  <>
                                    <button 
                                      className="action-button"
                                      onClick={() => handleEditStyle(style.id)}
                                      disabled={isLoading}
                                    >
                                      Edit
                                    </button>
                                    <button 
                                      className="action-button danger"
                                      onClick={() => handleDelete(style.id)}
                                      disabled={isLoading}
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                                
                                {activeTab === 'all' && style.isPublic && (
                                  <button 
                                    className="action-button copy"
                                    onClick={() => handleCopyToPrivate(style.id)}
                                    disabled={isLoading}
                                    title="复制到私人风格"
                                  >
                                    Copy
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            /* 风格编辑器 */
            <StyleEditor
              style={editingStyle}
              onSave={handleSaveStyle}
              onCancel={handleCancelEdit}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default StyleManager