// Firebase 配置和初始化
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

// Firebase 项目配置
// 注意：这些配置信息是公开的，不包含敏感信息
// 开发环境暂时使用模拟配置
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA7-eCFVXaBfvPLdAUePkqFQ8pUpQejuqk",
  authDomain: "ai-disguiser-2d728.firebaseapp.com",
  projectId: "ai-disguiser-2d728",
  storageBucket: "ai-disguiser-2d728.firebasestorage.app",
  messagingSenderId: "765049825128",
  appId: "1:765049825128:web:a8ca154675c8b1e39798dd",
  measurementId: "G-JRCV1539TG"
};

// 初始化 Firebase 应用
const app = initializeApp(firebaseConfig)

// 初始化 Analytics（仅在生产环境中使用）
if (typeof window !== 'undefined') {
  getAnalytics(app)
}

// 获取 Firestore 数据库实例
export const db = getFirestore(app)

// 集合名称常量
export const COLLECTIONS = {
  STYLES: 'styles'
}

export default app