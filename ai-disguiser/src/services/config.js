// API 配置管理模块
// 统一管理所有 API 相关的配置信息

// GEMINI API 配置
export const GEMINI_CONFIG = {
  // API 基础 URL (从环境变量读取，回退到默认值)
  BASE_URL: import.meta.env.VITE_GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
  // 模型名称 (从环境变量读取，回退到默认值)
  MODEL: import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash-exp',
  // API 密钥 (优先从环境变量读取，开发时可回退到硬编码)
  API_KEY: import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyCXbIQijyLAy8eQkcpIKGuylTepb5dylxA',
  // 请求超时时间 (毫秒)
  TIMEOUT: 30000,
  // 最大重试次数
  MAX_RETRIES: 3
}

// 文本限制配置
export const TEXT_LIMITS = {
  // 最大输入字符数 (从环境变量读取，回退到默认值)
  MAX_INPUT_LENGTH: parseInt(import.meta.env.VITE_MAX_INPUT_LENGTH) || 300,
  // 最小输入字符数
  MIN_INPUT_LENGTH: 1
}

// 风格配置
export const STYLE_CONFIG = {
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
    name: '自动检测',
    displayName: '🌐 自动检测',
    description: '根据输入文本自动选择输出语言'
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    displayName: '🇨🇳 中文',
    description: '中文输出'
  },
  en: {
    code: 'en',
    name: 'English',
    displayName: '🇺🇸 English',
    description: '英文输出'
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    displayName: '🇯🇵 日本語',
    description: '日语输出'
  },
  de: {
    code: 'de',
    name: 'German',
    displayName: '🇩🇪 Deutsch',
    description: '德语输出'
  },
  es: {
    code: 'es',
    name: 'Spanish',
    displayName: '🇪🇸 Español',
    description: '西班牙语输出'
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