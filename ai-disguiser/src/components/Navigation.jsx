import { Link } from 'react-router-dom'
import { UserAvatar } from './Auth/index.js'
import { useAuth } from '../hooks/useAuth.js'

function Navigation() {
  const { isAuthenticated } = useAuth()

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid #ddd' }}>
      <h2 style={{ margin: 0 }}>AI Disguiser</h2>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div>
          <Link to="/" style={{ marginRight: '15px', textDecoration: 'none', color: '#333' }}>Home</Link>
          <Link to="/explore" style={{ marginRight: '15px', textDecoration: 'none', color: '#333' }}>Explore</Link>
          <Link to="/history" style={{ textDecoration: 'none', color: '#333' }}>History</Link>
        </div>
        
        {isAuthenticated && <UserAvatar showName={true} />}
      </div>
    </nav>
  )
}

export default Navigation