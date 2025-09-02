// 可折叠内容区域组件
import React, { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'

const CollapsibleSection = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const contentRef = useRef(null)
  const arrowRef = useRef(null)

  useEffect(() => {
    // 初始化状态
    if (contentRef.current) {
      if (isOpen) {
        gsap.set(contentRef.current, { height: 'auto' })
        gsap.set(arrowRef.current, { rotation: 45 })
      } else {
        gsap.set(contentRef.current, { height: 0 })
        gsap.set(arrowRef.current, { rotation: 0 })
      }
    }
  }, [])

  const toggleSection = () => {
    if (!contentRef.current || !arrowRef.current) return

    const content = contentRef.current
    const arrow = arrowRef.current

    if (isOpen) {
      // 收起动画
      gsap.to(content, {
        height: 0,
        duration: 0.4,
        ease: 'power2.inOut'
      })
      gsap.to(arrow, {
        rotation: 0,
        duration: 0.3,
        ease: 'power2.out'
      })
    } else {
      // 展开动画
      gsap.set(content, { height: 'auto' })
      const targetHeight = content.offsetHeight
      gsap.set(content, { height: 0 })
      
      gsap.to(content, {
        height: targetHeight,
        duration: 0.4,
        ease: 'power2.inOut'
      })
      gsap.to(arrow, {
        rotation: 45,
        duration: 0.3,
        ease: 'power2.out'
      })
    }

    setIsOpen(!isOpen)
  }

  return (
    <section className="collapsible-section">
      <div className="section-header" onClick={toggleSection}>
        <h2>{title}</h2>
        <div ref={arrowRef} className="expand-arrow">
          +
        </div>
      </div>
      <div ref={contentRef} className="section-content">
        <div className="content-inner">
          {children}
        </div>
      </div>
    </section>
  )
}

export default CollapsibleSection