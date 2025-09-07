// 变体管理服务层
// 负责风格变体的 CRUD 操作

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
  serverTimestamp,
  limit 
} from 'firebase/firestore'

// 变体数据结构
export const createVariantData = ({
  name,
  description,
  promptOverride = '',
  createdBy = 'anonymous',
  isPublic = true
}) => ({
  name,
  description,
  promptOverride,
  createdBy,
  isPublic: Boolean(isPublic),
  usageCount: 0,
  createdAt: serverTimestamp()
})

// 获取指定风格的所有变体
export const getVariantsByStyleId = async (styleId) => {
  try {
    // console.log('🔍 开始获取变体:', styleId)
    
    const variantsRef = collection(db, COLLECTIONS.STYLES, styleId, 'variants')
    const q = query(
      variantsRef,
      where('isPublic', '==', true)
    )
    
    const querySnapshot = await getDocs(q)
    const variants = []
    
    // console.log('🔍 查询到的文档数量:', querySnapshot.size)
    
    querySnapshot.forEach((doc) => {
      const variantData = {
        id: doc.id,
        styleId,
        ...doc.data()
      }
      // console.log('🔍 找到变体:', variantData)
      variants.push(variantData)
    })
    
    // 在客户端进行排序，避免Firestore复合索引要求
    variants.sort((a, b) => {
      // 首先按使用次数降序排序
      const usageCountA = a.usageCount || 0
      const usageCountB = b.usageCount || 0
      if (usageCountB !== usageCountA) {
        return usageCountB - usageCountA
      }
      
      // 使用次数相同时按创建时间降序排序
      const timeA = a.createdAt?.toDate?.() || new Date(0)
      const timeB = b.createdAt?.toDate?.() || new Date(0)
      return timeB - timeA
    })
    
    // console.log('✅ 最终返回的变体列表:', variants)
    
    return variants
  } catch (error) {
    console.error('❌ 获取变体失败:', error)
    console.error('❌ 失败时的styleId:', styleId)
    throw error
  }
}

// 获取指定风格的前N个变体（用于卡片显示）
export const getTopVariantsByStyleId = async (styleId, limitCount = 3) => {
  try {
    // 复用getAllVariants并截取前N个
    const allVariants = await getVariantsByStyleId(styleId)
    return allVariants.slice(0, limitCount)
  } catch (error) {
    console.error('获取热门变体失败:', error)
    throw error
  }
}

// 创建新变体
export const createVariant = async (styleId, variantData) => {
  try {
    // console.log('🔥 创建变体开始:', styleId)
    
    const variantsRef = collection(db, COLLECTIONS.STYLES, styleId, 'variants')
    const newVariant = createVariantData(variantData)
    
    // console.log('🔥 准备写入的变体数据:', newVariant)
    
    const docRef = await addDoc(variantsRef, newVariant)
    
    // console.log('✅ 变体创建成功:', docRef.id)
    
    const result = {
      id: docRef.id,
      styleId,
      ...newVariant
    }
    
    // console.log('✅ 返回的变体数据:', result)
    
    return result
  } catch (error) {
    console.error('❌ 创建变体失败:', error)
    console.error('❌ 失败时的参数:', { styleId, variantData })
    throw error
  }
}

// 更新变体使用次数
export const incrementVariantUsage = async (styleId, variantId) => {
  try {
    const variantRef = doc(db, COLLECTIONS.STYLES, styleId, 'variants', variantId)
    const variantDoc = await getDoc(variantRef)
    
    if (variantDoc.exists()) {
      const currentUsage = variantDoc.data().usageCount || 0
      await updateDoc(variantRef, {
        usageCount: currentUsage + 1
      })
    }
  } catch (error) {
    console.error('更新变体使用次数失败:', error)
    // 不抛出错误，避免影响主要功能
  }
}

// 获取单个变体详情
export const getVariantById = async (styleId, variantId) => {
  try {
    const variantRef = doc(db, COLLECTIONS.STYLES, styleId, 'variants', variantId)
    const variantDoc = await getDoc(variantRef)
    
    if (variantDoc.exists()) {
      return {
        id: variantDoc.id,
        styleId,
        ...variantDoc.data()
      }
    }
    
    return null
  } catch (error) {
    console.error('获取变体详情失败:', error)
    throw error
  }
}

// 删除变体（仅限创建者或管理员）
export const deleteVariant = async (styleId, variantId, userId) => {
  try {
    const variantRef = doc(db, COLLECTIONS.STYLES, styleId, 'variants', variantId)
    const variantDoc = await getDoc(variantRef)
    
    if (!variantDoc.exists()) {
      throw new Error('变体不存在')
    }
    
    const variantData = variantDoc.data()
    
    // 权限检查：只有创建者可以删除
    if (variantData.createdBy !== userId) {
      throw new Error('无权限删除此变体')
    }
    
    await deleteDoc(variantRef)
    return true
  } catch (error) {
    console.error('删除变体失败:', error)
    throw error
  }
}

// 更新变体信息
export const updateVariant = async (styleId, variantId, updateData, userId) => {
  try {
    const variantRef = doc(db, COLLECTIONS.STYLES, styleId, 'variants', variantId)
    const variantDoc = await getDoc(variantRef)
    
    if (!variantDoc.exists()) {
      throw new Error('变体不存在')
    }
    
    const variantData = variantDoc.data()
    
    // 权限检查：只有创建者可以编辑
    if (variantData.createdBy !== userId) {
      throw new Error('无权限编辑此变体')
    }
    
    // 过滤允许更新的字段
    const allowedFields = ['name', 'description', 'promptOverride', 'isPublic']
    const filteredUpdateData = {}
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdateData[key] = updateData[key]
      }
    })
    
    filteredUpdateData.updatedAt = serverTimestamp()
    
    await updateDoc(variantRef, filteredUpdateData)
    
    return {
      id: variantId,
      styleId,
      ...variantData,
      ...filteredUpdateData
    }
  } catch (error) {
    console.error('更新变体失败:', error)
    throw error
  }
}

// 批量获取多个风格的变体信息（用于探索页面）
export const getVariantsForMultipleStyles = async (styleIds) => {
  try {
    const variantsByStyle = {}
    
    // 并行获取所有风格的变体
    const promises = styleIds.map(async (styleId) => {
      const variants = await getTopVariantsByStyleId(styleId, 3)
      variantsByStyle[styleId] = variants
      return { styleId, variantCount: variants.length }
    })
    
    await Promise.all(promises)
    
    return variantsByStyle
  } catch (error) {
    console.error('批量获取变体失败:', error)
    throw error
  }
}