// 404页面组件
// 复用WOW页面设计，显示404错误信息

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPublicStylesForExplore } from '../services/styleService.js'
import { gsap } from 'gsap'
import '../styles/History.css'

function NotFound() {
  const navigate = useNavigate()
  const [hoveredCard, setHoveredCard] = useState(null)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [publicStyles, setPublicStyles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentDescription, setCurrentDescription] = useState('Hover over any card to see style description')
  const cardsRef = useRef([])

  // 获取数据库中的公共风格
  useEffect(() => {
    const fetchPublicStyles = async () => {
      try {
        setIsLoading(true)
        const styles = await getPublicStylesForExplore()
        if (styles.length > 0) {
          setPublicStyles(styles)
        } else {
          // 如果数据库没有数据，使用本地兜底风格
          setPublicStyles(getDefaultStyles())
        }
      } catch (error) {
        console.error('获取公共风格失败:', error)
        // 错误时使用本地兜底风格
        setPublicStyles(getDefaultStyles())
      } finally {
        setIsLoading(false)
      }
    }

    fetchPublicStyles()
  }, [])

  // 监听窗口尺寸变化
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 兜底的默认风格数据
  const getDefaultStyles = () => [
    { id: 'chat', displayName: 'Chat Style', description: 'Casual and relaxed conversational tone' },
    { id: 'poem', displayName: 'Poetic Style', description: 'Literary expression with poetic flair' },
    { id: 'social', displayName: 'Social Style', description: 'Expression suitable for social media' },
    { id: 'story', displayName: 'Story Style', description: 'Narrative storytelling expression' },
    { id: 'formal', displayName: 'Formal Style', description: 'Professional and structured expression' },
    { id: 'casual', displayName: 'Casual Style', description: 'Relaxed and informal tone' },
    { id: 'creative', displayName: 'Creative Style', description: 'Imaginative and artistic expression' },
    { id: 'academic', displayName: 'Academic Style', description: 'Scholarly and analytical tone' }
  ]

  // Fisher-Yates 随机打乱算法
  const shuffleArray = (array) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // 为41个方块分配不重复的风格
  const assignStylesRandomly = (styles, count) => {
    const shuffledStyles = shuffleArray(styles)
    const result = []
    for (let i = 0; i < count; i++) {
      result.push(shuffledStyles[i % shuffledStyles.length])
    }
    return result
  }

  // 绿色系颜色方案
  const greenColors = [
    '#2d5016', // 深绿
    '#4a7c59', // 中绿  
    '#6faa6f', // 浅绿
    '#8bc34a', // 更浅绿
    '#388e3c', // 标准绿
    '#66bb6a', // 明绿
    '#4caf50', // 主绿色
    '#81c784'  // 淡绿
  ]

  // WOW字母的坐标点阵 - 简化版本，减少方块数量
  const wowPattern = [
    // 第一个 W (x: 0-5, y: 0-6) - 缩小并简化
    {x: 0, y: 0}, {x: 0, y: 1}, {x: 0, y: 2}, {x: 0, y: 3}, {x: 0, y: 4}, {x: 0, y: 5}, {x: 0, y: 6},
    {x: 1, y: 5}, {x: 1, y: 6},
    {x: 2, y: 4}, {x: 2, y: 5},
    {x: 3, y: 5}, {x: 3, y: 6},
    {x: 4, y: 0}, {x: 4, y: 1}, {x: 4, y: 2}, {x: 4, y: 3}, {x: 4, y: 4}, {x: 4, y: 5}, {x: 4, y: 6},

    // O (x: 6-10, y: 1-5) - 缩小
    {x: 7, y: 1}, {x: 8, y: 1}, {x: 9, y: 1},
    {x: 6, y: 2}, {x: 6, y: 3}, {x: 6, y: 4},
    {x: 10, y: 2}, {x: 10, y: 3}, {x: 10, y: 4},
    {x: 7, y: 5}, {x: 8, y: 5}, {x: 9, y: 5},

    // 第二个 W (x: 12-16, y: 0-6) - 缩小并简化
    {x: 12, y: 0}, {x: 12, y: 1}, {x: 12, y: 2}, {x: 12, y: 3}, {x: 12, y: 4}, {x: 12, y: 5}, {x: 12, y: 6},
    {x: 13, y: 5}, {x: 13, y: 6},
    {x: 14, y: 4}, {x: 14, y: 5},
    {x: 15, y: 5}, {x: 15, y: 6},
    {x: 16, y: 0}, {x: 16, y: 1}, {x: 16, y: 2}, {x: 16, y: 3}, {x: 16, y: 4}, {x: 16, y: 5}, {x: 16, y: 6}
  ]

  // 根据屏幕尺寸计算参数（使用state中的windowWidth）
  const getResponsiveParams = () => {
    if (windowWidth <= 375) {
      return { containerWidth: 220, cardSize: 14, scale: 0.4 } // 小手机端（iPhone SE等）- 缩小容器
    } else if (windowWidth <= 480) {
      return { containerWidth: 260, cardSize: 18, scale: 0.5 } // 普通手机端 - 缩小容器
    } else if (windowWidth <= 768) {
      return { containerWidth: 320, cardSize: 26, scale: 0.7 } // 小平板端 - 缩小容器
    } else if (windowWidth <= 1200) {
      return { containerWidth: 420, cardSize: 34, scale: 0.9 } // 大平板端 - 大幅缩小
    }
    return { containerWidth: 480, cardSize: 45, scale: 1.1 } // 桌面端 - 大幅缩小整体区域
  }

  // 计算居中位置的函数
  const getCardPosition = (x, y) => {
    const { containerWidth, cardSize, scale } = getResponsiveParams()
    const totalWidth = 17 // WOW字母新的总宽度（0-16）
    const spacing = cardSize * 1.2 // 适当增加间距，确保方块间有空隙
    const lettersWidth = totalWidth * spacing // 整个WOW字母的宽度
    const offsetX = (containerWidth - lettersWidth) / 2 // 居中偏移量
    
    return {
      left: offsetX + x * spacing,
      top: y * cardSize * 1.2 // 适当增加垂直间距
    }
  }
  
  // 为每个点分配风格和颜色（只有在有风格数据时才生成）
  const wowCards = publicStyles.length > 0 ? (() => {
    const assignedStyles = assignStylesRandomly(publicStyles, wowPattern.length)
    return wowPattern.map((point, index) => ({
      ...point,
      style: assignedStyles[index],
      color: greenColors[index % greenColors.length],
      id: `wow-${index}`
    }))
  })() : []

  // GSAP动画效果
  useEffect(() => {
    // 只有在数据加载完成且有卡片时才执行动画
    if (!isLoading && wowCards.length > 0 && cardsRef.current.length > 0) {
      // 过滤掉null的元素，确保所有目标元素都存在
      const validCards = cardsRef.current.filter(card => card !== null)
      
      if (validCards.length > 0) {
        // 设置卡片初始状态
        gsap.set(validCards, { 
          opacity: 0, 
          scale: 0
        })

        // 0.3秒后开始卡片动画，速度加快一倍
        gsap.to(validCards, {
          opacity: 1,
          scale: 1,
          duration: 0.2,
          stagger: {
            amount: 0.6, // 0.6秒内完成所有卡片动画（原来1.2秒的一半）
            from: "random" // 随机顺序出现
          },
          ease: "back.out(1.5)",
          delay: 0.3
        })
      }
    }
  }, [isLoading, wowCards.length, windowWidth]) // 依赖加载状态、卡片数量和窗口尺寸

  // 处理卡片点击
  const handleCardClick = (styleId) => {
    localStorage.setItem('preselectedStyle', styleId)
    navigate('/')
  }

  // 处理返回首页按钮点击
  const handleGoHome = () => {
    navigate('/')
  }

  // 生成显示文本的辅助函数 - 只显示首字母
  const getCardDisplayText = (styleName) => {
    if (!styleName) return '?'
    
    // 统一显示首字母，简洁设计
    return styleName[0].toUpperCase()
  }

  // 处理卡片悬浮
  const handleCardHover = (card) => {
    setHoveredCard(card.id)
    setCurrentDescription(card.style.description)
  }

  // 处理卡片离开
  const handleCardLeave = () => {
    setHoveredCard(null)
    setCurrentDescription('Hover over any card to see style description')
  }

  return (
    <div className="unauthenticated-history-wow">
      {/* 页面头部 - 404页面文案 */}
      <div className="wow-header">
        <h2 className="main-title">
          <span className="title-desktop">Oops! Page not found, but amazing styles await!</span>
          <div className="title-mobile">
            <div className="title-line-1">Oops! Page not found,</div>
            <div className="title-line-2">but amazing styles await!</div>
          </div>
        </h2>
        <p className="subtitle">The page you're looking for doesn't exist. Discover our disguise styles instead!</p>
      </div>

      {/* WOW拼字区域 */}
      <div className="wow-letters-container">
        {isLoading ? (
          <div className="loading-skeleton">
            <div className="loading-text">Loading amazing styles...</div>
          </div>
        ) : (
          wowCards.map((card, index) => (
            <div
              key={card.id}
              ref={(el) => (cardsRef.current[index] = el)}
              className="wow-card"
              style={{
                left: `${getCardPosition(card.x, card.y).left}px`,
                top: `${getCardPosition(card.x, card.y).top}px`,
                backgroundColor: card.color
              }}
              onClick={() => handleCardClick(card.style.id)}
              onMouseEnter={() => handleCardHover(card)}
              onMouseLeave={handleCardLeave}
            >
              <div className="card-inner">
                <div className="card-title">
                  {getCardDisplayText(card.style.displayName || card.style.name)}
                </div>
                {hoveredCard === card.id && (
                  <div className="card-tooltip">
                    {card.style.displayName || card.style.name}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 底部描述展示区域 - 添加返回首页按钮 */}
      <div className="bottom-description-area">
        <p className="bottom-description-text">{currentDescription}</p>
        <button 
          className="go-home-button"
          onClick={handleGoHome}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#45a049'
            e.target.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#4caf50'
            e.target.style.transform = 'translateY(0)'
          }}
        >
          🏠 Back to Home
        </button>
      </div>
    </div>
  )
}

export default NotFound