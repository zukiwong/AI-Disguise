// 文本转换工具 - 调用后端 API 进行文本转换

/**
 * 转换文本
 * @param {string} text - 原始文本
 * @param {Object} style - 选中的风格配置
 * @returns {Promise<string>} - 转换后的文本
 */
export async function transformText(text, style) {
  try {
    // 获取 API 配置
    const apiConfig = await getApiConfig()

    // 调用后端 API
    const response = await fetch('https://ai-disguise.vercel.app/api/disguise', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        mode: 'custom_style',
        styleConfig: {
          id: style.id,
          name: style.name,
          displayName: style.displayName,
          description: style.description,
          promptTemplate: style.promptTemplate
        },
        outputLanguage: 'auto',
        apiConfig: apiConfig
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `API request failed: ${response.status}`)
    }

    const data = await response.json()

    if (!data.success || !data.result) {
      throw new Error(data.message || 'Invalid API response')
    }

    // 记录使用次数（仅免费模式）
    if (!apiConfig || apiConfig.mode !== 'custom') {
      incrementUsage()
    }

    return data.result

  } catch (error) {
    console.error('Transform text error:', error)
    throw error
  }
}

/**
 * 获取 API 配置
 */
async function getApiConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['apiConfig'], (result) => {
      resolve(result.apiConfig || null)
    })
  })
}

/**
 * 增加使用次数
 */
function incrementUsage() {
  chrome.runtime.sendMessage(
    { action: 'incrementUsage' },
    (response) => {
      if (response && response.success) {
        console.log('Usage count updated:', response.count)
      }
    }
  )
}
