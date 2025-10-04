import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { StyleMarket, CommunityFeed } from '../components/Explore/index.js'
import '../styles/Explore.css'

function Explore() {
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('styles') // 'styles' 或 'community'
  
  // 根据URL参数设置初始tab和高亮内容
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'community') {
      setActiveTab('community')
    }
  }, [searchParams])

  return (
    <div className="explore-container">
      <div className="explore-header">
        <h1 className="explore-title">Explore</h1>
        <p className="explore-subtitle">
          Discover amazing styles and see what the community is creating
        </p>
      </div>

      {/* 标签页导航 */}
      <div className="explore-tabs">
        <button 
          className={`explore-tab ${activeTab === 'styles' ? 'active' : ''}`}
          onClick={() => setActiveTab('styles')}
        >
          Style Market
        </button>
        <button 
          className={`explore-tab ${activeTab === 'community' ? 'active' : ''}`}
          onClick={() => setActiveTab('community')}
        >
          Community Shares
        </button>
      </div>

      {/* 内容区域 */}
      <div className="explore-content">
        {activeTab === 'styles' ? (
          <StyleMarket />
        ) : (
          <CommunityFeed />
        )}
      </div>
    </div>
  )
}

export default Explore