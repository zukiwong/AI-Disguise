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