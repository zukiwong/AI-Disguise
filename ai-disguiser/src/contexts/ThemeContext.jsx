// 主题切换上下文
import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  // 从 localStorage 读取主题偏好，默认为浅色
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved === 'dark'
  })

  // 切换主题
  const toggleTheme = () => {
    setIsDark(prev => !prev)
  }

  // 当主题改变时，更新 localStorage 和 body 类名
  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
    document.body.className = isDark ? 'dark' : ''
  }, [isDark])

  const value = {
    isDark,
    toggleTheme,
    theme: isDark ? 'dark' : 'light'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}