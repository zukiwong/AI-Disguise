// 风格管理自定义 Hook
// 专门管理风格数据的状态和操作

import { useState, useEffect, useCallback } from 'react'
import {
  getUserStylesWithVariants,
  createStyle,
  updateStyle,
  deleteStyle,
  copyStyleToPrivate,
  getStylesFromLocalStorage,
  saveStylesToLocalStorage
} from '../services/styleService.js'
import { hideStyleFromUser, getUserAddedStyles } from '../services/authService.js'
import eventBus, { EVENTS } from '../utils/eventBus.js'

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
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  // 编辑状态
  const [isEditing, setIsEditing] = useState(false)
  const [editingStyleId, setEditingStyleId] = useState(null)

  // 加载所有可用风格（使用新的简化函数）
  const loadStyles = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      // 使用新的简化函数一次性加载所有带变体的风格数据
      const allStylesWithVariants = await getUserStylesWithVariants(userId)

      // 数据完整性检查：过滤掉可能的无效样式
      const validStyles = []
      const invalidStyles = []

      allStylesWithVariants.forEach(style => {
        if (style && style.id && style.displayName) {
          validStyles.push(style)
        } else {
          invalidStyles.push(style)
          console.log('发现无效样式:', {
            id: style?.id,
            displayName: style?.displayName,
            createdBy: style?.createdBy,
            hasAllFields: !!(style && style.id && style.displayName)
          })
        }
      })

      if (invalidStyles.length > 0) {
        console.log('总共过滤了', invalidStyles.length, '个无效样式')
      }

      setStyles(validStyles)

      // 分别设置公共和用户风格（从合并的结果中分离）
      const publicStylesData = validStyles.filter(style =>
        style.isPublic || (style.createdBy === 'system' && style.isPublic !== false)
      )
      const userStylesData = validStyles.filter(style =>
        !style.isPublic && style.createdBy === userId
      )

      setPublicStyles(publicStylesData)
      setUserStyles(userStylesData)

      if (userId) {
        // 加载用户添加到账户的风格ID列表
        const addedIds = await getUserAddedStyles(userId)
        setAddedStyleIds(addedIds)
      } else {
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
      // 验证用户登录状态
      if (!userId) {
        throw new Error('用户未登录或用户ID获取失败')
      }

      const newStyle = {
        ...styleData,
        createdBy: userId
      }


      // 尝试保存到 Firestore
      try {
        const createdStyle = await createStyle(newStyle)

        // 如果是公共风格，需要将其添加到用户的账户中
        if (newStyle.isPublic) {
          const { addStyleToUserAccount } = await import('../services/authService.js')
          await addStyleToUserAccount(userId, createdStyle.id)
        }

        setStyles(prev => [...prev, createdStyle])

        if (newStyle.isPublic) {
          setPublicStyles(prev => [...prev, createdStyle])
        } else {
          setUserStyles(prev => [...prev, createdStyle])
        }

        // 发送样式创建事件
        eventBus.emit(EVENTS.STYLE_CREATED, {
          style: createdStyle,
          userId
        })
        
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
      
      // 🐛 修复：同时更新 addedStyleIds，从列表中移除被隐藏的风格
      setAddedStyleIds(prev => prev.filter(id => id !== styleId))
      
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
    setError('')
    
    try {
      // 使用新的简化函数一次性加载所有带变体的风格数据
      const allStylesWithVariants = await getUserStylesWithVariants(userId)
      setStyles(allStylesWithVariants)
      
      // 分别设置公共和用户风格（从合并的结果中分离）
      const publicStylesData = allStylesWithVariants.filter(style => 
        style.isPublic || (style.createdBy === 'system' && style.isPublic !== false)
      )
      const userStylesData = allStylesWithVariants.filter(style => 
        !style.isPublic && style.createdBy === userId
      )
      
      setPublicStyles(publicStylesData)
      setUserStyles(userStylesData)
      
      if (userId) {
        // 加载用户添加到账户的风格ID列表
        const addedIds = await getUserAddedStyles(userId)
        setAddedStyleIds(addedIds)
      } else {
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

    try {
      // 获取要添加的风格数据
      const { getPublicStylesForExplore } = await import('../services/styleService.js')
      const allPublicStyles = await getPublicStylesForExplore(userId)
      const styleToAdd = allPublicStyles.find(style => style.id === styleId)
      
      if (!styleToAdd) {
        setError('风格不存在')
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
          silentReloadStyles()
        }, 3000)
        return true
      } else {
        // 失败时回滚所有本地状态
        setAddedStyleIds(prev => prev.filter(id => id !== styleId))
        setPublicStyles(prev => prev.filter(style => style.id !== styleId))
        setStyles(prev => prev.filter(style => style.id !== styleId))
        setError('添加风格失败')
        return false
      }
    } catch (err) {
      console.error('添加公共风格失败:', err)
      // 失败时回滚所有本地状态
      setAddedStyleIds(prev => prev.filter(id => id !== styleId))
      setPublicStyles(prev => prev.filter(style => style.id !== styleId))
      setStyles(prev => prev.filter(style => style.id !== styleId))
      setError('添加风格失败')
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
      // 保存要移除的风格数据，以便回滚（从所有可能的列表中查找）
      const styleToRemove = styles.find(style => style.id === styleId) ||
                           publicStyles.find(style => style.id === styleId) ||
                           userStyles.find(style => style.id === styleId)


      // 如果找不到样式，可能是数据同步问题，尝试重新加载然后再删除
      if (!styleToRemove) {
        console.error('找不到要删除的样式，尝试重新加载数据后再删除')

        // 重新加载数据并直接获取最新数据
        const freshAllStyles = await getUserStylesWithVariants(userId)

        // 从最新数据中查找目标样式
        const reloadedStyleToRemove = freshAllStyles.find(style => style.id === styleId)

        if (reloadedStyleToRemove) {

          // 更新本地状态以保持同步
          setStyles(freshAllStyles)

          // 分别设置公共和用户风格
          const publicStylesData = freshAllStyles.filter(style =>
            style.isPublic || (style.createdBy === 'system' && style.isPublic !== false)
          )
          const userStylesData = freshAllStyles.filter(style =>
            !style.isPublic && style.createdBy === userId
          )
          setPublicStyles(publicStylesData)
          setUserStyles(userStylesData)

          // 判断样式类型并执行相应的删除逻辑
          const isUserPrivateStyle = reloadedStyleToRemove.createdBy === userId && !reloadedStyleToRemove.isPublic

          if (isUserPrivateStyle) {
            const result = await handleDeleteStyle(styleId)
            if (result.success || result === true) {
              setTimeout(() => silentReloadStyles(), 1000)
              return true
            }
            return false
          } else {
            setError('只能删除自己创建的私人风格')
            return false
          }
        } else {
          console.error('重新加载后仍然找不到样式，停止删除流程')
          setError('找不到指定的风格')
          return false
        }
      }

      // 判断样式类型和采用的移除策略
      const isSystemStyle = styleToRemove.createdBy === 'system'
      const isUserPrivateStyle = styleToRemove.createdBy === userId && !styleToRemove.isPublic
      const isAddedPublicStyle = addedStyleIds.includes(styleId)


      // 乐观更新：从相关列表中移除
      setStyles(prev => prev.filter(style => style.id !== styleId))
      if (styleToRemove?.isPublic) {
        setPublicStyles(prev => prev.filter(style => style.id !== styleId))
      } else {
        setUserStyles(prev => prev.filter(style => style.id !== styleId))
      }
      if (isAddedPublicStyle) {
        setAddedStyleIds(prev => prev.filter(id => id !== styleId))
      }

      let result

      if (isUserPrivateStyle) {
        // 私人样式：彻底删除
        result = await handleDeleteStyle(styleId)
      } else if (isAddedPublicStyle) {
        // 添加的公共样式：从账户移除
        console.log('从账户移除公共样式:', styleId)
        const { removeStyleFromUserAccount } = await import('../services/authService.js')
        result = await removeStyleFromUserAccount(userId, styleId)
      } else if (isSystemStyle) {
        // 系统样式：添加到隐藏列表
        const { hideStyleFromUser } = await import('../services/authService.js')
        result = await hideStyleFromUser(userId, styleId)
      } else {
        console.error('未知样式类型，无法处理')
        result = { success: false, error: '未知样式类型' }
      }

      console.log('移除操作结果:', result)

      if (result.success || result === true) {

        // 立即从本地状态中移除样式，让用户看到删除动画
        const filterStylesArray = (stylesArray) =>
          stylesArray.filter(style => style.id !== styleId)

        setStyles(filterStylesArray)
        setPublicStyles(filterStylesArray)
        setUserStyles(filterStylesArray)

        // 如果是已添加的公共样式，也要从addedStyleIds中移除
        if (isAddedPublicStyle) {
          setAddedStyleIds(prev => prev.filter(id => id !== styleId))
        }

        // 延迟静默重新加载以确保数据库状态同步
        setTimeout(() => {
          silentReloadStyles()
        }, 3000)
        return true
      } else {
        console.error('移除失败，回滚本地状态')
        // 失败时回滚所有本地状态
        setStyles(prev => [...prev, styleToRemove])
        if (styleToRemove?.isPublic) {
          setPublicStyles(prev => [...prev, styleToRemove])
        } else {
          setUserStyles(prev => [...prev, styleToRemove])
        }
        if (isAddedPublicStyle) {
          setAddedStyleIds(prev => [...prev, styleId])
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

  // 移除事件监听，避免无限循环
  // useStyles作为数据源不应该监听自己的更新事件

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