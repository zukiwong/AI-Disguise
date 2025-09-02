// 页面底部组件
import React from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>AI Disguiser</h3>
          <p>Transform your text with AI-powered style conversion</p>
        </div>
        
        <div className="footer-section">
          <h4>Legal</h4>
          <div className="footer-links">
            <Link to="/privacy" className="footer-link">Privacy Policy</Link>
            <Link to="/terms" className="footer-link">Terms of Service</Link>
          </div>
        </div>
        
        <div className="footer-section">
          <h4>Support</h4>
          <div className="footer-links">
            <Link to="/help" className="footer-link">Help & FAQ</Link>
            <Link to="/guide" className="footer-link">User Guide</Link>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} AI Disguiser. Licensed under MIT License.</p>
        <p>
          Powered by Google Gemini AI | 
          <a href="https://github.com/zukiwong/AI-Disguiser" target="_blank" rel="noopener noreferrer" className="github-link">
            GitHub
          </a>
        </p>
      </div>
    </footer>
  )
}

export default Footer