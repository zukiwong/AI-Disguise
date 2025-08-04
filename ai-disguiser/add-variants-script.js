// 临时脚本：直接添加三个变体到Chat Style
// 运行方式：在浏览器控制台执行

import { createVariant } from './src/services/variantService.js'
import { getPublicStylesForExplore } from './src/services/styleService.js'

// 要添加的三个变体
const variantsToAdd = [
  {
    name: '愤怒版',
    description: '边写边吐槽 KPI 胡来',
    createdBy: 'system',
    isPublic: true
  },
  {
    name: '舔狗版', 
    description: '小心翼翼试探回应',
    createdBy: 'system',
    isPublic: true
  },
  {
    name: '冷漠版',
    description: '机械传达，无情绪参与',
    createdBy: 'system',
    isPublic: true
  }
]

// 执行函数
async function addVariantsToChat() {
  try {
    console.log('🔍 开始查找Chat Style...')
    
    // 获取所有公共风格
    const allStyles = await getPublicStylesForExplore()
    console.log('📋 所有风格:', allStyles)
    
    // 查找Chat Style（通过name或displayName匹配）
    const chatStyle = allStyles.find(style => 
      style.name === 'chat' || 
      style.displayName === 'Chat Style' ||
      style.displayName?.toLowerCase().includes('chat')
    )
    
    if (!chatStyle) {
      console.error('❌ 找不到Chat Style')
      console.log('可用的风格:', allStyles.map(s => ({ id: s.id, name: s.name, displayName: s.displayName })))
      return
    }
    
    console.log('✅ 找到Chat Style:', chatStyle)
    
    // 为每个变体创建数据
    for (const variantData of variantsToAdd) {
      try {
        console.log(`🔥 创建变体: ${variantData.name}`)
        const result = await createVariant(chatStyle.id, variantData)
        console.log(`✅ 成功创建: ${variantData.name}`, result)
      } catch (error) {
        console.error(`❌ 创建失败: ${variantData.name}`, error)
      }
    }
    
    console.log('🎉 所有变体创建完成！')
    
  } catch (error) {
    console.error('❌ 脚本执行失败:', error)
  }
}

// 导出函数供控制台调用
window.addVariantsToChat = addVariantsToChat

console.log(`
📋 使用方法：
1. 在浏览器控制台中运行：addVariantsToChat()
2. 或者直接复制粘贴整个函数执行

要添加的变体：
${variantsToAdd.map(v => `- ${v.name}: ${v.description}`).join('\n')}
`)