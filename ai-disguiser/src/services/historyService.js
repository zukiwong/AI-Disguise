// 历史记录服务层
// 负责历史记录的云端存储和管理

import { db, COLLECTIONS } from './firebase.js'
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore'

/**
 * 创建历史记录数据结构
 */
export const createHistoryRecord = ({
  original,
  disguised,
  conversionMode,
  style = null,
  variant = null,
  purpose = null,
  recipient = null,
  outputLanguage,
  detectedLanguage,
  tags = [],
  isFavorited = false,
  notes = ''
}) => {
  const timestamp = new Date().toISOString()
  return {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // 生成唯一ID
    original,
    disguised,
    conversionMode,
    style,
    variant,
    purpose,
    recipient,
    outputLanguage,
    detectedLanguage,
    tags,
    isFavorited,
    notes,
    usageCount: 0, // 被重新使用次数
    lastUsedAt: null, // 最后使用时间
    createdAt: timestamp,
    updatedAt: timestamp
  }
}

/**
 * 获取用户的历史记录
 */
export const getUserHistory = async (userId) => {
  try {
    if (!userId) {
      return []
    }

    const userRef = doc(db, COLLECTIONS.USERS, userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()
      return userData.historyRecords || []
    }

    return []
  } catch (error) {
    console.error('获取用户历史记录失败:', error)
    return []
  }
}

/**
 * 添加历史记录
 */
export const addHistoryRecord = async (userId, recordData) => {
  try {
    if (!userId) {
      throw new Error('用户ID不能为空')
    }

    const historyRecord = createHistoryRecord(recordData)
    const userRef = doc(db, COLLECTIONS.USERS, userId)

    // 获取当前历史记录
    const userDoc = await getDoc(userRef)
    if (userDoc.exists()) {
      const userData = userDoc.data()
      const currentHistory = userData.historyRecords || []

      // 限制历史记录数量，保留最新的50条
      const updatedHistory = [historyRecord, ...currentHistory.slice(0, 49)]

      await updateDoc(userRef, {
        historyRecords: updatedHistory,
        updatedAt: serverTimestamp()
      })

      return historyRecord
    } else {
      throw new Error('用户不存在')
    }
  } catch (error) {
    console.error('添加历史记录失败:', error)
    throw new Error('添加历史记录失败')
  }
}

/**
 * 更新历史记录
 */
export const updateHistoryRecord = async (userId, recordId, updateData) => {
  try {
    if (!userId || !recordId) {
      throw new Error('用户ID和记录ID不能为空')
    }

    const userRef = doc(db, COLLECTIONS.USERS, userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()
      const historyRecords = userData.historyRecords || []

      // 找到要更新的记录
      const updatedRecords = historyRecords.map(record => {
        if (record.id === recordId) {
          return {
            ...record,
            ...updateData,
            updatedAt: new Date().toISOString()
          }
        }
        return record
      })

      await updateDoc(userRef, {
        historyRecords: updatedRecords,
        updatedAt: serverTimestamp()
      })

      return true
    } else {
      throw new Error('用户不存在')
    }
  } catch (error) {
    console.error('更新历史记录失败:', error)
    throw new Error('更新历史记录失败')
  }
}

/**
 * 删除历史记录
 */
export const deleteHistoryRecord = async (userId, recordId) => {
  try {
    if (!userId || !recordId) {
      throw new Error('用户ID和记录ID不能为空')
    }

    const userRef = doc(db, COLLECTIONS.USERS, userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()
      const historyRecords = userData.historyRecords || []

      // 过滤掉要删除的记录
      const filteredRecords = historyRecords.filter(record => record.id !== recordId)

      await updateDoc(userRef, {
        historyRecords: filteredRecords,
        updatedAt: serverTimestamp()
      })

      return true
    } else {
      throw new Error('用户不存在')
    }
  } catch (error) {
    console.error('删除历史记录失败:', error)
    throw new Error('删除历史记录失败')
  }
}

/**
 * 标记/取消标记为收藏
 */
export const toggleFavoriteRecord = async (userId, recordId) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()
      const historyRecords = userData.historyRecords || []

      const updatedRecords = historyRecords.map(record => {
        if (record.id === recordId) {
          return {
            ...record,
            isFavorited: !record.isFavorited,
            updatedAt: new Date().toISOString()
          }
        }
        return record
      })

      await updateDoc(userRef, {
        historyRecords: updatedRecords,
        updatedAt: serverTimestamp()
      })

      // 返回新的收藏状态
      const updatedRecord = updatedRecords.find(record => record.id === recordId)
      return updatedRecord ? updatedRecord.isFavorited : false
    }

    return false
  } catch (error) {
    console.error('切换收藏状态失败:', error)
    throw new Error('操作失败')
  }
}

/**
 * 增加使用次数
 */
export const incrementUsageCount = async (userId, recordId) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()
      const historyRecords = userData.historyRecords || []

      const updatedRecords = historyRecords.map(record => {
        if (record.id === recordId) {
          return {
            ...record,
            usageCount: (record.usageCount || 0) + 1,
            lastUsedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
        return record
      })

      await updateDoc(userRef, {
        historyRecords: updatedRecords,
        updatedAt: serverTimestamp()
      })

      return true
    }

    return false
  } catch (error) {
    console.error('更新使用次数失败:', error)
    return false
  }
}

/**
 * 获取用户标签库
 */
export const getUserTags = async (userId) => {
  try {
    if (!userId) {
      return []
    }

    const userRef = doc(db, COLLECTIONS.USERS, userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()
      return userData.historyTags || []
    }

    return []
  } catch (error) {
    console.error('获取用户标签失败:', error)
    return []
  }
}

/**
 * 添加标签到用户标签库
 */
export const addUserTag = async (userId, tag) => {
  try {
    if (!userId || !tag.trim()) {
      return false
    }

    const userRef = doc(db, COLLECTIONS.USERS, userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()
      const currentTags = userData.historyTags || []

      // 检查标签是否已存在
      if (!currentTags.includes(tag.trim())) {
        await updateDoc(userRef, {
          historyTags: arrayUnion(tag.trim()),
          updatedAt: serverTimestamp()
        })
      }

      return true
    }

    return false
  } catch (error) {
    console.error('添加标签失败:', error)
    return false
  }
}

/**
 * 从用户标签库删除标签
 */
export const removeUserTag = async (userId, tag) => {
  try {
    if (!userId || !tag) {
      return false
    }

    const userRef = doc(db, COLLECTIONS.USERS, userId)

    await updateDoc(userRef, {
      historyTags: arrayRemove(tag),
      updatedAt: serverTimestamp()
    })

    return true
  } catch (error) {
    console.error('删除标签失败:', error)
    return false
  }
}

/**
 * 更新用户历史偏好设置
 */
export const updateHistoryPreferences = async (userId, preferences) => {
  try {
    if (!userId) {
      return false
    }

    const userRef = doc(db, COLLECTIONS.USERS, userId)

    await updateDoc(userRef, {
      historyPreferences: preferences,
      updatedAt: serverTimestamp()
    })

    return true
  } catch (error) {
    console.error('更新历史偏好失败:', error)
    return false
  }
}

/**
 * 获取用户历史偏好设置
 */
export const getUserHistoryPreferences = async (userId) => {
  try {
    if (!userId) {
      return {
        defaultView: 'list',
        itemsPerPage: 20,
        autoSaveTags: true,
        showTimestamp: true
      }
    }

    const userRef = doc(db, COLLECTIONS.USERS, userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const userData = userDoc.data()
      return userData.historyPreferences || {
        defaultView: 'list',
        itemsPerPage: 20,
        autoSaveTags: true,
        showTimestamp: true
      }
    }

    return {
      defaultView: 'list',
      itemsPerPage: 20,
      autoSaveTags: true,
      showTimestamp: true
    }
  } catch (error) {
    console.error('获取历史偏好失败:', error)
    return {
      defaultView: 'list',
      itemsPerPage: 20,
      autoSaveTags: true,
      showTimestamp: true
    }
  }
}

/**
 * 批量清空历史记录
 */
export const clearAllHistory = async (userId) => {
  try {
    if (!userId) {
      throw new Error('用户ID不能为空')
    }

    const userRef = doc(db, COLLECTIONS.USERS, userId)

    await updateDoc(userRef, {
      historyRecords: [],
      updatedAt: serverTimestamp()
    })

    return true
  } catch (error) {
    console.error('清空历史记录失败:', error)
    throw new Error('清空历史记录失败')
  }
}

/**
 * 搜索历史记录
 */
export const searchHistoryRecords = (historyRecords, query, filters = {}) => {
  if (!historyRecords || historyRecords.length === 0) {
    return []
  }

  let filteredRecords = [...historyRecords]

  // 关键词搜索
  if (query && query.trim()) {
    const searchQuery = query.toLowerCase().trim()
    filteredRecords = filteredRecords.filter(record => {
      const searchableText = [
        record.original,
        record.disguised,
        ...(record.tags || []),
        record.notes || ''
      ].join(' ').toLowerCase()
      
      return searchableText.includes(searchQuery)
    })
  }

  // 按标签筛选
  if (filters.tags && filters.tags.length > 0) {
    filteredRecords = filteredRecords.filter(record => {
      return filters.tags.some(tag => record.tags && record.tags.includes(tag))
    })
  }

  // 按风格筛选
  if (filters.style) {
    filteredRecords = filteredRecords.filter(record => {
      return record.style === filters.style
    })
  }

  // 按转换模式筛选
  if (filters.conversionMode) {
    filteredRecords = filteredRecords.filter(record => {
      return record.conversionMode === filters.conversionMode
    })
  }

  // 按收藏状态筛选
  if (filters.favoriteOnly) {
    filteredRecords = filteredRecords.filter(record => record.isFavorited)
  }

  // 按时间范围筛选
  if (filters.dateRange) {
    const { start, end } = filters.dateRange
    filteredRecords = filteredRecords.filter(record => {
      const recordDate = new Date(record.createdAt)
      return recordDate >= start && recordDate <= end
    })
  }

  return filteredRecords
}