// AI分析服务模块
// 使用现有的后端API（不暴露API密钥）生成智能分析

/**
 * 生成用户智能洞察报告
 * @param {Object} processedData - 处理后的用户数据
 * @param {Object} userProfile - 用户资料
 * @returns {Promise<Object>} - AI生成的分析洞察
 */
export async function generateUserInsights(processedData, userProfile) {
  try {
    // 构建分析提示词
    const analysisPrompt = buildAnalysisPrompt(processedData, userProfile)

    // 调用后端API进行AI分析（复用现有的disguiseText API）
    const aiInsights = await callBackendForAnalysis(analysisPrompt)

    // 解析AI返回的分析结果
    const structuredInsights = parseInsightsResponse(aiInsights)

    return structuredInsights

  } catch (error) {
    console.error('AI分析生成失败:', error)
    // 返回备用的基础分析
    return generateFallbackInsights(processedData, userProfile)
  }
}

/**
 * 构建AI分析提示词
 * @param {Object} processedData - 处理后的数据
 * @param {Object} userProfile - 用户资料
 * @returns {string} - 分析提示词
 */
function buildAnalysisPrompt(processedData, userProfile) {
  const { basicStats, usagePatterns, styleAnalysis, languageAnalysis, timePatterns } = processedData

  return `Please analyze the following AI Disguise usage data and generate personalized insights:

User Statistics:
- Total transformations: ${basicStats.totalTransformations}
- Favorite rate: ${basicStats.favoriteRate}%
- Active days: ${basicStats.activeDays} days
- Daily average: ${basicStats.averagePerDay} times
- Average text length: ${basicStats.averageTextLength} characters

Usage Patterns:
- Preferred mode: ${usagePatterns.preferredMode}
- Most used style: ${styleAnalysis.mostUsedStyle || 'none'}
- Primary input language: ${languageAnalysis.primaryInputLanguage}
- Peak usage time: ${timePatterns.mostActiveHour}:00
- Most active day: ${timePatterns.mostActiveDay}

Please provide analysis in this JSON format:
{
  "personalityInsights": "personality analysis based on usage patterns (2-3 sentences)",
  "usageHabits": "usage habits summary (2-3 sentences)",
  "strengths": "discovered strengths and characteristics (2-3 sentences)",
  "recommendations": [
    "personalized recommendation 1",
    "personalized recommendation 2",
    "personalized recommendation 3"
  ],
  "interestingPatterns": [
    "interesting discovery 1",
    "interesting discovery 2"
  ],
  "achievementLevel": "user level based on usage (beginner/intermediate/advanced/expert)",
  "nextGoals": [
    "suggested next goal 1",
    "suggested next goal 2"
  ]
}`
}

/**
 * 调用后端API进行分析
 * @param {string} prompt - 分析提示词
 * @returns {Promise<string>} - AI分析结果
 */
async function callBackendForAnalysis(prompt) {
  try {
    // 使用现有的后端API，通过chat风格处理分析请求
    const response = await fetch('/api/disguise', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: prompt,
        mode: 'style',
        style: 'chat', // 使用chat风格确保回复格式友好
        outputLanguage: 'en' // 改为英文输出
      }),
    })

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }

    const data = await response.json()

    if (!data.success || !data.result) {
      throw new Error('API返回的数据格式异常')
    }

    return data.result

  } catch (error) {
    console.error('后端AI分析调用失败:', error)
    throw error
  }
}

/**
 * 解析AI返回的分析结果
 * @param {string} aiResponse - AI原始回复
 * @returns {Object} - 结构化的分析结果
 */
function parseInsightsResponse(aiResponse) {
  try {
    // 尝试提取JSON部分
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    // 如果没有JSON格式，尝试解析文本格式
    return parseTextResponse(aiResponse)

  } catch (error) {
    console.error('解析AI分析结果失败:', error)
    // 返回基于原始文本的简单结构
    return {
      personalityInsights: aiResponse.slice(0, 200) + '...',
      usageHabits: '根据您的使用数据，展现出独特的使用偏好。',
      strengths: '您在使用AI Disguise方面表现出良好的习惯。',
      recommendations: ['继续保持当前的使用频率', '尝试探索更多功能', '分享您的使用心得'],
      interestingPatterns: ['发现了您独特的使用模式'],
      achievementLevel: '进阶',
      nextGoals: ['提升使用效率', '探索新功能']
    }
  }
}

/**
 * 解析文本格式的AI回复
 * @param {string} textResponse - 文本回复
 * @returns {Object} - 结构化结果
 */
function parseTextResponse(textResponse) {
  const lines = textResponse.split('\n').filter(line => line.trim())

  // Try both English and Chinese keywords
  return {
    personalityInsights: extractSection(lines, 'personality') || extractSection(lines, '个性分析') || extractSection(lines, '性格') || 'You show unique usage patterns and preferences.',
    usageHabits: extractSection(lines, 'habits') || extractSection(lines, 'usage') || extractSection(lines, '使用习惯') || 'You have consistent usage habits and frequency.',
    strengths: extractSection(lines, 'strengths') || extractSection(lines, '优势') || extractSection(lines, '特点') || 'You demonstrate excellent text expression abilities.',
    recommendations: extractList(lines, 'recommend') || extractList(lines, '建议') || ['Continue current usage frequency', 'Try more styles', 'Share insights'],
    interestingPatterns: extractList(lines, 'patterns') || extractList(lines, 'discover') || extractList(lines, '发现') || ['Discovered unique usage preferences'],
    achievementLevel: determineLevel(textResponse),
    nextGoals: extractList(lines, 'goals') || extractList(lines, '目标') || ['Improve usage skills', 'Explore new features']
  }
}

/**
 * 从文本中提取特定部分
 * @param {Array} lines - 文本行数组
 * @param {string} keyword - 关键词
 * @returns {string|null} - 提取的内容
 */
function extractSection(lines, keyword) {
  const sectionLine = lines.find(line => line.includes(keyword))
  return sectionLine ? sectionLine.replace(/^[^：:]*[：:]/, '').trim() : null
}

/**
 * 从文本中提取列表
 * @param {Array} lines - 文本行数组
 * @param {string} keyword - 关键词
 * @returns {Array} - 提取的列表
 */
function extractList(lines, keyword) {
  const startIndex = lines.findIndex(line => line.includes(keyword))
  if (startIndex === -1) return null

  const listItems = []
  for (let i = startIndex + 1; i < lines.length && i < startIndex + 5; i++) {
    const line = lines[i].trim()
    if (line && (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./))) {
      listItems.push(line.replace(/^[-•\d\s.]+/, '').trim())
    }
  }

  return listItems.length > 0 ? listItems : null
}

/**
 * 根据文本确定用户等级
 * @param {string} text - AI回复文本
 * @returns {string} - 用户等级
 */
function determineLevel(text) {
  const lowerText = text.toLowerCase()
  if (lowerText.includes('expert') || lowerText.includes('advanced') || lowerText.includes('专家') || lowerText.includes('高级') || lowerText.includes('熟练')) return 'expert'
  if (lowerText.includes('intermediate') || lowerText.includes('进阶') || lowerText.includes('中级') || lowerText.includes('不错')) return 'intermediate'
  if (lowerText.includes('beginner') || lowerText.includes('新手') || lowerText.includes('初级') || lowerText.includes('刚开始')) return 'beginner'
  return 'intermediate'
}

/**
 * 生成备用分析（当AI分析失败时使用）
 * @param {Object} processedData - 处理后的数据
 * @param {Object} userProfile - 用户资料
 * @returns {Object} - 备用分析结果
 */
function generateFallbackInsights(processedData, userProfile) {
  const { basicStats, usagePatterns, styleAnalysis, timePatterns } = processedData

  // Generate basic analysis based on data
  let achievementLevel = 'beginner'
  if (basicStats.totalTransformations > 100) achievementLevel = 'expert'
  else if (basicStats.totalTransformations > 30) achievementLevel = 'intermediate'

  const recommendations = []
  if (basicStats.favoriteRate < 20) {
    recommendations.push('Try using the favorite feature to save quality transformations')
  }
  if (styleAnalysis.uniqueStylesUsed < 3) {
    recommendations.push('Explore more diverse expression styles')
  }
  if (basicStats.averagePerDay < 2) {
    recommendations.push('Maintain regular usage to improve expression skills')
  }

  const timePattern = getEnglishTimePattern(timePatterns.peakUsagePattern)
  const dayName = getEnglishDayName(timePatterns.mostActiveDay)

  return {
    personalityInsights: `You are a ${timePattern} user who prefers ${usagePatterns.preferredMode === 'style' ? 'style-based' : 'purpose-oriented'} expression methods.`,
    usageHabits: `You have been using AI Disguise for ${basicStats.activeDays} days with an average of ${basicStats.averagePerDay} times per day, showing consistent usage patterns.`,
    strengths: `Your favorite rate reaches ${basicStats.favoriteRate}%, demonstrating good content curation skills and ability to identify quality expressions.`,
    recommendations: recommendations.length > 0 ? recommendations : ['Continue your current usage frequency', 'Try new expression styles', 'Share interesting transformations with friends'],
    interestingPatterns: [
      `You prefer using AI Disguise on ${dayName} at ${timePatterns.mostActiveHour}:00`,
      `${styleAnalysis.mostUsedStyle ? `You particularly favor the "${styleAnalysis.mostUsedStyle}" style` : 'Your style usage is well-balanced'}`
    ],
    achievementLevel,
    nextGoals: [
      'Try challenging longer text transformations',
      'Explore unused styles',
      'Build your personal expression style library'
    ]
  }
}

/**
 * Convert time pattern to English (helper function for fallback)
 */
function getEnglishTimePattern(chinesePattern) {
  const patterns = {
    '早晨型用户': 'morning',
    '下午型用户': 'afternoon',
    '晚间型用户': 'evening',
    '夜猫子型用户': 'night owl'
  }
  return patterns[chinesePattern] || 'regular'
}

/**
 * Convert day name to English (helper function for fallback)
 */
function getEnglishDayName(chineseDayName) {
  const days = {
    '周一': 'Monday',
    '周二': 'Tuesday',
    '周三': 'Wednesday',
    '周四': 'Thursday',
    '周五': 'Friday',
    '周六': 'Saturday',
    '周日': 'Sunday'
  }
  return days[chineseDayName] || 'weekdays'
}

export const aiAnalysisService = {
  generateUserInsights,
  buildAnalysisPrompt,
  callBackendForAnalysis,
  parseInsightsResponse,
  generateFallbackInsights
}