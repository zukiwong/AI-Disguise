/**
 * 变体相关的工具函数
 */

/**
 * 生成变体的最终prompt的帮助函数
 * 
 * 新的变体逻辑：
 * - 用户只需要填写变体名称和描述
 * - 系统会自动根据主风格的基础prompt + 变体描述生成最终prompt
 * - 这样用户操作简单，同时保持灵活性
 * - 向后兼容：已有的自定义promptOverride继续有效
 */
export const generateVariantPrompt = (baseStyle, variant) => {
  // 如果变体有自定义的promptOverride，直接使用（向后兼容）
  if (variant.promptOverride && variant.promptOverride.trim()) {
    return variant.promptOverride
  }
  
  // 否则基于主风格prompt + 变体描述生成
  const basePrompt = baseStyle.promptTemplate || 'Transform the following text:'
  const variantRequirement = variant.description || ''
  
  if (variantRequirement) {
    return `${basePrompt} 特别要求：${variantRequirement}`
  }
  
  return basePrompt
}