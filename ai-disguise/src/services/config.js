// API 配置管理模块
// 统一管理所有 API 相关的配置信息

// 前端配置（现在使用后端 API，不再需要直接的 GEMINI 配置）
export const APP_CONFIG = {
  // 应用名称
  APP_NAME: 'AI Disguise',
  // API 端点（后端 API）
  API_ENDPOINT: '/api/disguise',
  // 请求超时时间 (毫秒)
  TIMEOUT: 30000,
  // 最大重试次数
  MAX_RETRIES: 3
}

// 文本限制配置
export const TEXT_LIMITS = {
  // 最大输入字符数
  MAX_INPUT_LENGTH: 300,
  // 最小输入字符数
  MIN_INPUT_LENGTH: 1
}

// 风格配置
export const STYLE_CONFIG = {
  chat: {
    name: 'chat',
    displayName: 'Chat Style',
    description: 'Casual and relaxed conversational tone'
  },
  poem: {
    name: 'poem',
    displayName: 'Poetic Style',
    description: 'Literary expression with poetic flair'
  },
  social: {
    name: 'social',
    displayName: 'Social Style',
    description: 'Expression suitable for social media'
  },
  story: {
    name: 'story',
    displayName: 'Story Style',
    description: 'Narrative storytelling expression'
  }
}

// 多语言功能配置
export const LANGUAGE_FEATURE = {
  // 功能开关 - 设置为 false 可以完全停用多语言功能
  ENABLED: true,
  // 默认输出语言（当功能启用时）
  DEFAULT_OUTPUT_LANGUAGE: 'auto' // 'auto' 表示自动检测输入语言
}

// 支持的语言配置
export const LANGUAGE_CONFIG = {
  auto: {
    code: 'auto',
    name: 'Auto Detect',
    displayName: 'Auto Detect',
    description: 'Automatically select output language based on input text'
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    displayName: 'Chinese',
    description: 'Chinese output'
  },
  en: {
    code: 'en',
    name: 'English',
    displayName: 'English',
    description: 'English output'
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    displayName: '日本語',
    description: 'Japanese output'
  },
  de: {
    code: 'de',
    name: 'German',
    displayName: 'Deutsch',
    description: 'German output'
  },
  es: {
    code: 'es',
    name: 'Spanish',
    displayName: 'Español',
    description: 'Spanish output'
  }
}

// 转换模式配置
export const CONVERSION_MODE = {
  STYLE: 'style',        // 风格模式
  PURPOSE: 'purpose'     // 目的+对象模式
}

// 表达目的配置
export const PURPOSE_CONFIG = {
  explain: {
    name: 'explain',
    displayName: 'Explain / Clarify',
    description: 'Make complex concepts clear and understandable'
  },
  ask: {
    name: 'ask', 
    displayName: 'Ask / Guide',
    description: 'Pose questions, guide discussion or initiate conversation'
  },
  persuade: {
    name: 'persuade',
    displayName: 'Persuade / Convince', 
    description: 'Try to get others to accept viewpoints or suggestions'
  },
  comfort: {
    name: 'comfort',
    displayName: 'Comfort / Support',
    description: 'Provide emotional support and ease emotions'
  },
  soften: {
    name: 'soften',
    displayName: 'Soften Expression',
    description: 'Want to express something but not too directly'
  },
  frustration: {
    name: 'frustration', 
    displayName: 'Express Anger / Dissatisfaction',
    description: 'Have emotions but don\'t want to attack maliciously'
  },
  compliment: {
    name: 'compliment',
    displayName: 'Praise / Compliment',
    description: 'Give positive feedback to others'
  },
  apologize: {
    name: 'apologize',
    displayName: 'Apologize / Admit Fault',
    description: 'Actively express regret or apology'
  },
  announce: {
    name: 'announce',
    displayName: 'Announce / State Position',
    description: 'Express personal or official stance'
  },
  probe: {
    name: 'probe',
    displayName: 'Probe / Subtle Expression',
    description: 'Leave room for interpretation, observe reactions'
  }
}

// 表达对象配置
export const RECIPIENT_CONFIG = {
  child: {
    name: 'child',
    displayName: 'Child',
    description: 'Language should be concrete, vivid, avoid abstraction'
  },
  parents: {
    name: 'parents',
    displayName: 'Parents',
    description: 'Respectful tone with patience'
  },
  boss: {
    name: 'boss', 
    displayName: 'Boss',
    description: 'Tactful, concise, logically clear'
  },
  colleague: {
    name: 'colleague',
    displayName: 'Colleague',
    description: 'Collaborative, professional tone'
  },
  friend: {
    name: 'friend',
    displayName: 'Friend',
    description: 'Natural, relaxed, informal'
  },
  stranger: {
    name: 'stranger',
    displayName: 'Stranger', 
    description: 'Politely neutral'
  },
  ex: {
    name: 'ex',
    displayName: 'Ex-partner',
    description: 'Complex emotions, need careful balance'
  },
  partner: {
    name: 'partner',
    displayName: 'Partner / Lover',
    description: 'Emotional, understanding, intimate tone'
  },
  public: {
    name: 'public',
    displayName: 'Public',
    description: 'General conversational or public discourse'
  },
  ai: {
    name: 'ai',
    displayName: 'AI Assistant',
    description: 'Clear structure with instructional expression'
  }
}

// 语言检测正则表达式
export const LANGUAGE_DETECTION = {
  // 中文检测 - 包含中日韩统一表意文字
  zh: /[\u4e00-\u9fff\u3400-\u4dbf]/,
  // 日文检测 - 平假名、片假名
  ja: /[\u3040-\u309f\u30a0-\u30ff]/,
  // 德语检测 - 德语特有字符
  de: /[äöüßÄÖÜ]/,
  // 西班牙语检测 - 西语特有字符
  es: /[ñáéíóúüÑÁÉÍÓÚÜ¿¡]/,
  // 英文检测 - 基本拉丁字母（作为默认）
  en: /^[a-zA-Z\s\.,!?;:'"()-]+$/
}