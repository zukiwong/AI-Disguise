import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { UserAvatar, AuthModal } from './Auth/index.js'
import { useAuth } from '../hooks/useAuth.js'
import { useTheme } from '../contexts/ThemeContext'
import ThemeLightIcon from '../assets/icons/theme-light.svg'
import ThemeDarkIcon from '../assets/icons/theme-dark.svg'
import { gsap } from 'gsap'
import './Navigation.css'

// 汉堡菜单图标组件
function HamburgerIcon({ isExpanded, onClick }) {
  return (
    <button
      className={`hamburger-menu ${isExpanded ? 'expanded' : ''}`}
      onClick={onClick}
      aria-label="Toggle navigation menu"
    >
      <span className="hamburger-line"></span>
      <span className="hamburger-line"></span>
      <span className="hamburger-line"></span>
    </button>
  )
}

function Navigation() {
  const { isAuthenticated } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const location = useLocation()

  // 紧凑型导航栏状态
  const [isExpanded, setIsExpanded] = useState(false)
  const navRef = useRef(null)
  const navLinksRef = useRef(null)
  const expandTimerRef = useRef(null)
  const collapseTimerRef = useRef(null)

  const handleSignInClick = () => {
    setShowAuthModal(true)
  }

  const handleCloseAuthModal = () => {
    setShowAuthModal(false)
  }

  // 清除定时器
  const clearTimers = () => {
    if (expandTimerRef.current) {
      clearTimeout(expandTimerRef.current)
      expandTimerRef.current = null
    }
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current)
      collapseTimerRef.current = null
    }
  }

  // 切换展开状态（点击汉堡菜单）
  const toggleExpanded = () => {
    clearTimers()
    setIsExpanded(!isExpanded)

    if (!isExpanded) {
      // 展开后设置自动收缩定时器
      collapseTimerRef.current = setTimeout(() => {
        setIsExpanded(false)
      }, 5000) // 5秒后自动收缩
    }
  }

  // 导航栏鼠标悬浮处理
  const handleNavMouseEnter = () => {
    clearTimers()

    // 如果未展开，1秒后自动展开
    if (!isExpanded) {
      expandTimerRef.current = setTimeout(() => {
        setIsExpanded(true)
      }, 1000) // 1秒延迟展开
    }
  }

  const handleNavMouseLeave = () => {
    clearTimers()

    // 鼠标离开后3秒自动收缩
    collapseTimerRef.current = setTimeout(() => {
      setIsExpanded(false)
    }, 3000)
  }

  // GSAP动画效果
  useEffect(() => {
    if (navLinksRef.current) {
      if (isExpanded) {
        // 展开动画
        gsap.fromTo(navLinksRef.current,
          {
            opacity: 0,
            x: 20,
            scale: 0.95
          },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 0.3,
            ease: 'power2.out'
          }
        )
      } else {
        // 收缩动画
        gsap.to(navLinksRef.current, {
          opacity: 0,
          x: 20,
          scale: 0.95,
          duration: 0.2,
          ease: 'power2.in'
        })
      }
    }
  }, [isExpanded])

  // 清理定时器
  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [])

  return (
    <>
      <nav
        ref={navRef}
        className={`immersive-nav ${isExpanded ? 'expanded' : 'compact'}`}
        onMouseEnter={handleNavMouseEnter}
        onMouseLeave={handleNavMouseLeave}
      >
        <div className="nav-content">
          <div className="nav-brand">
            <Link to="/" className="brand-link">
              <img src="/logo.svg" alt="AI Disguise" className="brand-logo" />
            </Link>
          </div>

          <div className="nav-right">
            {/* 导航链接 */}
            <div ref={navLinksRef} className="nav-links">
              <Link
                to="/"
                className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
              >
                Home
              </Link>
              <Link
                to="/explore"
                className={location.pathname === '/explore' ? 'nav-link active' : 'nav-link'}
              >
                Explore
              </Link>
              <Link
                to="/history"
                className={location.pathname === '/history' ? 'nav-link active' : 'nav-link'}
              >
                History
              </Link>
            </div>

            {/* 始终显示的登录/用户区域 */}
            <div className="nav-auth">
              {/* 主题切换按钮 */}
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <img
                  src={isDark ? ThemeLightIcon : ThemeDarkIcon}
                  alt={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  className="theme-icon"
                />
              </button>

              {isAuthenticated ? (
                <UserAvatar showName={true} />
              ) : (
                <button
                  className="nav-signin-btn"
                  onClick={handleSignInClick}
                >
                  Sign In
                </button>
              )}
            </div>

            {/* 汉堡菜单图标 */}
            <HamburgerIcon
              isExpanded={isExpanded}
              onClick={toggleExpanded}
            />
          </div>
        </div>
      </nav>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={handleCloseAuthModal}
        title="Sign In"
        message="Sign in to access all features"
      />
    </>
  )
}

export default Navigation