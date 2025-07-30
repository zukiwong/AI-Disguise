// 风格管理自定义 Hook
// 专门管理风格数据的状态和操作

import { useState, useEffect, useCallback } from 'react'
import {
  getAllAvailableStyles,
  getPublicStyles,
  getUserStyles,
  createStyle,
  updateStyle,
  deleteStyle,
  getStylesFromLocalStorage,
  saveStylesToLocalStorage
} from '../services/styleService.js'

/**
 * 风格管理 Hook
 * @param {string} userId - 用户ID（可选）
 * @returns {Object} 包含风格状态和操作方法的对象
 */
export function useStyles(userId = null) {
  // 风格数据状态
  const [styles, setStyles] = useState([])
  const [publicStyles, setPublicStyles] = useState([])
  const [userStyles, setUserStyles] = useState([])
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  // 编辑状态
  const [isEditing, setIsEditing] = useState(false)
  const [editingStyleId, setEditingStyleId] = useState(null)

  // 加载所有可用风格
  const loadStyles = useCallback(async () => {
    setIsLoading(true)
    setError('')
    
    try {
      // 尝试从 Firestore 加载
      const allStyles = await getAllAvailableStyles(userId)
      setStyles(allStyles)
      
      // 分别加载公共和用户风格
      const publicStylesData = await getPublicStyles()
      setPublicStyles(publicStylesData)
      
      if (userId) {
        const userStylesData = await getUserStyles(userId)
        setUserStyles(userStylesData)
      } else {
        setUserStyles([])
      }
      
    } catch (err) {
      console.error('加载风格失败:', err)
      setError('加载风格失败，使用本地缓存')
      
      // 降级到本地存储
      const localStyles = getStylesFromLocalStorage()
      setStyles(localStyles)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // 创建新风格
  const handleCreateStyle = useCallback(async (styleData) => {
    setIsLoading(true)
    setError('')
    
    try {
      const newStyle = {
        ...styleData,
        createdBy: userId || 'anonymous'
      }
      
      // 尝试保存到 Firestore
      try {
        const createdStyle = await createStyle(newStyle)
        
        setStyles(prev => [...prev, createdStyle])
        
        if (newStyle.isPublic) {
          setPublicStyles(prev => [...prev, createdStyle])
        } else {
          setUserStyles(prev => [...prev, createdStyle])
        }
        
      } catch (firestoreError) {
        console.error('Firestore 创建失败，使用本地存储:', firestoreError)
        
        // 降级到本地存储
        const styleWithId = {
          ...newStyle,
          id: Date.now().toString()
        }
        
        const updatedStyles = [...styles, styleWithId]
        setStyles(updatedStyles)
        saveStylesToLocalStorage(updatedStyles)
      }
      
      return true
    } catch (err) {
      console.error('创建风格失败:', err)
      setError('创建风格失败')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [userId, styles])

  // 更新风格
  const handleUpdateStyle = useCallback(async (styleId, updateData) => {
    setIsLoading(true)
    setError('')
    
    try {
      // 尝试更新到 Firestore
      try {
        await updateStyle(styleId, updateData)
        
        // 更新本地状态
        const updateStylesArray = (stylesArray) =>
          stylesArray.map(style =>
            style.id === styleId ? { ...style, ...updateData } : style
          )
        
        setStyles(updateStylesArray)
        setPublicStyles(updateStylesArray)
        setUserStyles(updateStylesArray)
        
      } catch (firestoreError) {
        console.error('Firestore 更新失败，使用本地存储:', firestoreError)
        
        // 降级到本地存储
        const updatedStyles = styles.map(style =>
          style.id === styleId ? { ...style, ...updateData } : style
        )
        setStyles(updatedStyles)
        saveStylesToLocalStorage(updatedStyles)
      }
      
      return true
    } catch (err) {
      console.error('更新风格失败:', err)
      setError('更新风格失败')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [styles])

  // 删除风格
  const handleDeleteStyle = useCallback(async (styleId) => {
    setIsLoading(true)
    setError('')
    
    try {
      // 尝试从 Firestore 删除
      try {
        await deleteStyle(styleId)
        
        // 更新本地状态
        const filterStylesArray = (stylesArray) =>
          stylesArray.filter(style => style.id !== styleId)
        
        setStyles(filterStylesArray)
        setPublicStyles(filterStylesArray)
        setUserStyles(filterStylesArray)
        
      } catch (firestoreError) {
        console.error('Firestore 删除失败，使用本地存储:', firestoreError)
        
        // 降级到本地存储
        const updatedStyles = styles.filter(style => style.id !== styleId)
        setStyles(updatedStyles)
        saveStylesToLocalStorage(updatedStyles)
      }
      
      return true
    } catch (err) {
      console.error('删除风格失败:', err)
      setError('删除风格失败')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [styles])

  // 获取特定风格
  const getStyleById = useCallback((styleId) => {
    return styles.find(style => style.id === styleId)
  }, [styles])

  // 开始编辑风格
  const startEditing = useCallback((styleId) => {
    setEditingStyleId(styleId)
    setIsEditing(true)
  }, [])

  // 取消编辑
  const cancelEditing = useCallback(() => {
    setEditingStyleId(null)
    setIsEditing(false)
  }, [])

  // 清除错误
  const clearError = useCallback(() => {
    setError('')
  }, [])

  // 组件挂载时自动加载风格，并在用户ID变化时重新加载
  useEffect(() => {
    loadStyles()
  }, [loadStyles])
  
  // 额外监听 userId 变化
  useEffect(() => {
    if (userId) {
      loadStyles()
    }
  }, [userId, loadStyles])

  // 返回所有状态和方法
  return {
    // 风格数据
    styles,
    publicStyles,
    userStyles,
    
    // 状态
    isLoading,
    error,
    isEditing,
    editingStyleId,
    
    // 操作方法
    loadStyles,
    handleCreateStyle,
    handleUpdateStyle,
    handleDeleteStyle,
    getStyleById,
    
    // 编辑状态管理
    startEditing,
    cancelEditing,
    
    // 工具方法
    clearError,
    
    // 计算属性
    hasStyles: styles.length > 0,
    totalStyles: styles.length,
    publicStylesCount: publicStyles.length,
    userStylesCount: userStyles.length
  }
}