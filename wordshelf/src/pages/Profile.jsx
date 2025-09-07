// 用户Profile页面
// 提供用户个人信息管理和设置功能

import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { ProfileOverview, ProfileSettings, ProfileContent, ProfileData } from '../components/Profile/index.js'
import '../styles/Profile.css'

// 导入图标
import LockIcon from '../assets/icons/lock.svg'

function Profile() {
  const { isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  // 如果用户未登录，显示提示信息
  if (!isAuthenticated) {
    return (
      <div className="profile-container">
        <div className="profile-auth-required">
          <div className="auth-required-icon">
            <img src={LockIcon} alt="Lock" className="lock-icon-svg" />
          </div>
          <h2 className="auth-required-title">Sign In Required</h2>
          <p className="auth-required-message">
            Please sign in to access your profile and manage your account settings.
          </p>
        </div>
      </div>
    )
  }

  // 标签页配置
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'settings', label: 'Settings' },
    { id: 'content', label: 'My Content' },
    { id: 'data', label: 'Data' }
  ]

  return (
    <div className="profile-container">
      {/* 页面标题 */}
      <div className="profile-header">
        <h1 className="profile-title">My Profile</h1>
        <p className="profile-subtitle">
          Manage your account, preferences, and content
        </p>
      </div>

      {/* 标签页导航 */}
      <div className="profile-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 标签页内容 */}
      <div className="profile-content">
        {activeTab === 'overview' && <ProfileOverview />}
        {activeTab === 'settings' && <ProfileSettings />}
        {activeTab === 'content' && <ProfileContent />}
        {activeTab === 'data' && <ProfileData />}
      </div>
    </div>
  )
}

export default Profile