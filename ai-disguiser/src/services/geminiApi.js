// GEMINI API 服务模块
// 负责与 Google GEMINI API 的所有通信逻辑

import { GEMINI_CONFIG, STYLE_CONFIG, TEXT_LIMITS } from './config.js'

/**
 * 构建 GEMINI API 请求的 prompt
 * @param {string} text - 用户输入的原始文本
 * @param {string} style - 选择的风格类型
 * @returns {string} - 完整的 prompt
 */
function buildPrompt(text, style) {
  const styleInfo = STYLE_CONFIG[style] || STYLE_CONFIG.chat
  
  return `请将以下文本转换为${styleInfo.displayName}，要求：
1. 保持原意不变
2. 采用${styleInfo.description}
3. 语言自然流畅
4. 字数控制在合理范围内

原文：${text}

请直接输出转换后的文本，不需要额外说明。`
}

/**
 * 调用 GEMINI API 进行文本转换
 * @param {string} text - 输入文本
 * @param {string} style - 风格类型
 * @returns {Promise<string>} - 转换后的文本
 */
export async function disguiseText(text, style) {
  // 输入验证
  if (!text || typeof text !== 'string') {
    throw new Error('输入文本不能为空')
  }
  
  if (text.length > TEXT_LIMITS.MAX_INPUT_LENGTH) {
    throw new Error(`输入文本不能超过 ${TEXT_LIMITS.MAX_INPUT_LENGTH} 个字符`)
  }

  const prompt = buildPrompt(text, style)
  
  // 构建请求数据
  const requestData = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,  // 控制创造性，0.7 是较好的平衡值
      topK: 40,          // 控制词汇选择的多样性
      topP: 0.95,        // 控制输出的随机性
      maxOutputTokens: 1024,  // 最大输出长度
    }
  }

  try {
    // 发送 API 请求
    const response = await fetch(
      `${GEMINI_CONFIG.BASE_URL}/models/${GEMINI_CONFIG.MODEL}:generateContent?key=${GEMINI_CONFIG.API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      }
    )

    // 检查响应状态
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`API 请求失败: ${response.status} - ${errorData.error?.message || '未知错误'}`)
    }

    // 解析响应数据
    const data = await response.json()
    
    // 提取生成的文本
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!generatedText) {
      throw new Error('API 返回的数据格式异常')
    }

    return generatedText.trim()
    
  } catch (error) {
    // 错误处理和日志记录
    console.error('GEMINI API 调用错误:', error)
    
    // 根据错误类型返回用户友好的错误信息
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络设置')
    }
    
    throw error
  }
}

/**
 * 检查 API 连接状态
 * @returns {Promise<boolean>} - 连接是否正常
 */
export async function checkApiHealth() {
  try {
    // 使用简单的测试文本检查 API 连接
    await disguiseText('测试', 'chat')
    return true
  } catch (error) {
    console.error('API 健康检查失败:', error)
    return false
  }
}