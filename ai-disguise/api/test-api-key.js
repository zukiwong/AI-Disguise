// Vercel 无服务器 API 路由
// 测试用户的 API Key 是否有效

/**
 * 测试 API Key 端点
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: '只支持 POST 请求'
    })
  }

  try {
    // 获取请求参数
    const { provider, apiKey, model } = req.body

    // 参数验证
    if (!provider || !apiKey) {
      return res.status(400).json({
        error: 'Invalid input',
        message: '提供商和 API Key 不能为空'
      })
    }

    // 验证提供商
    const validProviders = ['gemini', 'openai', 'claude', 'deepseek']
    if (!validProviders.includes(provider)) {
      return res.status(400).json({
        error: 'Invalid provider',
        message: `不支持的提供商: ${provider}`
      })
    }

    // 测试 API Key
    let testResult
    switch (provider) {
      case 'gemini':
        testResult = await testGeminiAPI(apiKey, model)
        break
      case 'openai':
        testResult = await testOpenAIAPI(apiKey, model)
        break
      case 'claude':
        testResult = await testClaudeAPI(apiKey, model)
        break
      case 'deepseek':
        testResult = await testDeepSeekAPI(apiKey, model)
        break
      default:
        throw new Error(`不支持的提供商: ${provider}`)
    }

    // 返回成功响应
    res.status(200).json({
      success: true,
      message: 'API Key 有效',
      provider: provider,
      model: testResult.model,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('API Key 测试错误:', error)

    // 返回错误响应
    res.status(200).json({
      success: false,
      error: error.message || 'API Key 测试失败'
    })
  }
}

/**
 * 测试 Gemini API
 */
async function testGeminiAPI(apiKey, model = 'gemini-2.0-flash-exp') {
  const baseUrl = 'https://generativelanguage.googleapis.com/v1beta'

  const requestData = {
    contents: [{
      parts: [{
        text: 'Hello'
      }]
    }],
    generationConfig: {
      maxOutputTokens: 10
    }
  }

  const response = await fetch(
    `${baseUrl}/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`)
  }

  const data = await response.json()
  if (!data.candidates?.[0]?.content) {
    throw new Error('API 返回数据格式异常')
  }

  return { model }
}

/**
 * 测试 OpenAI API
 */
async function testOpenAIAPI(apiKey, model = 'gpt-4o-mini') {
  const baseUrl = 'https://api.openai.com/v1'

  const requestData = {
    model: model,
    messages: [{
      role: 'user',
      content: 'Hello'
    }],
    max_tokens: 10
  }

  const response = await fetch(
    `${baseUrl}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestData),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`)
  }

  const data = await response.json()
  if (!data.choices?.[0]?.message) {
    throw new Error('API 返回数据格式异常')
  }

  return { model }
}

/**
 * 测试 Claude API
 */
async function testClaudeAPI(apiKey, model = 'claude-3-5-haiku-20241022') {
  const baseUrl = 'https://api.anthropic.com/v1'

  const requestData = {
    model: model,
    messages: [{
      role: 'user',
      content: 'Hello'
    }],
    max_tokens: 10
  }

  const response = await fetch(
    `${baseUrl}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestData),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`)
  }

  const data = await response.json()
  if (!data.content?.[0]) {
    throw new Error('API 返回数据格式异常')
  }

  return { model }
}

/**
 * 测试 DeepSeek API
 */
async function testDeepSeekAPI(apiKey, model = 'deepseek-chat') {
  const baseUrl = 'https://api.deepseek.com/v1'

  const requestData = {
    model: model,
    messages: [{
      role: 'user',
      content: 'Hello'
    }],
    max_tokens: 10
  }

  const response = await fetch(
    `${baseUrl}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestData),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`)
  }

  const data = await response.json()
  if (!data.choices?.[0]?.message) {
    throw new Error('API 返回数据格式异常')
  }

  return { model }
}
