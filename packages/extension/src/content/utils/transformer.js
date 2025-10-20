// 文本转换工具 - 调用后端 API 进行文本转换

/**
 * 转换文本
 */
export async function transformText(text, style) {
  try {
    const apiConfig = await getApiConfig()

    const requestBody = {
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
    }

    const response = await fetch('https://ai-disguise.vercel.app/api/disguise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      // 尝试获取错误详情
      let errorMessage = `API request failed: ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.error) {
          errorMessage += ` - ${errorData.error}`
        }
        if (errorData.message) {
          errorMessage += `\n${errorData.message}`
        }
      } catch (e) {
        // 无法解析错误响应
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()

    if (!data.success || !data.result) {
      throw new Error(data.error || data.message || 'Invalid API response')
    }

    if (!apiConfig || apiConfig.mode !== 'custom') {
      incrementUsage()
    }

    return data.result
  } catch (error) {
    throw error
  }
}

async function getApiConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['apiConfig'], (result) => {
      resolve(result.apiConfig || null)
    })
  })
}

function incrementUsage() {
  chrome.runtime.sendMessage({ action: 'incrementUsage' })
}
