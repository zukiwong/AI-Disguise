// 数据处理和统计服务模块
// 负责分析用户数据，生成统计信息

/**
 * 处理用户数据，生成分析所需的统计信息
 * @param {Array} historyRecords - 用户历史记录
 * @param {Array} userTags - 用户标签
 * @returns {Object} - 处理后的数据结构
 */
export function processUserData(historyRecords, userTags) {
  const basicStats = generateBasicStats(historyRecords)
  const usagePatterns = analyzeUsagePatterns(historyRecords)
  const styleAnalysis = analyzeStyleUsage(historyRecords)
  const languageAnalysis = analyzeLanguageUsage(historyRecords)
  const timePatterns = analyzeTimePatterns(historyRecords)
  const topTransformations = getTopTransformations(historyRecords, 10)

  return {
    basicStats,
    usagePatterns,
    styleAnalysis,
    languageAnalysis,
    timePatterns,
    topTransformations,
    userTags
  }
}

/**
 * 生成基础统计信息
 * @param {Array} historyRecords - 历史记录
 * @returns {Object} - 基础统计数据
 */
export function generateBasicStats(historyRecords) {
  const totalTransformations = historyRecords.length
  const favoritesCount = historyRecords.filter(r => r.isFavorited).length
  const averageTextLength = Math.round(
    historyRecords.reduce((sum, r) => sum + (r.original?.length || 0), 0) / totalTransformations || 0
  )

  // 计算活跃天数
  const activeDays = new Set(
    historyRecords.map(r => new Date(r.createdAt).toDateString())
  ).size

  // 计算日期范围
  const dates = historyRecords.map(r => new Date(r.createdAt)).sort((a, b) => a - b)
  const dateRange = dates.length > 0 ? {
    start: dates[0].toISOString().split('T')[0],
    end: dates[dates.length - 1].toISOString().split('T')[0]
  } : null

  return {
    totalTransformations,
    favoritesCount,
    favoriteRate: totalTransformations > 0 ? Math.round((favoritesCount / totalTransformations) * 100) : 0,
    averageTextLength,
    activeDays,
    dateRange,
    averagePerDay: activeDays > 0 ? Math.round(totalTransformations / activeDays * 10) / 10 : 0
  }
}

/**
 * 分析使用模式
 * @param {Array} historyRecords - 历史记录
 * @returns {Object} - 使用模式分析
 */
function analyzeUsagePatterns(historyRecords) {
  const modeCount = {}
  const purposeCount = {}
  const recipientCount = {}

  historyRecords.forEach(record => {
    // 统计转换模式
    const mode = record.conversionMode || 'unknown'
    modeCount[mode] = (modeCount[mode] || 0) + 1

    // 统计目的
    if (record.purpose) {
      purposeCount[record.purpose] = (purposeCount[record.purpose] || 0) + 1
    }

    // 统计对象
    if (record.recipient) {
      recipientCount[record.recipient] = (recipientCount[record.recipient] || 0) + 1
    }
  })

  return {
    preferredMode: Object.keys(modeCount).reduce((a, b) => modeCount[a] > modeCount[b] ? a : b, 'style'),
    modeDistribution: modeCount,
    topPurposes: Object.entries(purposeCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5),
    topRecipients: Object.entries(recipientCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
  }
}

/**
 * 分析风格使用情况
 * @param {Array} historyRecords - 历史记录
 * @returns {Object} - 风格分析数据
 */
function analyzeStyleUsage(historyRecords) {
  const styleCount = {}
  const variantCount = {}

  historyRecords.forEach(record => {
    if (record.style) {
      styleCount[record.style] = (styleCount[record.style] || 0) + 1
    }
    if (record.variant) {
      variantCount[record.variant] = (variantCount[record.variant] || 0) + 1
    }
  })

  const sortedStyles = Object.entries(styleCount)
    .sort(([,a], [,b]) => b - a)

  return {
    mostUsedStyle: sortedStyles[0] ? sortedStyles[0][0] : null,
    styleDistribution: styleCount,
    variantDistribution: variantCount,
    uniqueStylesUsed: Object.keys(styleCount).length,
    styleRanking: sortedStyles
  }
}

/**
 * 分析语言使用情况
 * @param {Array} historyRecords - 历史记录
 * @returns {Object} - 语言分析数据
 */
function analyzeLanguageUsage(historyRecords) {
  const inputLanguages = {}
  const outputLanguages = {}

  historyRecords.forEach(record => {
    if (record.detectedLanguage) {
      inputLanguages[record.detectedLanguage] = (inputLanguages[record.detectedLanguage] || 0) + 1
    }
    if (record.outputLanguage) {
      outputLanguages[record.outputLanguage] = (outputLanguages[record.outputLanguage] || 0) + 1
    }
  })

  return {
    inputLanguageDistribution: inputLanguages,
    outputLanguageDistribution: outputLanguages,
    primaryInputLanguage: Object.keys(inputLanguages).reduce((a, b) =>
      inputLanguages[a] > inputLanguages[b] ? a : b, 'unknown'),
    primaryOutputLanguage: Object.keys(outputLanguages).reduce((a, b) =>
      outputLanguages[a] > outputLanguages[b] ? a : b, 'unknown')
  }
}

/**
 * 分析时间使用模式
 * @param {Array} historyRecords - 历史记录
 * @returns {Object} - 时间模式分析
 */
function analyzeTimePatterns(historyRecords) {
  const hourCount = {}
  const dayOfWeekCount = {}
  const monthCount = {}

  historyRecords.forEach(record => {
    const date = new Date(record.createdAt)
    const hour = date.getHours()
    const dayOfWeek = date.getDay()
    const month = date.getMonth()

    hourCount[hour] = (hourCount[hour] || 0) + 1
    dayOfWeekCount[dayOfWeek] = (dayOfWeekCount[dayOfWeek] || 0) + 1
    monthCount[month] = (monthCount[month] || 0) + 1
  })

  // 找出最活跃的时间段
  const mostActiveHour = Object.keys(hourCount).reduce((a, b) =>
    hourCount[a] > hourCount[b] ? a : b, '0')

  const mostActiveDay = Object.keys(dayOfWeekCount).reduce((a, b) =>
    dayOfWeekCount[a] > dayOfWeekCount[b] ? a : b, '0')

  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

  return {
    hourlyDistribution: hourCount,
    dailyDistribution: dayOfWeekCount,
    monthlyDistribution: monthCount,
    mostActiveHour: parseInt(mostActiveHour),
    mostActiveDay: dayNames[parseInt(mostActiveDay)],
    peakUsagePattern: getPeakUsagePattern(hourCount)
  }
}

/**
 * 获取使用高峰模式
 * @param {Object} hourCount - 小时使用统计
 * @returns {string} - 使用模式描述
 */
function getPeakUsagePattern(hourCount) {
  const morningHours = [6, 7, 8, 9, 10, 11]
  const afternoonHours = [12, 13, 14, 15, 16, 17]
  const eveningHours = [18, 19, 20, 21, 22, 23]
  const nightHours = [0, 1, 2, 3, 4, 5]

  const morningTotal = morningHours.reduce((sum, hour) => sum + (hourCount[hour] || 0), 0)
  const afternoonTotal = afternoonHours.reduce((sum, hour) => sum + (hourCount[hour] || 0), 0)
  const eveningTotal = eveningHours.reduce((sum, hour) => sum + (hourCount[hour] || 0), 0)
  const nightTotal = nightHours.reduce((sum, hour) => sum + (hourCount[hour] || 0), 0)

  const max = Math.max(morningTotal, afternoonTotal, eveningTotal, nightTotal)

  if (max === morningTotal) return '早晨型用户'
  if (max === afternoonTotal) return '下午型用户'
  if (max === eveningTotal) return '晚间型用户'
  return '夜猫子型用户'
}

/**
 * 获取最常复用的转换
 * @param {Array} historyRecords - 历史记录
 * @param {number} limit - 返回数量限制
 * @returns {Array} - 排序后的转换列表
 */
function getTopTransformations(historyRecords, limit = 10) {
  return historyRecords
    .filter(record => record.usageCount > 1 || record.isFavorited)
    .sort((a, b) => {
      // 优先按使用次数排序，然后按收藏状态
      if (b.usageCount !== a.usageCount) {
        return b.usageCount - a.usageCount
      }
      return b.isFavorited - a.isFavorited
    })
    .slice(0, limit)
    .map(record => ({
      id: record.id,
      original: record.original,
      disguised: record.disguised,
      usageCount: record.usageCount,
      isFavorited: record.isFavorited,
      createdAt: record.createdAt,
      style: record.style,
      purpose: record.purpose,
      recipient: record.recipient
    }))
}

export const dataProcessingService = {
  processUserData,
  generateBasicStats,
  analyzeUsagePatterns,
  analyzeStyleUsage,
  analyzeLanguageUsage,
  analyzeTimePatterns,
  getTopTransformations
}