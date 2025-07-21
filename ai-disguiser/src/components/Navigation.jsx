import { Link } from 'react-router-dom'

function Navigation() {
  return (
    <nav>
      <h2>AI Disguiser</h2>
      <div>
        <Link to="/">Home</Link> | 
        <Link to="/explore">Explore</Link> | 
        <Link to="/history">History</Link>
      </div>
    </nav>
  )
}

export default Navigation