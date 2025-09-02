import { Routes, Route } from 'react-router-dom'
import './App.css'
// Import page components | 导入页面组件
import Home from './pages/Home'
import Explore from './pages/Explore'
import Share from './pages/Share'
import History from './pages/History'
import Profile from './pages/Profile'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Help from './pages/Help'
import Guide from './pages/Guide'
import NotFound from './pages/NotFound'
// Import navigation component | 导入导航组件
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'

function App() {
  return (
    <div className="app">
      {/* 页面切换时滚动到顶部 */}
      <ScrollToTop />
      
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
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/help" element={<Help />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      
      {/* Footer | 页面底部 */}
      <Footer />
    </div>
  )
}

export default App
