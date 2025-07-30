// 用户认证服务层
// 负责用户登录、注册和认证状态管理

import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  GithubAuthProvider 
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, COLLECTIONS } from './firebase.js'

// 配置认证提供商
const googleProvider = new GoogleAuthProvider()
const githubProvider = new GithubAuthProvider()

// 配置 Google 登录
googleProvider.setCustomParameters({
  prompt: 'select_account'
})

// 配置 GitHub 登录
githubProvider.setCustomParameters({
  prompt: 'select_account'
})

/**
 * Google 登录
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user
    
    // 保存用户信息到 Firestore
    await saveUserToFirestore(user)
    
    return {
      success: true,
      user: user
    }
  } catch (error) {
    console.error('Google 登录失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * GitHub 登录
 */
export const signInWithGithub = async () => {
  try {
    const result = await signInWithPopup(auth, githubProvider)
    const user = result.user
    
    // 保存用户信息到 Firestore
    await saveUserToFirestore(user)
    
    return {
      success: true,
      user: user
    }
  } catch (error) {
    console.error('GitHub 登录失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 登出
 */
export const logOut = async () => {
  try {
    await signOut(auth)
    return { success: true }
  } catch (error) {
    console.error('登出失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 监听认证状态变化
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback)
}

/**
 * 获取当前用户
 */
export const getCurrentUser = () => {
  return auth.currentUser
}

/**
 * 检查用户是否已登录
 */
export const isAuthenticated = () => {
  return !!auth.currentUser
}

/**
 * 保存用户信息到 Firestore
 */
const saveUserToFirestore = async (user) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, user.uid)
    
    // 检查用户是否已存在
    const userDoc = await getDoc(userRef)
    
    if (!userDoc.exists()) {
      // 新用户，创建用户文档
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        avatar: user.photoURL || '',
        provider: user.providerData[0]?.providerId || 'unknown',
        createdStyles: [],
        favoriteStyles: [],
        sharedPosts: [],
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      }
      
      await setDoc(userRef, userData)
    } else {
      // 现有用户，更新最后登录时间
      await setDoc(userRef, {
        lastLoginAt: serverTimestamp()
      }, { merge: true })
    }
  } catch (error) {
    console.error('保存用户信息失败:', error)
  }
}

/**
 * 获取用户详细信息
 */
export const getUserProfile = async (uid) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, uid)
    const userDoc = await getDoc(userRef)
    
    if (userDoc.exists()) {
      return {
        success: true,
        data: userDoc.data()
      }
    } else {
      return {
        success: false,
        error: 'User not found'
      }
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 更新用户资料
 */
export const updateUserProfile = async (uid, updateData) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, uid)
    
    await setDoc(userRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    }, { merge: true })
    
    return { success: true }
  } catch (error) {
    console.error('更新用户资料失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 获取认证错误的友好提示
 */
export const getAuthErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/popup-closed-by-user':
      return '登录窗口被关闭，请重试'
    case 'auth/cancelled-popup-request':
      return '登录请求被取消'
    case 'auth/popup-blocked':
      return '登录弹窗被浏览器阻止，请允许弹窗后重试'
    case 'auth/account-exists-with-different-credential':
      return '该邮箱已与其他登录方式关联'
    case 'auth/network-request-failed':
      return '网络连接失败，请检查网络后重试'
    default:
      return '登录失败，请稍后重试'
  }
}