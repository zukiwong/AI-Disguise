// Vercel 无服务器 API 路由
// 处理文本伪装请求，隐藏 GEMINI API 密钥

/**
 * 文本伪装 API 端点
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
export default async function handler(req, res) {
  // 设置 CORS 头部，允许 Chrome Extension 访问
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: '只支持 POST 请求'
    })
  }

  try {
    // 获取请求参数
    const { text, mode, style, styleConfig, purpose, recipient, outputLanguage = 'auto', apiConfig } = req.body

    // 参数验证
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: '输入文本不能为空'
      })
    }

    // 验证转换模式
    if (!mode || (mode !== 'style' && mode !== 'custom_style')) {
      return res.status(400).json({
        error: 'Invalid mode',
        message: '转换模式参数无效，必须是 style 或 custom_style'
      })
    }

    // 根据模式验证相应参数
    if (mode === 'style') {
      if (!style || typeof style !== 'string') {
        return res.status(400).json({
          error: 'Invalid style',
          message: '风格参数无效'
        })
      }
    } else if (mode === 'custom_style') {
      if (!styleConfig || typeof styleConfig !== 'object') {
        return res.status(400).json({
          error: 'Invalid styleConfig',
          message: '自定义风格配置参数无效'
        })
      }
    }

    // 字符数限制检查
    const MAX_LENGTH = 300
    if (text.length > MAX_LENGTH) {
      return res.status(400).json({
        error: 'Text too long',
        message: `输入文本不能超过 ${MAX_LENGTH} 个字符`
      })
    }

    // 检查是否使用模拟模式（用于开发测试）
    const mockMode = process.env.MOCK_API === 'true' || import.meta.env?.VITE_MOCK_API === 'true'
    
    if (mockMode) {
      // 模拟响应，用于开发测试
      const mockResponse = `这是一个模拟的${mode === 'style' ? '风格转换' : '自定义风格转换'}结果。原文："${text}"。`

      return res.status(200).json({
        success: true,
        result: mockResponse,
        metadata: {
          inputLength: text.length,
          mode: mode,
          style: mode === 'style' ? style : null,
          styleConfig: mode === 'custom_style' ? styleConfig?.displayName : null,
          outputLanguage: outputLanguage,
          timestamp: new Date().toISOString(),
          isMock: true
        }
      })
    }

    // 确定使用哪个 API
    let aiProvider = 'gemini'  // 默认使用 Gemini
    let userApiKey = null

    if (apiConfig && apiConfig.mode === 'custom' && apiConfig.activeProvider) {
      // 用户使用自定义 API Key
      aiProvider = apiConfig.activeProvider
      const customApi = apiConfig.customApis?.[aiProvider]

      if (!customApi || !customApi.apiKey) {
        return res.status(400).json({
          error: 'Invalid API configuration',
          message: `未找到 ${aiProvider} 的 API Key 配置`
        })
      }

      // 解码 Base64 编码的 API Key
      try {
        userApiKey = Buffer.from(customApi.apiKey, 'base64').toString('utf-8')
      } catch (error) {
        return res.status(400).json({
          error: 'Invalid API Key format',
          message: 'API Key 格式错误'
        })
      }
    } else {
      // 使用免费模式，从环境变量获取 API 密钥
      const apiKey = process.env.GEMINI_API_KEY || import.meta.env?.VITE_GEMINI_API_KEY
      if (!apiKey) {
        console.error('GEMINI_API_KEY 环境变量未设置')
        return res.status(500).json({
          error: 'Configuration error',
          message: 'API密钥未配置。请在.env文件中设置GEMINI_API_KEY=your_api_key，或者设置MOCK_API=true进行模拟测试。'
        })
      }
      userApiKey = apiKey
    }

    // 构建 prompt
    let prompt
    if (mode === 'style') {
      prompt = buildPrompt(text, { mode, style }, outputLanguage)
    } else {
      prompt = buildPrompt(text, { mode, styleConfig }, outputLanguage)
    }

    // 根据 AI 提供商调用相应的 API
    let response
    switch (aiProvider) {
      case 'gemini':
        response = await callGeminiAPI(prompt, userApiKey)
        break
      case 'openai':
        response = await callOpenAIAPI(prompt, userApiKey)
        break
      case 'claude':
        response = await callClaudeAPI(prompt, userApiKey)
        break
      case 'deepseek':
        response = await callDeepSeekAPI(prompt, userApiKey)
        break
      default:
        throw new Error(`不支持的 AI 提供商: ${aiProvider}`)
    }

    // 返回成功响应
    res.status(200).json({
      success: true,
      result: response,
      metadata: {
        inputLength: text.length,
        mode: mode,
        style: mode === 'style' ? style : null,
        styleConfig: mode === 'custom_style' ? styleConfig?.displayName : null,
        outputLanguage: outputLanguage,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('API 处理错误:', error)
    
    // 返回错误响应
    res.status(500).json({
      error: 'Processing failed',
      message: error.message || '处理请求时发生错误，请稍后重试'
    })
  }
}

/**
 * 调用 GEMINI API
 * @param {string} prompt - 完整的 prompt
 * @param {string} apiKey - API 密钥
 * @returns {Promise<string>} - 生成的文本
 */
async function callGeminiAPI(prompt, apiKey) {
  const baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
  const model = 'gemini-2.0-flash-exp'
  
  const requestData = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
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
    throw new Error(`GEMINI API 请求失败: ${response.status} - ${errorData.error?.message || '未知错误'}`)
  }

  const data = await response.json()
  const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text
  
  if (!generatedText) {
    throw new Error('GEMINI API 返回的数据格式异常')
  }

  // 清理输出文本，移除不需要的格式化字符和前缀
  return cleanGeneratedText(generatedText.trim())
}

/**
 * 构建 prompt
 * @param {string} text - 输入文本
 * @param {Object} conversionParams - 转换参数（风格或目的+对象）
 * @param {string} outputLanguage - 输出语言
 * @returns {string} - 完整的 prompt
 */
function buildPrompt(text, conversionParams, outputLanguage) {
  // 风格配置
  const STYLE_CONFIG = {
    chat: {
      name: 'chat',
      displayName: '聊天风格',
      description: '轻松随意的聊天语调'
    },
    poem: {
      name: 'poem',
      displayName: '诗歌风格',
      description: '富有诗意的文学表达'
    },
    social: {
      name: 'social',
      displayName: '社交风格',
      description: '适合社交媒体的表达方式'
    },
    story: {
      name: 'story',
      displayName: '故事风格',
      description: '叙事性的故事表达'
    }
  }


  // 语言检测
  function detectLanguage(text) {
    const LANGUAGE_DETECTION = {
      zh: /[\u4e00-\u9fff\u3400-\u4dbf]/,
      ja: /[\u3040-\u309f\u30a0-\u30ff]/,
      de: /[äöüßÄÖÜ]/,
      es: /[ñáéíóúüÑÁÉÍÓÚÜ¿¡]/,
      en: /^[a-zA-Z\s\.,!?;:'"()-]+$/
    }

    if (LANGUAGE_DETECTION.ja.test(text)) return 'ja'
    if (LANGUAGE_DETECTION.zh.test(text)) return 'zh'
    if (LANGUAGE_DETECTION.de.test(text)) return 'de'
    if (LANGUAGE_DETECTION.es.test(text)) return 'es'
    if (LANGUAGE_DETECTION.en.test(text)) return 'en'
    return 'en'
  }

  // Prompt 模板
  function getPromptTemplate(language) {
    const templates = {
      zh: {
        instruction: (styleInfo) => `请将以下文本转换为${styleInfo.displayName}，要求：
1. 保持原意不变
2. 采用${styleInfo.description}
3. 语言自然流畅
4. 字数控制在合理范围内
5. 必须使用中文输出`,
        example: "原文：{text}\n\n请直接输出转换后的中文文本，不需要额外说明。"
      },
      en: {
        instruction: (styleInfo) => `Please transform the following text into ${styleInfo.name} style with requirements:
1. Keep the original meaning unchanged
2. Use ${styleInfo.description} tone
3. Natural and fluent language
4. Reasonable length control
5. Must output in English`,
        example: "Original text: {text}\n\nPlease output the transformed English text directly, no additional explanation needed."
      },
      ja: {
        instruction: (styleInfo) => `以下のテキストを${styleInfo.displayName}に変換してください。要件：
1. 元の意味を変えない
2. ${styleInfo.description}を採用
3. 自然で流暢な言語
4. 適切な長さにコントロール
5. 必ず日本語で出力`,
        example: "原文：{text}\n\n変換後の日本語テキストを直接出力してください。追加の説明は不要です。"
      },
      de: {
        instruction: (styleInfo) => `Bitte transformieren Sie den folgenden Text in ${styleInfo.name}-Stil mit folgenden Anforderungen:
1. Die ursprüngliche Bedeutung beibehalten
2. ${styleInfo.description} Ton verwenden
3. Natürliche und fließende Sprache
4. Angemessene Längenkontrolle
5. Muss auf Deutsch ausgegeben werden`,
        example: "Originaltext: {text}\n\nBitte geben Sie den transformierten deutschen Text direkt aus, keine zusätzliche Erklärung erforderlich."
      },
      es: {
        instruction: (styleInfo) => `Por favor transforma el siguiente texto al estilo ${styleInfo.name} con estos requisitos:
1. Mantener el significado original sin cambios
2. Usar el tono de ${styleInfo.description}
3. Lenguaje natural y fluido
4. Control de longitud razonable
5. Debe generar la salida en español`,
        example: "Texto original: {text}\n\nPor favor, genera directamente el texto transformado en español, sin explicaciones adicionales."
      }
    }

    return templates[language] || templates.en
  }

  // 根据转换模式获取配置信息
  let conversionInfo
  if (conversionParams.mode === 'style') {
    const styleInfo = STYLE_CONFIG[conversionParams.style] || STYLE_CONFIG.chat
    conversionInfo = {
      type: 'style',
      displayName: styleInfo.displayName,
      description: styleInfo.description
    }
  } else {
    // 处理自定义风格
    const styleConfig = conversionParams.styleConfig
    const styleDescription = styleConfig.description || '自定义风格'
    const customInstruction = styleConfig.promptTemplate || styleDescription

    conversionInfo = {
      type: 'custom_style',
      displayName: styleConfig.displayName || styleConfig.name,
      description: customInstruction,
      promptTemplate: styleConfig.promptTemplate
    }
  }

  // 确定目标语言
  let targetLanguage = outputLanguage
  if (outputLanguage === 'auto') {
    targetLanguage = detectLanguage(text)
  }

  // 获取对应语言的 prompt 模板
  const template = getPromptTemplate(targetLanguage)

  let instruction
  if (conversionInfo.type === 'style') {
    instruction = template.instruction(conversionInfo)
  } else {
    // 为自定义风格生成特殊的instruction
    if (conversionInfo.promptTemplate) {
      // 如果有自定义prompt模板，使用模板
      instruction = `请按照以下要求转换文本：
1. 保持原意不变
2. 风格要求：${conversionInfo.displayName}
3. 具体指令：${conversionInfo.promptTemplate}
4. 语言自然流畅
5. 字数控制在合理范围内`
    } else {
      // 使用默认的自定义风格instruction
      instruction = `请将以下文本转换为${conversionInfo.displayName}，要求：
1. 保持原意不变
2. 采用${conversionInfo.description}
3. 语言自然流畅
4. 字数控制在合理范围内`
    }

    // 根据目标语言调整输出要求
    if (targetLanguage === 'zh') {
      instruction += '\n5. 必须使用中文输出'
    } else if (targetLanguage === 'en') {
      instruction += '\n5. Must output in English'
    } else if (targetLanguage === 'ja') {
      instruction += '\n5. 必ず日本語で出力'
    }
  }
  
  const example = template.example.replace('{text}', text)
  
  return `${instruction}\n\n${example}`
}

/**
 * 清理生成的文本，移除不需要的格式化字符和前缀
 * @param {string} text - 原始生成文本
 * @returns {string} - 清理后的文本
 */
function cleanGeneratedText(text) {
  let cleanedText = text
  
  // 移除markdown代码块标记
  cleanedText = cleanedText.replace(/^```[\w]*\n?/gm, '')
  cleanedText = cleanedText.replace(/\n?```$/gm, '')
  cleanedText = cleanedText.replace(/```[\w]*\n?/g, '')
  cleanedText = cleanedText.replace(/\n?```/g, '')
  
  // 移除常见的前缀（如feat:, fix:, docs:等，包括git commit类型）
  cleanedText = cleanedText.replace(/^(feat|fix|docs|style|refactor|test|chore|build|ci|perf|revert|update|add|remove|change)[:：]\s*/i, '')
  
  // 移除其他常见的技术前缀
  cleanedText = cleanedText.replace(/^(task|bug|hotfix|feature|enhancement|improvement)[:：]\s*/i, '')
  
  // 移除可能的引号包围（支持中英文引号）
  cleanedText = cleanedText.replace(/^["'"'](.*?)["'"']$/s, '$1')
  
  // 移除可能的"转换后的文本："等前缀（多语言支持）
  cleanedText = cleanedText.replace(/^(转换后的文本|结果|输出|答案|回答|转换结果|转换后|伪装后的文本|伪装结果)[:：]\s*/i, '')
  cleanedText = cleanedText.replace(/^(transformed text|result|output|answer|response|conversion result|disguised text)[:：]\s*/i, '')
  cleanedText = cleanedText.replace(/^(変換後のテキスト|結果|出力|答え|回答|変換結果)[:：]\s*/i, '')
  cleanedText = cleanedText.replace(/^(transformierter text|ergebnis|ausgabe|antwort)[:：]\s*/i, '')
  cleanedText = cleanedText.replace(/^(texto transformado|resultado|respuesta|salida)[:：]\s*/i, '')
  
  // 移除可能的序号和列表标记
  cleanedText = cleanedText.replace(/^[0-9]+[\.、]\s*/, '')
  cleanedText = cleanedText.replace(/^[-*•]\s*/, '')
  
  // 移除多余的换行符和空白字符
  cleanedText = cleanedText.replace(/^\s+/, '').replace(/\s+$/, '')
  cleanedText = cleanedText.replace(/\n\s*\n/g, '\n')
  
  // 移除可能的HTML标签
  cleanedText = cleanedText.replace(/<[^>]*>/g, '')
  
  // 最后检查：如果开头还有冒号，移除到第一个冒号之后的内容
  cleanedText = cleanedText.replace(/^[^:：]*[:：]\s*/, '')
  
  return cleanedText.trim()
}

/**
 * 调用 OpenAI API
 * @param {string} prompt - 完整的 prompt
 * @param {string} apiKey - API 密钥
 * @returns {Promise<string>} - 生成的文本
 */
async function callOpenAIAPI(prompt, apiKey) {
  const baseUrl = 'https://api.openai.com/v1'
  const model = 'gpt-4o-mini'

  const requestData = {
    model: model,
    messages: [{
      role: 'user',
      content: prompt
    }],
    temperature: 0.7,
    max_tokens: 1024
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
    throw new Error(`OpenAI API 请求失败: ${response.status} - ${errorData.error?.message || '未知错误'}`)
  }

  const data = await response.json()
  const generatedText = data.choices?.[0]?.message?.content

  if (!generatedText) {
    throw new Error('OpenAI API 返回的数据格式异常')
  }

  return cleanGeneratedText(generatedText.trim())
}

/**
 * 调用 Claude API
 * @param {string} prompt - 完整的 prompt
 * @param {string} apiKey - API 密钥
 * @returns {Promise<string>} - 生成的文本
 */
async function callClaudeAPI(prompt, apiKey) {
  const baseUrl = 'https://api.anthropic.com/v1'
  const model = 'claude-3-5-haiku-20241022'

  const requestData = {
    model: model,
    messages: [{
      role: 'user',
      content: prompt
    }],
    max_tokens: 1024,
    temperature: 0.7
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
    throw new Error(`Claude API 请求失败: ${response.status} - ${errorData.error?.message || '未知错误'}`)
  }

  const data = await response.json()
  const generatedText = data.content?.[0]?.text

  if (!generatedText) {
    throw new Error('Claude API 返回的数据格式异常')
  }

  return cleanGeneratedText(generatedText.trim())
}

/**
 * 调用 DeepSeek API
 * @param {string} prompt - 完整的 prompt
 * @param {string} apiKey - API 密钥
 * @returns {Promise<string>} - 生成的文本
 */
async function callDeepSeekAPI(prompt, apiKey) {
  const baseUrl = 'https://api.deepseek.com/v1'
  const model = 'deepseek-chat'

  const requestData = {
    model: model,
    messages: [{
      role: 'user',
      content: prompt
    }],
    temperature: 0.7,
    max_tokens: 1024
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
    throw new Error(`DeepSeek API 请求失败: ${response.status} - ${errorData.error?.message || '未知错误'}`)
  }

  const data = await response.json()
  const generatedText = data.choices?.[0]?.message?.content

  if (!generatedText) {
    throw new Error('DeepSeek API 返回的数据格式异常')
  }

  return cleanGeneratedText(generatedText.trim())
}