// 用户头像组件
// 显示用户头像和下拉菜单

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import '../../styles/Auth.css'

function UserAvatar({ showName = true, onProfileClick, onLogout }) {
  const navigate = useNavigate()
  const { 
    user, 
    userName, 
    userAvatar, 
    userEmail,
    logout 
  } = useAuth()
  
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (!user) {
    return null
  }

  const toggleMenu = () => {
    setShowMenu(!showMenu)
  }

  const handleProfileClick = () => {
    setShowMenu(false)
    if (onProfileClick) {
      onProfileClick()
    } else {
      // 使用React Router导航到Profile页面
      navigate('/profile')
    }
  }

  const handleLogout = async () => {
    setShowMenu(false)
    await logout()
    if (onLogout) {
      onLogout()
    }
  }

  // 获取用户名首字母作为占位符
  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="user-avatar" ref={menuRef}>
      <button className="user-avatar-button" onClick={toggleMenu}>
        {userAvatar ? (
          <img 
            src={userAvatar} 
            alt={userName || 'User'} 
            className="user-avatar-image"
          />
        ) : (
          <div className="user-avatar-placeholder">
            {getInitials(userName || userEmail)}
          </div>
        )}
        
        {showName && (
          <span className="user-avatar-name">
            {userName || userEmail.split('@')[0]}
          </span>
        )}
      </button>

      {showMenu && (
        <div className="user-menu">
          <div className="user-menu-item" onClick={handleProfileClick}>
            <strong>{userName || userEmail.split('@')[0]}</strong>
            <br />
            <small style={{ color: '#666' }}>{userEmail}</small>
          </div>
          
          <div className="user-menu-divider"></div>
          
          <button className="user-menu-item" onClick={handleProfileClick}>
            My Profile
          </button>
          
          <button className="user-menu-item" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

export default UserAvatar