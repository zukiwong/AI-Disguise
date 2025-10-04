// 页面底部组件
import React from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
  return (
    <footer className="simple-footer">
      <div className="footer-content">
        <p className="footer-main">
          &copy; {new Date().getFullYear()} AI Disguise. Licensed under MIT License.
          Powered by Google Gemini AI |
          <a href="https://github.com/zukiwong/AI-Disguiser" target="_blank" rel="noopener noreferrer" className="github-link">
            GitHub
          </a>
        </p>

        <div className="footer-links">
          <Link to="/privacy" className="footer-link">Privacy</Link>
          <span className="separator">|</span>
          <Link to="/terms" className="footer-link">Terms</Link>
          <span className="separator">|</span>
          <Link to="/help" className="footer-link">Help</Link>
          <span className="separator">|</span>
          <Link to="/guide" className="footer-link">Guide</Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer