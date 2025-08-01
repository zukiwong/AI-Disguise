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
  orderBy,
  serverTimestamp 
} from 'firebase/firestore'

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
export const getPublicStylesForExplore = async (userId = null) => {
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
    
    // 如果 Firestore 中有数据，合并处理
    if (firestoreStyles.length > 0) {
      // 获取用户创建的公共风格
      const userStyles = firestoreStyles.filter(style => style.createdBy !== 'system')
      
      // 获取所有默认风格
      const defaultStyles = getDefaultStyles()
      
      // 合并所有公共风格（探索页显示完整库）
      return [...defaultStyles, ...userStyles]
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
  
  // 🔑 未登录用户只能看到默认的4个风格
  if (!isAuthenticated) {
    return defaultStyles
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
    
    
    // 合并用户账户中的公共风格
    return [...accountDefaultStyles, ...accountPublicStyles]
    
  } catch (error) {
    console.error('获取公共风格失败:', error)
    // 发生错误时返回代码默认风格，确保应用可用
    return defaultStyles
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

// 获取所有可用风格（公共 + 用户私有）
export const getAllAvailableStyles = async (userId = null) => {
  try {
    const isAuthenticated = Boolean(userId)
    const publicStyles = await getPublicStyles(isAuthenticated, userId)
    const userStyles = userId ? await getUserStyles(userId) : []
    
    return [...publicStyles, ...userStyles]
  } catch (error) {
    console.error('获取所有风格失败:', error)
    return getDefaultStyles()
  }
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