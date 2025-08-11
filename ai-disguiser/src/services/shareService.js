// 分享服务层
// 负责管理用户分享内容的CRUD操作

import { db, COLLECTIONS } from './firebase.js'
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp 
} from 'firebase/firestore'

// 分享内容数据结构
export const createShareData = ({
  originalText,
  transformedText,
  conversionMode,
  styleInfo,
  purposeInfo,
  recipientInfo,
  outputLanguage,
  detectedLanguage,
  authorId,
  authorName,
  isPublic = true
}) => {
  // 基础数据结构
  const baseData = {
    originalText,
    transformedText,
    conversionMode, // 'style', 'custom_style', 'purpose'
    outputLanguage,
    detectedLanguage,
    authorId,
    authorName,
    isPublic,
    likes: 0,
    likedBy: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }

  // 只添加非空的可选字段
  if (styleInfo && styleInfo !== null && styleInfo !== undefined) {
    baseData.styleInfo = styleInfo
  }
  
  if (purposeInfo && purposeInfo !== null && purposeInfo !== undefined) {
    baseData.purposeInfo = purposeInfo
  }
  
  if (recipientInfo && recipientInfo !== null && recipientInfo !== undefined) {
    baseData.recipientInfo = recipientInfo
  }

  return baseData
}

// 创建分享内容
export const createShare = async (shareData) => {
  try {
    const sharesRef = collection(db, COLLECTIONS.POSTS)
    const processedData = createShareData(shareData)
    const docRef = await addDoc(sharesRef, processedData)
    
    return {
      id: docRef.id,
      ...processedData,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  } catch (error) {
    console.error('创建分享内容失败:', error)
    throw new Error('分享失败，请稍后重试')
  }
}

// 获取公共分享内容
export const getPublicShares = async (limitCount = 20) => {
  try {
    const sharesRef = collection(db, COLLECTIONS.POSTS)
    // 暂时简化查询，避免复合索引问题
    // 只按创建时间排序，在客户端过滤 isPublic 字段
    const q = query(
      sharesRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount * 2) // 获取更多数据以确保有足够的公共内容
    )
    
    const querySnapshot = await getDocs(q)
    const shares = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      // 在客户端过滤公共内容
      if (data.isPublic === true) {
        shares.push({
          id: doc.id,
          ...data
        })
      }
    })
    
    // 限制返回的数量
    return shares.slice(0, limitCount)
  } catch (error) {
    console.error('获取分享内容失败:', error)
    
    // 如果仍然失败，尝试最简单的查询
    try {
      const sharesRef = collection(db, COLLECTIONS.POSTS)
      const q = query(sharesRef, limit(limitCount))
      
      const querySnapshot = await getDocs(q)
      const shares = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        // 在客户端过滤公共内容
        if (data.isPublic === true) {
          shares.push({
            id: doc.id,
            ...data
          })
        }
      })
      
      return shares.slice(0, limitCount)
    } catch (fallbackError) {
      console.error('备用查询也失败:', fallbackError)
      return []
    }
  }
}

// 获取用户的分享内容
export const getUserShares = async (userId) => {
  try {
    if (!userId) {
      console.log('getUserShares: userId 为空')
      return []
    }
    
    console.log('getUserShares: 查询用户分享内容，userId=', userId)
    const sharesRef = collection(db, COLLECTIONS.POSTS)
    const q = query(
      sharesRef,
      where('authorId', '==', userId)
      // 暂时移除 orderBy 以避免索引问题
      // orderBy('createdAt', 'desc')
    )
    
    console.log('getUserShares: 执行查询...')
    const querySnapshot = await getDocs(q)
    const shares = []
    
    console.log('getUserShares: 查询结果数量=', querySnapshot.size)
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      console.log('getUserShares: 找到分享记录=', { id: doc.id, authorId: data.authorId, originalText: data.originalText?.substring(0, 50) })
      shares.push({
        id: doc.id,
        ...data
      })
    })
    
    // 在客户端按创建时间倒序排列
    shares.sort((a, b) => {
      const aTime = a.createdAt?.toMillis() || 0
      const bTime = b.createdAt?.toMillis() || 0
      return bTime - aTime
    })
    
    console.log('getUserShares: 最终返回的分享数量=', shares.length)
    return shares
  } catch (error) {
    console.error('获取用户分享内容失败:', error)
    return []
  }
}

// 点赞/取消点赞
export const toggleLike = async (shareId, userId) => {
  try {
    const shareRef = doc(db, COLLECTIONS.POSTS, shareId)
    
    // 使用 getDoc 替代过时的 get() 方法
    const shareDoc = await getDoc(shareRef)
    if (shareDoc.exists()) {
      const data = shareDoc.data()
      const likedBy = data.likedBy || []
      const isLiked = likedBy.includes(userId)
      
      const newLikedBy = isLiked 
        ? likedBy.filter(id => id !== userId)
        : [...likedBy, userId]
      
      await updateDoc(shareRef, {
        likedBy: newLikedBy,
        likes: newLikedBy.length,
        updatedAt: serverTimestamp()
      })
      
      return !isLiked
    }
    
    return false
  } catch (error) {
    console.error('点赞操作失败:', error)
    throw new Error('点赞失败，请稍后重试')
  }
}

// 删除分享内容
export const deleteShare = async (shareId) => {
  try {
    const shareRef = doc(db, COLLECTIONS.POSTS, shareId)
    await deleteDoc(shareRef)
    return true
  } catch (error) {
    console.error('删除分享内容失败:', error)
    throw new Error('删除失败，请稍后重试')
  }
}

// 更新分享内容的可见性
export const updateShareVisibility = async (shareId, isPublic) => {
  try {
    const shareRef = doc(db, COLLECTIONS.POSTS, shareId)
    await updateDoc(shareRef, {
      isPublic,
      updatedAt: serverTimestamp()
    })
    return true
  } catch (error) {
    console.error('更新分享可见性失败:', error)
    throw new Error('更新失败，请稍后重试')
  }
}