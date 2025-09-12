// 批量添加变体的工具函数 - 通过前端调用

import { createVariant } from '../services/variantService.js'

// Social Style 变体数据
const socialVariants = [
  {
    name: "Lifestyle diary",
    description: "As if writing a daily life journal post, warm and relatable, with small details of everyday scenes. Suitable for soft-selling, lifestyle content, and sharing casual moments."
  },
  {
    name: "Punchline short-form", 
    description: "Crisp, witty, and straight to the point—like a catchy tweet or meme caption. Perfect for attention-grabbing one-liners, slogans, and short viral content."
  },
  {
    name: "Motivational spark",
    description: "A style that carries uplifting, inspirational tones, filled with short affirmations or power statements. Suitable for fitness, self-growth, and encouraging social media posts."
  },
  {
    name: "Storytelling thread",
    description: "Narrative-driven, written as if unfolding a personal story or \"long tweet thread,\" mixing suspense, emotional beats, and relatable conclusions. Suitable for platforms where storytelling goes viral."
  },
  {
    name: "Satirical roast",
    description: "Playful and slightly sarcastic, mocking everyday absurdities with humor. Casual but sharp, suitable for commentaries on trends, products, or social life."
  },
  {
    name: "Visual pairing captions",
    description: "Text designed to pair tightly with photos or videos, leaning on imagery and mood. Minimal words, high emotional impact—ideal for Instagram-style captions or TikTok overlays."
  }
]

// 为指定风格添加变体
export const addVariantsToStyle = async (styleId, variants) => {
  const results = []
  
  console.log(`🚀 开始为风格 ${styleId} 添加 ${variants.length} 个变体`)
  
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i]
    console.log(`📝 添加变体 ${i + 1}/${variants.length}: ${variant.name}`)
    
    try {
      const result = await createVariant(styleId, {
        name: variant.name,
        description: variant.description,
        createdBy: 'system',
        isPublic: true
      })
      
      console.log(`✅ 变体 "${variant.name}" 添加成功`)
      results.push({ success: true, variant: result })
    } catch (error) {
      console.error(`❌ 添加变体 "${variant.name}" 失败:`, error)
      results.push({ success: false, error, variantName: variant.name })
    }
  }
  
  return results
}

// 为 Social Style 添加变体（需要在浏览器控制台中调用）
export const addSocialVariants = async () => {
  // 注意：这里需要 Social Style 的 ID，可能需要先查找
  // 你可以在浏览器控制台中调用这个函数
  console.log('请先获取 Social Style 的 ID，然后调用 addVariantsToStyle(styleId, socialVariants)')
  return socialVariants
}

// 导出变体数据，方便在控制台中使用
export { socialVariants }

// 全局暴露函数（仅开发环境）
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.addVariantsToStyle = addVariantsToStyle
  window.socialVariants = socialVariants
  window.addSocialVariants = addSocialVariants
}