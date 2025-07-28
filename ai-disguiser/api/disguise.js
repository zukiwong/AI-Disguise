// Vercel 无服务器 API 路由
// 处理文本伪装请求，隐藏 GEMINI API 密钥

/**
 * 文本伪装 API 端点
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
    const { text, style, outputLanguage = 'auto' } = req.body

    // 参数验证
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: '输入文本不能为空'
      })
    }

    if (!style || typeof style !== 'string') {
      return res.status(400).json({
        error: 'Invalid style',
        message: '风格参数无效'
      })
    }

    // 字符数限制检查
    const MAX_LENGTH = 300
    if (text.length > MAX_LENGTH) {
      return res.status(400).json({
        error: 'Text too long',
        message: `输入文本不能超过 ${MAX_LENGTH} 个字符`
      })
    }

    // 从环境变量获取 API 密钥
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error('GEMINI_API_KEY 环境变量未设置')
      return res.status(500).json({
        error: 'Configuration error',
        message: '服务器配置错误'
      })
    }

    // 构建 prompt
    const prompt = buildPrompt(text, style, outputLanguage)

    // 调用 GEMINI API
    const response = await callGeminiAPI(prompt, apiKey)

    // 返回成功响应
    res.status(200).json({
      success: true,
      result: response,
      metadata: {
        inputLength: text.length,
        style: style,
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

  return generatedText.trim()
}

/**
 * 构建 prompt
 * @param {string} text - 输入文本
 * @param {string} style - 风格
 * @param {string} outputLanguage - 输出语言
 * @returns {string} - 完整的 prompt
 */
function buildPrompt(text, style, outputLanguage) {
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

  const styleInfo = STYLE_CONFIG[style] || STYLE_CONFIG.chat
  
  // 确定目标语言
  let targetLanguage = outputLanguage
  if (outputLanguage === 'auto') {
    targetLanguage = detectLanguage(text)
  }
  
  // 获取对应语言的 prompt 模板
  const template = getPromptTemplate(targetLanguage)
  const instruction = template.instruction(styleInfo)
  const example = template.example.replace('{text}', text)
  
  return `${instruction}\n\n${example}`
}