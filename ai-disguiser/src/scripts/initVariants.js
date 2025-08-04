// 临时脚本：为现有风格添加示例变体数据
// 运行方式：在浏览器控制台执行或集成到应用中

import { createVariant } from '../services/variantService.js'

// Chat Style 的变体数据
const chatStyleVariants = [
  {
    name: '愤怒版',
    description: '边写边吐槽，带有不满情绪的聊天风格',
    promptOverride: '用愤怒和不满的语气重写以下内容，表达出对现状的抱怨和不耐烦，像是在吐槽一样',
    createdBy: 'system',
    isPublic: true
  },
  {
    name: '舔狗版',
    description: '小心翼翼试探回应，讨好型聊天风格',
    promptOverride: '用非常谨慎、讨好的语气重写以下内容，表现得很在意对方的感受，带有试探性和讨好的语调',
    createdBy: 'system',
    isPublic: true
  },
  {
    name: '冷漠版',
    description: '机械传达，无情绪参与的冷淡风格',
    promptOverride: '用非常冷淡、机械的语气重写以下内容，去除所有情感色彩，像机器人一样简洁直接',
    createdBy: 'system',
    isPublic: true
  },
  {
    name: '幽默版',
    description: '轻松幽默的聊天风格，带有俏皮话',
    promptOverride: '用幽默风趣的语气重写以下内容，适当加入俏皮话和轻松的调侃，让对话更有趣',
    createdBy: 'system',
    isPublic: true
  },
  {
    name: '正式版',
    description: '商务正式的聊天风格，礼貌专业',
    promptOverride: '用正式、礼貌的商务语气重写以下内容，保持专业性和严谨性',
    createdBy: 'system',
    isPublic: true
  }
]

// 其他风格的变体数据
const otherStyleVariants = {
  // Email Style 变体
  'email': [
    {
      name: '紧急版',
      description: '传达紧急感的邮件语调',
      promptOverride: '用紧急、需要立即关注的语气重写邮件内容',
      createdBy: 'system',
      isPublic: true
    },
    {
      name: '友好版',
      description: '温暖友好的邮件语调',
      promptOverride: '用温暖、友好的语气重写邮件内容，让收件人感到亲切',
      createdBy: 'system',
      isPublic: true
    }
  ],
  
  // Social Media 变体
  'social': [
    {
      name: '潮流版',
      description: '跟上潮流的社交媒体语调',
      promptOverride: '用时下流行的网络语言和表达方式重写内容，符合年轻人的社交媒体风格',
      createdBy: 'system',
      isPublic: true
    },
    {
      name: '文艺版',
      description: '文艺清新的社交媒体语调',
      promptOverride: '用文艺、诗意的语言重写内容，带有小清新的感觉',
      createdBy: 'system',
      isPublic: true
    }
  ]
}

// 执行函数：为指定风格ID添加变体
export async function addVariantsToStyle(styleId, variants) {
  console.log(`开始为风格 ${styleId} 添加变体...`)
  
  for (const variantData of variants) {
    try {
      const result = await createVariant(styleId, variantData)
      console.log(`✅ 成功创建变体: ${variantData.name}`, result)
    } catch (error) {
      console.error(`❌ 创建变体失败: ${variantData.name}`, error)
    }
  }
  
  console.log(`完成为风格 ${styleId} 添加变体`)
}

// 批量添加所有变体的函数
export async function initAllVariants() {
  // 注意：你需要替换这些ID为实际的风格ID
  const styleIdMap = {
    'chat': 'YOUR_CHAT_STYLE_ID_HERE',  // 需要替换为实际的Chat Style ID
    'email': 'YOUR_EMAIL_STYLE_ID_HERE', // 需要替换为实际的Email Style ID  
    'social': 'YOUR_SOCIAL_STYLE_ID_HERE' // 需要替换为实际的Social Style ID
  }
  
  // 添加Chat Style变体
  if (styleIdMap.chat !== 'YOUR_CHAT_STYLE_ID_HERE') {
    await addVariantsToStyle(styleIdMap.chat, chatStyleVariants)
  }
  
  // 添加其他风格变体
  for (const [styleType, variants] of Object.entries(otherStyleVariants)) {
    const styleId = styleIdMap[styleType]
    if (styleId && styleId !== `YOUR_${styleType.toUpperCase()}_STYLE_ID_HERE`) {
      await addVariantsToStyle(styleId, variants)
    }
  }
}

// 导出变体数据供其他地方使用
export { chatStyleVariants, otherStyleVariants }

// 使用说明：
console.log(`
使用方法：
1. 在浏览器控制台中导入此文件
2. 找到你的Chat Style的ID（在Firestore或应用中查看）
3. 调用 addVariantsToStyle('你的风格ID', chatStyleVariants)
4. 或者更新styleIdMap中的ID后调用initAllVariants()

示例：
addVariantsToStyle('abc123', chatStyleVariants)
`)