// 前端 API 服务模块
// 负责与后端 API 的通信，后端处理 GEMINI API 调用

import { TEXT_LIMITS, LANGUAGE_DETECTION } from './config.js'

/**
 * 检测文本语言（前端使用，用于显示检测到的语言）
 * @param {string} text - 要检测的文本
 * @returns {string} - 检测到的语言代码
 */
function detectLanguage(text) {
  // 按优先级检测语言（优先检测特征明显的语言）
  if (LANGUAGE_DETECTION.ja.test(text)) return 'ja'
  if (LANGUAGE_DETECTION.zh.test(text)) return 'zh'
  if (LANGUAGE_DETECTION.de.test(text)) return 'de'
  if (LANGUAGE_DETECTION.es.test(text)) return 'es'
  if (LANGUAGE_DETECTION.en.test(text)) return 'en'
  
  // 默认返回英文
  return 'en'
}

/**
 * 调用后端 API 进行文本转换
 * @param {string} text - 输入文本
 * @param {string|Object} styleOrPurposeRecipient - 风格类型（字符串）或目的+对象（对象）
 * @param {string} outputLanguage - 输出语言（可选，默认为 'auto'）
 * @returns {Promise<string>} - 转换后的文本
 */
export async function disguiseText(text, styleOrPurposeRecipient, outputLanguage = 'auto') {
  // 输入验证
  if (!text || typeof text !== 'string') {
    throw new Error('输入文本不能为空')
  }
  
  if (text.length > TEXT_LIMITS.MAX_INPUT_LENGTH) {
    throw new Error(`输入文本不能超过 ${TEXT_LIMITS.MAX_INPUT_LENGTH} 个字符`)
  }

  try {
    // 根据参数类型构建请求体
    let requestBody
    if (typeof styleOrPurposeRecipient === 'string') {
      // 传统风格模式（系统默认风格）
      requestBody = {
        text: text,
        mode: 'style',
        style: styleOrPurposeRecipient,
        outputLanguage: outputLanguage
      }
    } else if (typeof styleOrPurposeRecipient === 'object' && styleOrPurposeRecipient.id) {
      // 自定义风格模式（包含完整配置）
      requestBody = {
        text: text,
        mode: 'custom_style',
        styleConfig: styleOrPurposeRecipient,
        outputLanguage: outputLanguage
      }
    } else if (typeof styleOrPurposeRecipient === 'object' && styleOrPurposeRecipient.purpose && styleOrPurposeRecipient.recipient) {
      // 目的+对象模式
      requestBody = {
        text: text,
        mode: 'purpose',
        purpose: styleOrPurposeRecipient.purpose,
        recipient: styleOrPurposeRecipient.recipient,
        outputLanguage: outputLanguage
      }
    } else {
      throw new Error('无效的风格或目的+对象参数')
    }

    // 调用后端 API
    const response = await fetch('/api/disguise', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    // 检查响应状态
    if (!response.ok) {
      let errorMessage = `API 请求失败: ${response.status}`
      
      // 尝试解析错误响应
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (jsonError) {
        // 如果响应不是JSON格式，使用默认错误消息
        console.error('响应不是有效的JSON:', jsonError)
        if (response.status === 404) {
          errorMessage = 'API 端点未找到，请检查服务器配置'
        }
      }
      
      throw new Error(errorMessage)
    }

    // 解析成功响应
    const data = await response.json()

    // 检查响应格式
    if (!data.success || !data.result) {
      throw new Error(data.message || 'API 返回的数据格式异常')
    }

    return data.result
    
  } catch (error) {
    // 错误处理和日志记录
    console.error('后端 API 调用错误:', error)
    
    // 根据错误类型返回用户友好的错误信息
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查网络设置')
    }
    
    throw error
  }
}

/**
 * 检查后端 API 连接状态
 * @returns {Promise<boolean>} - 连接是否正常
 */
export async function checkApiHealth() {
  try {
    // 使用简单的测试文本检查后端 API 连接
    await disguiseText('测试', 'chat')
    return true
  } catch (error) {
    console.error('后端 API 健康检查失败:', error)
    return false
  }
}

/**
 * 导出语言检测函数供外部使用
 * @param {string} text - 要检测的文本
 * @returns {string} - 检测到的语言代码
 */
export function detectTextLanguage(text) {
  return detectLanguage(text)
}