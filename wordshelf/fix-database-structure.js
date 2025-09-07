// 修复数据库结构脚本
// 为缺失主结构数据的风格文档添加默认数据

import { createStyle } from './src/services/styleService.js'
import { db, COLLECTIONS } from './src/services/firebase.js'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

// 系统默认风格数据
const systemStyles = [
  {
    name: 'chat',
    displayName: 'Chat Style',
    description: 'Casual and relaxed conversational tone',
    promptTemplate: 'Transform the following text into a casual, friendly conversational style:',
    isPublic: true,
    createdBy: 'system'
  },
  {
    name: 'poem',
    displayName: 'Poetic Style', 
    description: 'Literary expression with poetic flair',
    promptTemplate: 'Transform the following text into poetic, literary expression with artistic flair:',
    isPublic: true,
    createdBy: 'system'
  },
  {
    name: 'social',
    displayName: 'Social Style',
    description: 'Expression suitable for social media',
    promptTemplate: 'Transform the following text into engaging social media style with appropriate tone:',
    isPublic: true,
    createdBy: 'system'
  },
  {
    name: 'story',
    displayName: 'Story Style',
    description: 'Narrative storytelling expression',
    promptTemplate: 'Transform the following text into narrative storytelling format:',
    isPublic: true,
    createdBy: 'system'
  }
]

// 修复指定文档ID的主结构数据
async function fixStyleDocument(documentId, styleData) {
  try {
    console.log(`🔧 修复文档: ${documentId}`)
    
    const styleRef = doc(db, COLLECTIONS.STYLES, documentId)
    
    const dataToSet = {
      ...styleData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    
    // 使用 setDoc 而不是 addDoc，这样可以指定文档ID
    await setDoc(styleRef, dataToSet, { merge: true })
    
    console.log(`✅ 成功修复文档: ${documentId}`, dataToSet)
    
  } catch (error) {
    console.error(`❌ 修复失败: ${documentId}`, error)
  }
}

// 主修复函数
async function fixDatabaseStructure() {
  console.log('🔧 开始修复数据库结构...')
  
  // 这里需要你提供实际的文档ID
  // 请在 Firestore 控制台中查看你的风格文档ID，然后填入下面
  const documentMappings = {
    // 'your-actual-chat-style-document-id': systemStyles[0], // Chat Style
    // 'your-actual-poem-style-document-id': systemStyles[1], // Poetic Style
    // 'your-actual-social-style-document-id': systemStyles[2], // Social Style
    // 'your-actual-story-style-document-id': systemStyles[3], // Story Style
  }
  
  if (Object.keys(documentMappings).length === 0) {
    console.log(`
❗ 请先配置文档映射：
1. 在 Firestore 控制台中查看你的风格文档ID
2. 在上面的 documentMappings 对象中填入实际的文档ID
3. 然后重新运行此脚本

例如：
const documentMappings = {
  'abc123def456': systemStyles[0], // Chat Style
  'ghi789jkl012': systemStyles[1], // Poetic Style
  // ...
}
    `)
    return
  }
  
  // 修复每个文档
  for (const [docId, styleData] of Object.entries(documentMappings)) {
    await fixStyleDocument(docId, styleData)
  }
  
  console.log('🎉 数据库结构修复完成！')
}

// 导出函数供控制台调用
window.fixDatabaseStructure = fixDatabaseStructure

// 使用说明
console.log(`
📋 数据库结构修复脚本

使用步骤：
1. 在 Firestore 控制台中找到你的风格文档ID
2. 编辑此脚本中的 documentMappings 对象，填入真实的文档ID
3. 在浏览器控制台中运行：fixDatabaseStructure()

这将为每个风格文档添加正确的主结构数据，包括：
- name, displayName, description
- promptTemplate, isPublic, createdBy
- createdAt, updatedAt 时间戳

变体子collection不会受到影响。
`)