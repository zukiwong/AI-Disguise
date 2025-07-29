// 登录提示组件
// 用于在需要登录时引导用户

import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import AuthModal from './AuthModal.jsx'
import '../../styles/Auth.css'

function LoginPrompt({ 
  title = "Login Required", 
  message = "Sign in to unlock this feature",
  buttonText = "Sign In",
  showModal = false 
}) {
  const { isAuthenticated } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(showModal)

  // 如果用户已登录，不显示提示
  if (isAuthenticated) {
    return null
  }

  const handleSignInClick = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <>
      <div className="login-prompt">
        <h3 className="login-prompt-title">{title}</h3>
        <p className="login-prompt-message">{message}</p>
        <button className="login-prompt-button" onClick={handleSignInClick}>
          {buttonText}
        </button>
      </div>
      
      <AuthModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={title}
        message={message}
      />
    </>
  )
}

export default LoginPrompt