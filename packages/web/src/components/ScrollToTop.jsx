// 页面切换时自动滚动到顶部的组件
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const ScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    // 页面路由切换时滚动到顶部
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export default ScrollToTop