import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserAvatar, AuthModal } from './Auth/index.js'
import { useAuth } from '../hooks/useAuth.js'

function Navigation() {
  const { isAuthenticated } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleSignInClick = () => {
    setShowAuthModal(true)
  }

  const handleCloseAuthModal = () => {
    setShowAuthModal(false)
  }

  return (
    <>
      <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '10px 20px', 
        borderBottom: '1px solid #ddd',
        margin: '-20px -20px 20px -20px', // 抵消父容器的padding
        width: 'calc(100% + 40px)', // 补偿左右margin
        boxSizing: 'border-box'
      }}>
        <h2 style={{ margin: 0 }}>AI Disguiser</h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#333' }}>Home</Link>
          <Link to="/explore" style={{ textDecoration: 'none', color: '#333' }}>Explore</Link>
          <Link to="/history" style={{ textDecoration: 'none', color: '#333' }}>History</Link>
          
          {isAuthenticated ? (
            <UserAvatar showName={true} />
          ) : (
            <button 
              onClick={handleSignInClick}
              style={{
                backgroundColor: '#000',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#333'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#000'}
            >
              Sign In
            </button>
          )}
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