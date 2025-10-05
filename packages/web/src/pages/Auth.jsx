// Auth 页面 - 用于插件登录跳转
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import AuthModal from '../components/Auth/AuthModal.jsx'

function Auth() {
  const navigate = useNavigate()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    // 如果用户已登录，直接跳转到 Profile 页面
    if (!isLoading && user) {
      navigate('/profile', { replace: true })
    }
  }, [user, isLoading, navigate])

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '16px',
        color: '#666'
      }}>
        Loading...
      </div>
    )
  }

  // 如果未登录，显示登录模态框
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <h1 style={{
          textAlign: 'center',
          marginBottom: '24px',
          fontSize: '24px',
          fontWeight: '600'
        }}>
          Sign in to AI Disguise
        </h1>
        <p style={{
          textAlign: 'center',
          color: '#666',
          marginBottom: '32px',
          fontSize: '14px'
        }}>
          Sign in to sync your styles and settings with the Chrome extension
        </p>
        <AuthModal
          isOpen={true}
          onClose={() => navigate('/', { replace: true })}
          showCloseButton={true}
        />
      </div>
    </div>
  )
}

export default Auth
