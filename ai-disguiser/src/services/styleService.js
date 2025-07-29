// 风格管理服务层
// 负责风格数据的 CRUD 操作

import { db, COLLECTIONS } from './firebase.js'
import { 
  collection, 
  doc, 
  getDocs, 
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
  isPublic,
  createdBy,
  createdAt: serverTimestamp()
})

// 获取所有公共风格
export const getPublicStyles = async () => {
  try {
    const stylesRef = collection(db, COLLECTIONS.STYLES)
    const q = query(
      stylesRef, 
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    const styles = []
    querySnapshot.forEach((doc) => {
      styles.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    // 如果 Firestore 中没有数据，返回默认风格
    return styles.length > 0 ? styles : getDefaultStyles()
    
  } catch (error) {
    console.error('获取公共风格失败:', error)
    return getDefaultStyles() // 降级到默认风格
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
      where('isPublic', '==', false),
      orderBy('createdAt', 'desc')
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
    const publicStyles = await getPublicStyles()
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
    const docRef = await addDoc(stylesRef, createStyleData(styleData))
    
    return {
      id: docRef.id,
      ...styleData
    }
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