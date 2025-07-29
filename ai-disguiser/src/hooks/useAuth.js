// 用户认证自定义 Hook
// 管理用户登录状态和认证相关操作

import { useState, useEffect, useCallback } from 'react'
import { 
  signInWithGoogle, 
  signInWithGithub, 
  logOut, 
  onAuthStateChange, 
  getUserProfile,
  getAuthErrorMessage 
} from '../services/authService.js'

/**
 * 用户认证 Hook
 * @returns {Object} 包含认证状态和方法的对象
 */
export function useAuth() {
  // 认证状态
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [error, setError] = useState('')

  // 初始化认证状态监听
  useEffect(() => {
    console.log('🔄 初始化认证状态监听...')
    
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      console.log('👤 认证状态变化:', firebaseUser ? firebaseUser.email : '未登录')
      
      if (firebaseUser) {
        // 用户已登录
        setUser(firebaseUser)
        
        // 获取用户详细信息
        try {
          const profileResult = await getUserProfile(firebaseUser.uid)
          if (profileResult.success) {
            setUserProfile(profileResult.data)
            console.log('📋 用户资料加载成功')
          }
        } catch (err) {
          console.error('❌ 获取用户资料失败:', err)
        }
      } else {
        // 用户未登录
        setUser(null)
        setUserProfile(null)
      }
      
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Google 登录
  const handleGoogleLogin = useCallback(async () => {
    setIsLoggingIn(true)
    setError('')
    
    try {
      const result = await signInWithGoogle()
      
      if (result.success) {
        console.log('✅ Google 登录成功')
        // onAuthStateChange 会自动处理状态更新
      } else {
        const friendlyMessage = getAuthErrorMessage(result.error)
        setError(friendlyMessage)
        console.error('❌ Google 登录失败:', result.error)
      }
    } catch (err) {
      setError('登录失败，请稍后重试')
      console.error('❌ Google 登录异常:', err)
    } finally {
      setIsLoggingIn(false)
    }
  }, [])

  // GitHub 登录
  const handleGithubLogin = useCallback(async () => {
    setIsLoggingIn(true)
    setError('')
    
    try {
      const result = await signInWithGithub()
      
      if (result.success) {
        console.log('✅ GitHub 登录成功')
        // onAuthStateChange 会自动处理状态更新
      } else {
        const friendlyMessage = getAuthErrorMessage(result.error)
        setError(friendlyMessage)
        console.error('❌ GitHub 登录失败:', result.error)
      }
    } catch (err) {
      setError('登录失败，请稍后重试')
      console.error('❌ GitHub 登录异常:', err)
    } finally {
      setIsLoggingIn(false)
    }
  }, [])

  // 登出
  const handleLogout = useCallback(async () => {
    try {
      const result = await logOut()
      
      if (result.success) {
        console.log('👋 登出成功')
        // onAuthStateChange 会自动处理状态更新
      } else {
        setError('登出失败，请稍后重试')
        console.error('❌ 登出失败:', result.error)
      }
    } catch (err) {
      setError('登出失败，请稍后重试')
      console.error('❌ 登出异常:', err)
    }
  }, [])

  // 清除错误
  const clearError = useCallback(() => {
    setError('')
  }, [])

  // 刷新用户资料
  const refreshProfile = useCallback(async () => {
    if (!user) return
    
    try {
      const profileResult = await getUserProfile(user.uid)
      if (profileResult.success) {
        setUserProfile(profileResult.data)
        console.log('🔄 用户资料已刷新')
      }
    } catch (err) {
      console.error('❌ 刷新用户资料失败:', err)
    }
  }, [user])

  // 返回所有状态和方法
  return {
    // 用户状态
    user,
    userProfile,
    isAuthenticated: !!user,
    isLoading,
    isLoggingIn,
    error,
    
    // 认证方法
    loginWithGoogle: handleGoogleLogin,
    loginWithGithub: handleGithubLogin,
    logout: handleLogout,
    
    // 工具方法
    clearError,
    refreshProfile,
    
    // 计算属性
    userId: user?.uid || null,
    userEmail: user?.email || '',
    userName: userProfile?.displayName || user?.displayName || '',
    userAvatar: userProfile?.avatar || user?.photoURL || '',
    
    // 权限检查
    canCreateStyles: !!user,
    canManageStyles: !!user,
    canShareContent: !!user
  }
}