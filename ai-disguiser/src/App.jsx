import { Routes, Route } from 'react-router-dom'
import './App.css'
// Import page components | 导入页面组件
import Home from './pages/Home'
import Explore from './pages/Explore'
import Share from './pages/Share'
import History from './pages/History'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
// Import navigation component | 导入导航组件
import Navigation from './components/Navigation'

function App() {
  return (
    <div className="app">
      {/* Global Navigation | 全局导航 */}
      <Navigation />
      
      {/* Main Content Routes | 主要内容路由 */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/share/:id" element={<Share />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
