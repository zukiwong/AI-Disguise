import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { UserAvatar, AuthModal } from './Auth/index.js'
import { useAuth } from '../hooks/useAuth.js'
import './Navigation.css'

function Navigation() {
  const { isAuthenticated } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const location = useLocation()

  const handleSignInClick = () => {
    setShowAuthModal(true)
  }

  const handleCloseAuthModal = () => {
    setShowAuthModal(false)
  }

  return (
    <>
      <nav className="immersive-nav">
        <div className="nav-content">
          <div className="nav-brand">
            <Link to="/" className="brand-link">
              <h2>AI Disguiser</h2>
            </Link>
          </div>
          
          <div className="nav-links">
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