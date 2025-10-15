// 文本转换工具 - 调用后端 API 进行文本转换

/**
 * 转换文本
 */
export async function transformText(text, style) {
  try {
    const apiConfig = await getApiConfig()

    const response = await fetch('https://ai-disguise.vercel.app/api/disguise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    if (!data.success || !data.result) {
      throw new Error('Invalid API response')
    }

    if (!apiConfig || apiConfig.mode !== 'custom') {
      incrementUsage()
    }

    return data.result
  } catch (error) {
    console.error('Transform error:', error)
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
