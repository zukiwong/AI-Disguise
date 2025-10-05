// Firebase 配置和初始化 - Chrome Extension 版本
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Firebase 项目配置
const firebaseConfig = {
  apiKey: "AIzaSyA7-eCFVXaBfvPLdAUePkqFQ8pUpQejuqk",
  authDomain: "ai-disguiser-2d728.firebaseapp.com",
  projectId: "ai-disguiser-2d728",
  storageBucket: "ai-disguiser-2d728.firebasestorage.app",
  messagingSenderId: "765049825128",
  appId: "1:765049825128:web:a8ca154675c8b1e39798dd",
  measurementId: "G-JRCV1539TG"
}

// 初始化 Firebase 应用
const app = initializeApp(firebaseConfig)

// 获取 Firestore 数据库实例
export const db = getFirestore(app)

// 获取 Authentication 实例
export const auth = getAuth(app)

// 集合名称常量
export const COLLECTIONS = {
  STYLES: 'styles',
  USERS: 'users',
  POSTS: 'posts'
}

export default app
