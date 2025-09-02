// 返回顶部按钮组件
import React, { useState, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import './BackToTop.css'

// 注册GSAP插件
gsap.registerPlugin(ScrollToPlugin)

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false)

  // 监听滚动事件
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  // 使用GSAP平滑滚动到顶部
  const scrollToTop = () => {
    gsap.to(window, {
      duration: 0.8,
      scrollTo: 0,
      ease: "power2.out"
    })
  }

  if (!isVisible) {
    return null
  }

  return (
    <button
      className="back-to-top"
      onClick={scrollToTop}
      aria-label="Back to top"
    >
      ↑
    </button>
  )
}

export default BackToTop