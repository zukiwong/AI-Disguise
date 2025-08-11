// 历史记录管理自定义Hook
// 提供历史记录的状态管理和操作方法

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth.js'
import { 
  getUserHistory,
  toggleFavoriteRecord,
  deleteHistoryRecord,
  incrementUsageCount,
  updateHistoryRecord,
  getUserTags,
  addUserTag
} from '../services/historyService.js'

export function useHistoryManager() {
  const { userId, isAuthenticated } = useAuth()
  
  // 基础状态
  const [historyRecords, setHistoryRecords] = useState([])
  const [userTags, setUserTags] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  // 加载历史记录
  const loadHistory = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      setHistoryRecords([])
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const records = await getUserHistory(userId)
      setHistoryRecords(records || [])
    } catch (err) {
      console.error('加载历史记录失败:', err)
      setError('Failed to load history records')
    } finally {
      setIsLoading(false)
    }
  }, [userId, isAuthenticated])

  // 加载用户标签
  const loadUserTags = useCallback(async () => {
    if (!userId) return

    try {
      const tags = await getUserTags(userId)
      setUserTags(tags || [])
    } catch (err) {
      console.error('加载用户标签失败:', err)
    }
  }, [userId])

  // 切换收藏状态
  const toggleFavorite = useCallback(async (recordId) => {
    try {
      const newFavoriteStatus = await toggleFavoriteRecord(userId, recordId)
      
      setHistoryRecords(prev => prev.map(record => 
        record.id === recordId 
          ? { ...record, isFavorited: newFavoriteStatus }
          : record
      ))
      
      return newFavoriteStatus
    } catch (err) {
      console.error('切换收藏状态失败:', err)
      throw err
    }
  }, [userId])

  // 删除记录
  const deleteRecord = useCallback(async (recordId) => {
    try {
      await deleteHistoryRecord(userId, recordId)
      
      setHistoryRecords(prev => prev.filter(record => record.id !== recordId))
      
      return true
    } catch (err) {
      console.error('删除记录失败:', err)
      throw err
    }
  }, [userId])

  // 重新使用记录
  const reuseRecord = useCallback(async (recordId) => {
    try {
      await incrementUsageCount(userId, recordId)
      
      setHistoryRecords(prev => prev.map(record => 
        record.id === recordId 
          ? { 
              ...record, 
              usageCount: (record.usageCount || 0) + 1,
              lastUsedAt: new Date().toISOString()
            }
          : record
      ))
      
      return true
    } catch (err) {
      console.error('更新使用次数失败:', err)
      throw err
    }
  }, [userId])

  // 更新记录标签
  const updateRecordTags = useCallback(async (recordId, newTags) => {
    try {
      await updateHistoryRecord(userId, recordId, { tags: newTags })
      
      setHistoryRecords(prev => prev.map(record => 
        record.id === recordId 
          ? { ...record, tags: newTags }
          : record
      ))

      // 更新用户标签库
      const uniqueTags = [...new Set(newTags)]
      for (const tag of uniqueTags) {
        if (!userTags.includes(tag)) {
          await addUserTag(userId, tag)
          setUserTags(prev => [...prev, tag].sort())
        }
      }
      
      return true
    } catch (err) {
      console.error('更新标签失败:', err)
      throw err
    }
  }, [userId, userTags])

  // 添加备注
  const updateRecordNotes = useCallback(async (recordId, notes) => {
    try {
      await updateHistoryRecord(userId, recordId, { notes })
      
      setHistoryRecords(prev => prev.map(record => 
        record.id === recordId 
          ? { ...record, notes }
          : record
      ))
      
      return true
    } catch (err) {
      console.error('更新备注失败:', err)
      throw err
    }
  }, [userId])

  // 初始化加载
  useEffect(() => {
    loadHistory()
    loadUserTags()
  }, [loadHistory, loadUserTags])

  // 返回状态和方法
  return {
    // 状态
    historyRecords,
    userTags,
    isLoading,
    error,
    
    // 方法
    loadHistory,
    loadUserTags,
    toggleFavorite,
    deleteRecord,
    reuseRecord,
    updateRecordTags,
    updateRecordNotes,
    
    // 辅助方法
    refresh: () => {
      loadHistory()
      loadUserTags()
    }
  }
}