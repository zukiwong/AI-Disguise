// 风格管理服务层
// 负责风格数据的 CRUD 操作

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
  serverTimestamp 
} from 'firebase/firestore'
import { getVariantsForMultipleStyles } from './variantService.js'

// 风格数据结构接口
export const createStyleData = ({
  name,
  displayName,
  description,
  promptTemplate = '',
  isPublic = false,
  createdBy = 'anonymous'
}) => ({
  name,
  displayName,
  description,
  promptTemplate,
  isPublic: Boolean(isPublic), // 确保是布尔值
  createdBy,
  createdAt: serverTimestamp()
})

// 获取探索页的所有公共风格（开放浏览策略 - 不应用个人隐藏过滤）
export const getPublicStylesForExplore = async () => {
  try {
    const stylesRef = collection(db, COLLECTIONS.STYLES)
    const q = query(
      stylesRef, 
      where('isPublic', '==', true)
    )
    const querySnapshot = await getDocs(q)
    
    const firestoreStyles = []
    querySnapshot.forEach((doc) => {
      // 探索页始终显示所有公共风格，不应用隐藏过滤
      firestoreStyles.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    // 如果 Firestore 中有数据，优先使用 Firestore 数据
    if (firestoreStyles.length > 0) {
      // console.log('🔍 从 Firestore 获取到的风格:', firestoreStyles)
      
      // 按优先级排序：官方风格在前，其他按使用次数排序
      const sortedStyles = firestoreStyles.sort((a, b) => {
        // 首先按创建者排序：system 在前
        if (a.createdBy === 'system' && b.createdBy !== 'system') {
          return -1 // a 在前
        }
        if (a.createdBy !== 'system' && b.createdBy === 'system') {
          return 1 // b 在前
        }
        
        // 如果都是 system 或都不是 system，按固定顺序排列官方风格
        if (a.createdBy === 'system' && b.createdBy === 'system') {
          const officialOrder = ['chat', 'poem', 'social', 'story']
          const aIndex = officialOrder.indexOf(a.name)
          const bIndex = officialOrder.indexOf(b.name)
          
          // 如果都在官方列表中，按顺序排列
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex
          }
          // 如果只有一个在官方列表中，在列表中的排前面
          if (aIndex !== -1) return -1
          if (bIndex !== -1) return 1
        }
        
        // 对于非官方风格，按使用次数降序排序
        const usageA = a.usageCount || 0
        const usageB = b.usageCount || 0
        if (usageB !== usageA) {
          return usageB - usageA
        }
        
        // 使用次数相同时按创建时间降序排序（最新的在前）
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
        return timeB - timeA
      })
      
      // console.log('✅ 排序后的风格:', sortedStyles.length)
      
      return sortedStyles
    }
    
    // 如果 Firestore 中没有数据，返回默认风格
    return getDefaultStyles()
    
  } catch (error) {
    console.error('获取探索页公共风格失败:', error)
    // 发生错误时返回默认风格
    return getDefaultStyles()
  }
}

// 获取所有公共风格（根据登录状态返回不同内容）
export const getPublicStyles = async (isAuthenticated = false, userId = null) => {
  // 先返回默认风格，确保未登录用户也能使用
  const defaultStyles = getDefaultStyles()
  
  // 🔑 未登录用户只能看到默认的4个风格，但需要加载变体数据
  if (!isAuthenticated) {
    try {
      // 获取所有风格ID
      const styleIds = defaultStyles.map(style => style.id)
      
      // 批量获取变体信息
      const variantsByStyle = await getVariantsForMultipleStyles(styleIds)
      
      // 合并风格和变体数据
      const stylesWithVariants = defaultStyles.map(style => ({
        ...style,
        variants: variantsByStyle[style.id] || [],
        hasVariants: (variantsByStyle[style.id] || []).length > 0
      }))
      
      console.log('📦 为未登录用户加载了默认样式的变体数据:', stylesWithVariants.length, '个样式')
      return stylesWithVariants
    } catch (error) {
      console.error('为默认样式加载变体失败:', error)
      return defaultStyles
    }
  }
  
  // 🔓 登录用户可以看到添加到账户的公共风格（排除隐藏的）
  try {
    // 获取用户隐藏的风格列表和添加到账户的风格列表
    let hiddenStyles = []
    let addedStyles = []
    if (userId) {
      const { getUserHiddenStyles, getUserAddedStyles } = await import('./authService.js')
      hiddenStyles = await getUserHiddenStyles(userId)
      addedStyles = await getUserAddedStyles(userId)
    }
    
    // 获取用户添加到账户的公共风格
    const accountPublicStyles = []
    
    if (addedStyles.length > 0) {
      const stylesRef = collection(db, COLLECTIONS.STYLES)
      const q = query(
        stylesRef, 
        where('isPublic', '==', true)
      )
      const querySnapshot = await getDocs(q)
      
      querySnapshot.forEach((doc) => {
        // 只包含用户添加到账户且未隐藏的风格
        if (addedStyles.includes(doc.id) && !hiddenStyles.includes(doc.id)) {
          accountPublicStyles.push({
            id: doc.id,
            ...doc.data()
          })
        }
      })
    }
    
    // 处理默认风格 - 除非用户主动隐藏，否则始终包含在账户中
    const accountDefaultStyles = []
    for (const defaultStyle of defaultStyles) {
      if (!hiddenStyles.includes(defaultStyle.id)) {
        accountDefaultStyles.push(defaultStyle)
      }
    }
    
    
    // 合并用户账户中的公共风格，同时为所有样式加载变体数据
    const allAccountStyles = [...accountDefaultStyles, ...accountPublicStyles]
    
    try {
      // 获取所有风格ID
      const styleIds = allAccountStyles.map(style => style.id)
      
      // 批量获取变体信息
      const variantsByStyle = await getVariantsForMultipleStyles(styleIds)
      
      // 合并风格和变体数据
      const stylesWithVariants = allAccountStyles.map(style => ({
        ...style,
        variants: variantsByStyle[style.id] || [],
        hasVariants: (variantsByStyle[style.id] || []).length > 0
      }))
      
      console.log('📦 为登录用户加载了账户样式的变体数据:', stylesWithVariants.length, '个样式')
      return stylesWithVariants
    } catch (error) {
      console.error('为账户样式加载变体失败:', error)
      return allAccountStyles
    }
    
  } catch (error) {
    console.error('获取公共风格失败:', error)
    // 发生错误时返回带变体的默认风格，确保应用可用
    try {
      // 获取所有风格ID
      const styleIds = defaultStyles.map(style => style.id)
      
      // 批量获取变体信息
      const variantsByStyle = await getVariantsForMultipleStyles(styleIds)
      
      // 合并风格和变体数据
      const defaultStylesWithVariants = defaultStyles.map(style => ({
        ...style,
        variants: variantsByStyle[style.id] || [],
        hasVariants: (variantsByStyle[style.id] || []).length > 0
      }))
      
      console.log('🔄 错误恢复: 为默认样式加载了变体数据')
      return defaultStylesWithVariants
    } catch (variantError) {
      console.error('错误恢复时加载变体也失败:', variantError)
      return defaultStyles
    }
  }
}

// 获取用户私有风格
export const getUserStyles = async (userId) => {
  try {
    if (!userId) {
      return []
    }
    
    const stylesRef = collection(db, COLLECTIONS.STYLES)
    const q = query(
      stylesRef,
      where('createdBy', '==', userId),
      where('isPublic', '==', false)
    )
    
    const querySnapshot = await getDocs(q)
    const styles = []
    
    querySnapshot.forEach((doc) => {
      styles.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return styles
    
  } catch (error) {
    console.error('获取用户风格失败:', error)
    return []
  }
}

// 获取登录用户的专用风格数据（简化版本）
export const getUserStylesWithVariants = async (userId) => {
  try {
    if (!userId) {
      // 未登录用户：查询 Firestore 中的系统风格，如果没有则使用默认数据
      try {
        const stylesRef = collection(db, COLLECTIONS.STYLES)
        const q = query(stylesRef, where('createdBy', '==', 'system'))
        const querySnapshot = await getDocs(q)
        
        if (querySnapshot.empty) {
          return getDefaultStyles()
        }
        
        const systemStyles = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          systemStyles.push({
            id: doc.id, // 使用 Firestore 文档 ID
            ...data
          })
        })
        
        // 获取每个风格的变体
        const styleIds = systemStyles.map(style => style.id)
        const variantsByStyle = await getVariantsForMultipleStyles(styleIds)
        
        const result = systemStyles.map(style => ({
          ...style,
          variants: variantsByStyle[style.id] || [],
          hasVariants: (variantsByStyle[style.id] || []).length > 0
        }))
        
        return result
        
      } catch (error) {
        console.error('查询系统风格失败:', error)
        return getDefaultStyles()
      }
    }

    // 登录用户：从 Firestore 查询系统风格 + 用户添加的公共风格 + 用户私有风格
    
    // 获取用户的隐藏风格和添加的风格
    const { getUserHiddenStyles, getUserAddedStyles } = await import('./authService.js')
    const [hiddenStyles, addedStyles] = await Promise.all([
      getUserHiddenStyles(userId),
      getUserAddedStyles(userId)
    ])
    
    // 1. 从 Firestore 查询系统风格（排除被隐藏的）
    let visibleSystemStyles = []
    try {
      const stylesRef = collection(db, COLLECTIONS.STYLES)
      const systemQuery = query(stylesRef, where('createdBy', '==', 'system'))
      const systemSnapshot = await getDocs(systemQuery)
      
      systemSnapshot.forEach((doc) => {
        if (!hiddenStyles.includes(doc.id)) {
          const data = doc.data()
          visibleSystemStyles.push({
            id: doc.id, // 使用真实的 Firestore 文档 ID
            ...data
          })
        }
      })
    } catch (error) {
      console.error('查询系统风格失败:', error)
      // 回退到硬编码数据
      visibleSystemStyles = getDefaultStyles().filter(style => !hiddenStyles.includes(style.id))
    }
    
    // 2. 获取用户添加的公共风格
    let addedPublicStyles = []
    if (addedStyles.length > 0) {
      const stylesRef = collection(db, COLLECTIONS.STYLES)
      const q = query(stylesRef, where('isPublic', '==', true))
      const querySnapshot = await getDocs(q)
      
      querySnapshot.forEach((doc) => {
        if (addedStyles.includes(doc.id) && !hiddenStyles.includes(doc.id)) {
          addedPublicStyles.push({ id: doc.id, ...doc.data() })
        }
      })
    }
    
    // 3. 获取用户私有风格
    const userPrivateStyles = await getUserStyles(userId)
    
    // 4. 合并所有风格
    const allStyles = [...visibleSystemStyles, ...addedPublicStyles, ...userPrivateStyles]
    
    // 5. 批量获取变体信息
    const styleIds = allStyles.map(style => style.id)
    const variantsByStyle = await getVariantsForMultipleStyles(styleIds)
    
    // 6. 合并风格和变体数据
    const stylesWithVariants = allStyles.map(style => ({
      ...style,
      variants: variantsByStyle[style.id] || [],
      hasVariants: (variantsByStyle[style.id] || []).length > 0
    }))
    
    return stylesWithVariants
    
  } catch (error) {
    console.error('获取用户风格失败:', error)
    // 错误恢复：返回带变体的默认风格
    try {
      const defaultStyles = getDefaultStyles()
      const styleIds = defaultStyles.map(style => style.id)
      const variantsByStyle = await getVariantsForMultipleStyles(styleIds)
      
      return defaultStyles.map(style => ({
        ...style,
        variants: variantsByStyle[style.id] || [],
        hasVariants: (variantsByStyle[style.id] || []).length > 0
      }))
    } catch (variantError) {
      console.error('错误恢复时加载变体也失败:', variantError)
      return getDefaultStyles()
    }
  }
}

// 获取所有可用风格（公共 + 用户私有，包含变体信息）
export const getAllAvailableStyles = async (userId = null) => {
  // 使用新的简化函数
  return getUserStylesWithVariants(userId)
}

// 创建新风格
export const createStyle = async (styleData) => {
  try {
    const stylesRef = collection(db, COLLECTIONS.STYLES)
    const processedData = createStyleData(styleData)
    const docRef = await addDoc(stylesRef, processedData)
    
    // 创建客户端安全的返回数据，避免 serverTimestamp 问题
    const result = {
      id: docRef.id,
      name: styleData.name,
      displayName: styleData.displayName,
      description: styleData.description,
      promptTemplate: styleData.promptTemplate || '',
      isPublic: Boolean(styleData.isPublic),
      createdBy: styleData.createdBy || 'anonymous',
      createdAt: new Date() // 使用当前时间而不是 serverTimestamp
    }
    
    return result
  } catch (error) {
    console.error('创建风格失败:', error)
    throw new Error('创建风格失败')
  }
}

// 更新风格
export const updateStyle = async (styleId, updateData) => {
  try {
    const styleRef = doc(db, COLLECTIONS.STYLES, styleId)
    await updateDoc(styleRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    })
    
    return true
  } catch (error) {
    console.error('更新风格失败:', error)
    throw new Error('更新风格失败')
  }
}

// 删除风格
export const deleteStyle = async (styleId) => {
  try {
    const styleRef = doc(db, COLLECTIONS.STYLES, styleId)
    await deleteDoc(styleRef)
    
    return true
  } catch (error) {
    console.error('删除风格失败:', error)
    throw new Error('删除风格失败')
  }
}

// 获取探索页的公共风格（包含变体信息）
export const getPublicStylesWithVariants = async (userId = null) => {
  try {
    // 先获取基础的公共风格数据
    const styles = await getPublicStylesForExplore(userId)
    
    if (styles.length === 0) {
      return []
    }
    
    // 获取所有风格ID
    const styleIds = styles.map(style => style.id)
    
    // 批量获取变体信息
    const variantsByStyle = await getVariantsForMultipleStyles(styleIds)
    
    // 合并风格和变体数据
    const stylesWithVariants = styles.map(style => ({
      ...style,
      variants: variantsByStyle[style.id] || [],
      hasVariants: (variantsByStyle[style.id] || []).length > 0
    }))
    
    return stylesWithVariants
  } catch (error) {
    console.error('获取包含变体的公共风格失败:', error)
    // 回退到基础数据
    return await getPublicStylesForExplore(userId)
  }
}

// 复制公共风格到用户私人风格
export const copyStyleToPrivate = async (userId, publicStyleId) => {
  try {
    // 先获取公共风格的数据
    const publicStyleRef = doc(db, COLLECTIONS.STYLES, publicStyleId)
    const publicStyleDoc = await getDoc(publicStyleRef)
    
    if (!publicStyleDoc.exists()) {
      throw new Error('要复制的风格不存在')
    }
    
    const publicStyleData = publicStyleDoc.data()
    
    // 创建私人风格副本
    const privateStyleData = {
      name: publicStyleData.name + '_copy',
      displayName: publicStyleData.displayName + ' (副本)',
      description: publicStyleData.description,
      promptTemplate: publicStyleData.promptTemplate || '',
      isPublic: false,
      createdBy: userId,
      copiedFrom: publicStyleId, // 记录复制来源
      copiedAt: serverTimestamp()
    }
    
    const stylesRef = collection(db, COLLECTIONS.STYLES)
    const docRef = await addDoc(stylesRef, createStyleData(privateStyleData))
    
    return {
      id: docRef.id,
      ...privateStyleData,
      createdAt: new Date()
    }
  } catch (error) {
    console.error('复制风格失败:', error)
    throw new Error('复制风格失败')
  }
}

// 获取系统默认风格（仅从 Firestore）
export const getSystemStyles = async () => {
  try {
    const stylesRef = collection(db, COLLECTIONS.STYLES)
    // 简化查询避免复合索引问题
    const q = query(
      stylesRef,
      where('createdBy', '==', 'system')
    )
    
    const querySnapshot = await getDocs(q)
    const systemStyles = []
    
    querySnapshot.forEach((doc) => {
      systemStyles.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    // 在客户端排序
    return systemStyles.sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt)
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt)
      return aTime - bTime
    })
  } catch (error) {
    console.error('获取系统风格失败:', error)
    return []
  }
}

// 清理重复风格和统一数据库结构
export const cleanDuplicateStyles = async () => {
  try {
    // console.log('🧹 开始清理重复风格和统一数据库结构...')
    
    const stylesRef = collection(db, COLLECTIONS.STYLES)
    const querySnapshot = await getDocs(stylesRef)
    
    const systemStylesData = getDefaultStylesData()
    
    // 按风格类型分组
    const styleGroups = {
      chat: [],
      poem: [],
      social: [],
      story: [],
      other: []
    }
    
    // 分析所有文档
    querySnapshot.forEach((docSnapshot) => {
      const docId = docSnapshot.id
      const docData = docSnapshot.data()
      
      // console.log(`🔍 分析文档: ${docId}`, docData)
      
      // 根据name或displayName或内容分类
      let category = 'other'
      const docStr = JSON.stringify(docData).toLowerCase()
      
      if (docData.name === 'chat' || docData.displayName === 'Chat Style' || docStr.includes('chat')) {
        category = 'chat'
      } else if (docData.name === 'poem' || docData.displayName === 'Poetic Style' || docStr.includes('poem') || docStr.includes('poetic')) {
        category = 'poem'
      } else if (docData.name === 'social' || docData.displayName === 'Social Style' || docStr.includes('social')) {
        category = 'social'
      } else if (docData.name === 'story' || docData.displayName === 'Story Style' || docStr.includes('story')) {
        category = 'story'
      }
      
      styleGroups[category].push({ id: docId, data: docData })
    })
    
    // console.log('📊 风格分组结果:', Object.keys(styleGroups).length)
    
    let cleanedCount = 0
    let mergedCount = 0
    
    // 处理每个分组
    for (const [styleName, docs] of Object.entries(styleGroups)) {
      if (styleName === 'other') continue // 跳过其他类型
      
      if (docs.length > 1) {
        // console.log(`🔧 发现 ${docs.length} 个 ${styleName} 风格，开始合并...`)
        
        // 找到最完整的文档作为主文档
        let primaryDoc = docs[0]
        
        // 检查哪个文档有变体
        for (const styleDoc of docs) {
          try {
            const variantsRef = collection(db, COLLECTIONS.STYLES, styleDoc.id, 'variants')
            const variantsSnapshot = await getDocs(variantsRef)
            if (variantsSnapshot.size > 0) {
              // console.log(`📁 文档 ${styleDoc.id} 有 ${variantsSnapshot.size} 个变体`)
              primaryDoc = styleDoc
              break
            }
          } catch {
            // console.log(`⚠️ 检查文档 ${styleDoc.id} 的变体时出错:`, error)
          }
        }
        
        // 获取对应的系统默认数据
        const defaultData = systemStylesData.find(s => s.name === styleName)
        if (!defaultData) {
          console.log(`⚠️ 找不到 ${styleName} 的默认数据`)
          continue
        }
        
        // 更新主文档为标准结构
        // console.log(`🔧 更新主文档 ${primaryDoc.id} 为标准结构`)
        const primaryDocRef = doc(db, COLLECTIONS.STYLES, primaryDoc.id)
        
        const standardData = {
          ...defaultData,
          createdAt: primaryDoc.data.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp()
        }
        
        await updateDoc(primaryDocRef, standardData)
        // console.log(`✅ 主文档 ${primaryDoc.id} 更新完成`)
        
        // 删除其他重复文档
        for (const docToDelete of docs) {
          if (docToDelete.id !== primaryDoc.id) {
            console.log(`🗑️ 删除重复文档: ${docToDelete.id}`)
            await deleteDoc(doc(db, COLLECTIONS.STYLES, docToDelete.id))
            cleanedCount++
          }
        }
        
        mergedCount++
      } else if (docs.length === 1) {
        // 只有一个文档，检查并更新为标准结构
        const singleDoc = docs[0]
        const defaultData = systemStylesData.find(s => s.name === styleName)
        
        if (defaultData) {
          // console.log(`🔧 更新单个文档 ${singleDoc.id} 为标准结构`)
          const docRef = doc(db, COLLECTIONS.STYLES, singleDoc.id)
          
          const standardData = {
            ...defaultData,
            createdAt: singleDoc.data.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp()
          }
          
          await updateDoc(docRef, standardData)
          // console.log(`✅ 文档 ${singleDoc.id} 更新完成`)
        }
      }
    }
    
    // console.log(`🎉 清理完成！删除了 ${cleanedCount} 个重复文档，合并了 ${mergedCount} 个风格组`)
    return { success: true, cleanedCount, mergedCount }
    
  } catch (error) {
    console.error('❌ 清理重复风格失败:', error)
    throw error
  }
}

// 初始化系统默认风格到 Firestore（已暂停使用）
export const initializeDefaultStyles = async () => {
  return getDefaultStyles()
}

// 默认风格数据定义（用于初始化）
const getDefaultStylesData = () => [
  {
    name: 'chat',
    displayName: 'Chat Style',
    description: 'Casual and relaxed conversational tone',
    promptTemplate: 'Transform the following text into a casual, friendly conversational style:'
  },
  {
    name: 'poem',
    displayName: 'Poetic Style', 
    description: 'Literary expression with poetic flair',
    promptTemplate: 'Transform the following text into poetic, literary expression with artistic flair:'
  },
  {
    name: 'social',
    displayName: 'Social Style',
    description: 'Expression suitable for social media',
    promptTemplate: 'Transform the following text into engaging social media style with appropriate tone:'
  },
  {
    name: 'story',
    displayName: 'Story Style',
    description: 'Narrative storytelling expression',
    promptTemplate: 'Transform the following text into narrative storytelling format:'
  }
]

// 默认风格数据（兜底方案）
const getDefaultStyles = () => [
  {
    id: 'chat',
    name: 'chat',
    displayName: 'Chat Style',
    description: 'Casual and relaxed conversational tone',
    promptTemplate: '',
    isPublic: true,
    createdBy: 'system'
  },
  {
    id: 'poem',
    name: 'poem',
    displayName: 'Poetic Style',
    description: 'Literary expression with poetic flair',
    promptTemplate: '',
    isPublic: true,
    createdBy: 'system'
  },
  {
    id: 'social',
    name: 'social',
    displayName: 'Social Style',
    description: 'Expression suitable for social media',
    promptTemplate: '',
    isPublic: true,
    createdBy: 'system'
  },
  {
    id: 'story',
    name: 'story',
    displayName: 'Story Style',
    description: 'Narrative storytelling expression',
    promptTemplate: '',
    isPublic: true,
    createdBy: 'system'
  }
]

// 本地存储兜底方案（暂时使用）
export const getStylesFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem('customStyles')
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('从本地存储获取风格失败:', error)
    return []
  }
}

export const saveStylesToLocalStorage = (styles) => {
  try {
    localStorage.setItem('customStyles', JSON.stringify(styles))
    return true
  } catch (error) {
    console.error('保存风格到本地存储失败:', error)
    return false
  }
}