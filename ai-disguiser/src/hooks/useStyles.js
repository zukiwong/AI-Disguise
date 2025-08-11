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
  copyStyleToPrivate,
  getStylesFromLocalStorage,
  saveStylesToLocalStorage
} from '../services/styleService.js'
import { hideStyleFromUser, getUserAddedStyles } from '../services/authService.js'

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
  const [addedStyleIds, setAddedStyleIds] = useState([]) // 用户添加到账户的风格ID列表
  const [operationsInProgress, setOperationsInProgress] = useState(new Set()) // 跟踪进行中的操作
  
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
      
      // 分别加载公共和用户风格（根据登录状态）
      const isAuthenticated = Boolean(userId)
      const publicStylesData = await getPublicStyles(isAuthenticated, userId)
      setPublicStyles(publicStylesData)
      
      if (userId) {
        const userStylesData = await getUserStyles(userId)
        setUserStyles(userStylesData)
        
        // 加载用户添加到账户的风格ID列表
        const addedIds = await getUserAddedStyles(userId)
        setAddedStyleIds(addedIds)
      } else {
        setUserStyles([])
        setAddedStyleIds([])
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

  // 隐藏公共风格
  const handleHideStyle = useCallback(async (styleId) => {
    if (!userId) {
      setError('需要登录才能隐藏风格')
      return false
    }

    setError('')

    try {
      await hideStyleFromUser(userId, styleId)
      
      // 本地更新状态，避免重新加载
      const filterStylesArray = (stylesArray) =>
        stylesArray.filter(style => style.id !== styleId)
      
      setStyles(filterStylesArray)
      setPublicStyles(filterStylesArray)
      // userStyles不受影响，因为隐藏的是公共风格
      
      return true
    } catch (err) {
      console.error('隐藏风格失败:', err)
      setError('隐藏风格失败')
      return false
    }
  }, [userId])

  // 乐观更新：添加风格到本地状态
  const addStyleToLocal = useCallback((newStyle) => {
    setStyles(prev => [...prev, newStyle])
    
    if (newStyle.isPublic) {
      setPublicStyles(prev => [...prev, newStyle])
    } else {
      setUserStyles(prev => [...prev, newStyle])
    }
  }, [])

  // 乐观更新：从本地状态移除风格
  const removeStyleFromLocal = useCallback((styleId) => {
    const filterStylesArray = (stylesArray) =>
      stylesArray.filter(style => style.id !== styleId)
    
    setStyles(filterStylesArray)
    setPublicStyles(filterStylesArray)
    setUserStyles(filterStylesArray)
  }, [])

  // 乐观更新：更新本地风格数据
  const updateStyleInLocal = useCallback((styleId, updateData) => {
    const updateStylesArray = (stylesArray) =>
      stylesArray.map(style =>
        style.id === styleId ? { ...style, ...updateData } : style
      )
    
    setStyles(updateStylesArray)
    setPublicStyles(updateStylesArray)
    setUserStyles(updateStylesArray)
  }, [])

  // 静默重新加载（不显示loading状态）
  const silentReloadStyles = useCallback(async () => {
    console.log('silentReloadStyles: 开始静默重新加载')
    setError('')
    
    try {
      // 不设置loading状态，静默更新
      const allStyles = await getAllAvailableStyles(userId)
      console.log('silentReloadStyles: 获取到所有风格:', allStyles.length)
      setStyles(allStyles)
      
      const isAuthenticated = Boolean(userId)
      const publicStylesData = await getPublicStyles(isAuthenticated, userId)
      console.log('silentReloadStyles: 获取到公共风格:', publicStylesData.length)
      setPublicStyles(publicStylesData)
      
      if (userId) {
        const userStylesData = await getUserStyles(userId)
        setUserStyles(userStylesData)
        
        // 加载用户添加到账户的风格ID列表
        const addedIds = await getUserAddedStyles(userId)
        console.log('silentReloadStyles: 从数据库获取的addedIds:', addedIds)
        setAddedStyleIds(addedIds)
      } else {
        setUserStyles([])
        setAddedStyleIds([])
      }
      
    } catch (err) {
      console.error('静默加载风格失败:', err)
      // 静默失败，不设置错误状态影响用户体验
    }
  }, [userId])

  // 复制公共风格到私人
  const handleCopyStyle = useCallback(async (publicStyleId) => {
    if (!userId) {
      setError('需要登录才能复制风格')
      return false
    }

    setError('')

    try {
      const newStyle = await copyStyleToPrivate(userId, publicStyleId)
      
      // 乐观更新：立即添加到本地状态
      addStyleToLocal(newStyle)
      
      // 静默同步数据，避免重新加载，延长时间确保Firebase同步
      setTimeout(() => silentReloadStyles(), 3000)
      
      return newStyle
    } catch (err) {
      console.error('复制风格失败:', err)
      setError('复制风格失败')
      return false
    }
  }, [userId, addStyleToLocal, silentReloadStyles])

  // 添加公共风格到用户账户
  const addPublicStyleToAccount = useCallback(async (styleId) => {
    if (!userId) {
      setError('需要登录才能添加风格')
      return false
    }

    setError('')
    
    // 标记操作开始
    setOperationsInProgress(prev => new Set([...prev, `add-${styleId}`]))

    try {
      // 获取要添加的风格数据
      const { getPublicStylesForExplore } = await import('../services/styleService.js')
      const allPublicStyles = await getPublicStylesForExplore(userId)
      const styleToAdd = allPublicStyles.find(style => style.id === styleId)
      
      if (!styleToAdd) {
        setError('风格不存在')
        setOperationsInProgress(prev => {
          const newSet = new Set(prev)
          newSet.delete(`add-${styleId}`)
          return newSet
        })
        return false
      }

      // 乐观更新：同时更新addedStyleIds和publicStyles
      setAddedStyleIds(prev => [...prev, styleId])
      setPublicStyles(prev => [...prev, styleToAdd])
      setStyles(prev => [...prev, styleToAdd])
      
      // 后台异步添加到账户
      const { addStyleToUserAccount } = await import('../services/authService.js')
      console.log('调用addStyleToUserAccount:', userId, styleId)
      const result = await addStyleToUserAccount(userId, styleId)
      console.log('addStyleToUserAccount结果:', result)
      
      if (result.success) {
        console.log('风格添加成功，3秒后重新加载数据')
        // 成功后延长静默同步延迟，给Firebase充足同步时间
        setTimeout(() => {
          console.log('开始静默重新加载数据')
          // 标记操作完成
          setOperationsInProgress(prev => {
            const newSet = new Set(prev)
            newSet.delete(`add-${styleId}`)
            return newSet
          })
          silentReloadStyles()
        }, 3000)
        return true
      } else {
        // 失败时回滚所有本地状态
        setAddedStyleIds(prev => prev.filter(id => id !== styleId))
        setPublicStyles(prev => prev.filter(style => style.id !== styleId))
        setStyles(prev => prev.filter(style => style.id !== styleId))
        setError('添加风格失败')
        setOperationsInProgress(prev => {
          const newSet = new Set(prev)
          newSet.delete(`add-${styleId}`)
          return newSet
        })
        return false
      }
    } catch (err) {
      console.error('添加公共风格失败:', err)
      // 失败时回滚所有本地状态
      setAddedStyleIds(prev => prev.filter(id => id !== styleId))
      setPublicStyles(prev => prev.filter(style => style.id !== styleId))
      setStyles(prev => prev.filter(style => style.id !== styleId))
      setError('添加风格失败')
      setOperationsInProgress(prev => {
        const newSet = new Set(prev)
        newSet.delete(`add-${styleId}`)
        return newSet
      })
      return false
    }
  }, [userId, silentReloadStyles])

  // 从用户账户移除公共风格
  const removePublicStyleFromAccount = useCallback(async (styleId) => {
    if (!userId) {
      setError('需要登录才能移除风格')
      return false
    }

    setError('')

    try {
      // 保存要移除的风格数据，以便回滚
      const styleToRemove = publicStyles.find(style => style.id === styleId)
      
      // 乐观更新：同时从addedStyleIds、publicStyles和styles中移除
      setAddedStyleIds(prev => prev.filter(id => id !== styleId))
      setPublicStyles(prev => prev.filter(style => style.id !== styleId))
      setStyles(prev => prev.filter(style => style.id !== styleId))
      
      // 后台异步从账户移除
      const { removeStyleFromUserAccount } = await import('../services/authService.js')
      const result = await removeStyleFromUserAccount(userId, styleId)
      
      if (result.success) {
        // 成功后延长静默同步延迟，给Firebase充足同步时间
        setTimeout(() => silentReloadStyles(), 3000)
        return true
      } else {
        // 失败时回滚所有本地状态
        setAddedStyleIds(prev => [...prev, styleId])
        if (styleToRemove) {
          setPublicStyles(prev => [...prev, styleToRemove])
          setStyles(prev => [...prev, styleToRemove])
        }
        setError('移除风格失败')
        return false
      }
    } catch (err) {
      console.error('移除公共风格失败:', err)
      // 失败时回滚所有本地状态
      setAddedStyleIds(prev => [...prev, styleId])
      const styleToRemove = publicStyles.find(style => style.id === styleId)
      if (styleToRemove) {
        setPublicStyles(prev => [...prev, styleToRemove])
        setStyles(prev => [...prev, styleToRemove])
      }
      setError('移除风格失败')
      return false
    }
  }, [userId, publicStyles, silentReloadStyles])

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
    addedStyleIds, // 用户添加到账户的风格ID列表
    
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
    handleHideStyle,
    handleCopyStyle,
    getStyleById,
    
    // 乐观更新方法
    addStyleToLocal,
    removeStyleFromLocal,
    updateStyleInLocal,
    silentReloadStyles,
    
    // 公共风格账户管理
    addPublicStyleToAccount,
    removePublicStyleFromAccount,
    
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