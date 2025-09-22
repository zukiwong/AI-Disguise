// 文件生成服务模块
// 负责生成各种格式的导出文件（PDF、HTML、JSON等）

import jsPDF from 'jspdf'
import { Chart, registerables } from 'chart.js'

// 注册Chart.js组件
Chart.register(...registerables)

/**
 * 获取样式显示名称
 * @param {string} styleId - 样式ID
 * @returns {string} - 显示名称
 */
function getStyleDisplayName(styleId) {
  if (!styleId) return null

  // Try to get from localStorage first (for custom styles)
  try {
    const customStyles = JSON.parse(localStorage.getItem('customStyles') || '[]')
    const customStyle = customStyles.find(style => style.id === styleId)
    if (customStyle) return customStyle.displayName
  } catch (error) {
    console.warn('Failed to parse custom styles from localStorage')
  }

  // Fallback to built-in styles
  const builtInStyles = {
    'chat': 'Chat Style',
    'poem': 'Poetic Style',
    'social': 'Social Style',
    'story': 'Story Style'
  }

  return builtInStyles[styleId] || styleId
}

/**
 * 生成基础统计报告PDF
 * @param {Object} processedData - 处理后的数据
 * @param {Object} userProfile - 用户资料
 * @returns {Promise<Blob>} - PDF文件Blob
 */
export async function generateBasicStatsReport(processedData, userProfile) {
  const pdf = new jsPDF('p', 'mm', 'a4')

  // Set better font for consistency
  pdf.setFont('helvetica')

  let yPosition = 20

  // 1. 标题页
  yPosition = addBasicReportHeader(pdf, yPosition, userProfile)

  // 2. 基础统计
  yPosition = addBasicStatisticsSection(pdf, yPosition, processedData)

  // 3. 使用趋势
  yPosition = addBasicTrendsSection(pdf, yPosition, processedData)

  // 4. 页脚
  addBasicReportFooter(pdf)

  return pdf.output('blob')
}

/**
 * 生成智能分析报告PDF
 * @param {Object} processedData - 处理后的数据
 * @param {Object} aiInsights - AI分析洞察
 * @param {Object} userProfile - 用户资料
 * @returns {Promise<Blob>} - PDF文件Blob
 */
export async function generateSmartAnalysisReport(processedData, aiInsights, userProfile) {
  const pdf = new jsPDF('p', 'mm', 'a4')

  // Set consistent font
  pdf.setFont('helvetica')

  let yPosition = 20

  // 1. 标题页
  yPosition = addSmartReportHeader(pdf, yPosition, userProfile)

  // 2. AI洞察分析
  yPosition = await addAIInsightsSection(pdf, yPosition, aiInsights)

  // 3. 数据统计图表
  yPosition = await addChartsSection(pdf, yPosition, processedData)

  // 4. 详细统计
  yPosition = addStatisticsSection(pdf, yPosition, processedData)

  // 5. 使用趋势
  yPosition = addTrendsSection(pdf, yPosition, processedData)

  // 6. 页脚
  addSmartReportFooter(pdf)

  return pdf.output('blob')
}

/**
 * 添加基础报告标题
 * @param {jsPDF} pdf - PDF实例
 * @param {number} yPosition - Y坐标
 * @param {Object} userProfile - 用户资料
 * @returns {number} - 新的Y坐标
 */
function addBasicReportHeader(pdf, yPosition, userProfile) {
  // Logo区域
  pdf.setFontSize(16)
  pdf.setTextColor(46, 125, 50) // WordShelf绿色
  pdf.text('WordShelf', 20, yPosition)

  yPosition += 25

  // 主标题
  pdf.setFontSize(24)
  pdf.setTextColor(46, 125, 50) // WordShelf绿色
  pdf.text('Personal Report', 105, yPosition, { align: 'center' })

  yPosition += 15

  // 副标题
  pdf.setFontSize(12)
  pdf.setTextColor(100, 100, 100)
  const currentDate = new Date().toLocaleDateString('en-US')
  pdf.text(`Generated on: ${currentDate}`, 105, yPosition, { align: 'center' })

  yPosition += 20

  // 分隔线
  pdf.setDrawColor(200, 200, 200)
  pdf.line(20, yPosition, 190, yPosition)

  return yPosition + 15
}

/**
 * 添加基础统计部分
 * @param {jsPDF} pdf - PDF实例
 * @param {number} yPosition - Y坐标
 * @param {Object} processedData - 数据
 * @returns {number} - 新的Y坐标
 */
function addBasicStatisticsSection(pdf, yPosition, processedData) {
  const { basicStats, styleAnalysis, languageAnalysis } = processedData

  // 章节标题
  pdf.setFontSize(16)
  pdf.setTextColor(0, 0, 0)
  pdf.text('Usage Statistics', 20, yPosition)
  yPosition += 15

  // 基础统计
  const stats = [
    ['Total Transformations', basicStats.totalTransformations],
    ['Favorites Count', basicStats.favoritesCount],
    ['Favorite Rate', `${basicStats.favoriteRate}%`],
    ['Active Days', `${basicStats.activeDays} days`],
    ['Daily Average', `${basicStats.averagePerDay} times`],
    ['Average Text Length', `${basicStats.averageTextLength} characters`],
    ['Unique Styles Used', styleAnalysis.uniqueStylesUsed],
    ['Primary Input Language', languageAnalysis.primaryInputLanguage],
    ['Primary Output Language', languageAnalysis.primaryOutputLanguage]
  ]

  // 创建统计表格
  yPosition = addStatsTable(pdf, yPosition, stats)

  return yPosition
}

/**
 * 添加基础趋势部分
 * @param {jsPDF} pdf - PDF实例
 * @param {number} yPosition - Y坐标
 * @param {Object} processedData - 数据
 * @returns {number} - 新的Y坐标
 */
function addBasicTrendsSection(pdf, yPosition, processedData) {
  const { timePatterns, usagePatterns } = processedData

  // 检查是否需要新页面
  if (yPosition > 200) {
    pdf.addPage()
    yPosition = 20
  }

  // 章节标题
  pdf.setFontSize(16)
  pdf.setTextColor(0, 0, 0)
  pdf.text('Usage Patterns', 20, yPosition)
  yPosition += 15

  // 使用模式分析
  yPosition = addEnglishTextSection(pdf, yPosition, 'Time Preference',
    `You are a ${getEnglishTimePattern(timePatterns.peakUsagePattern)} user, most active on ${getEnglishDayName(timePatterns.mostActiveDay)} at ${timePatterns.mostActiveHour}:00.`)

  // 偏好模式
  yPosition = addEnglishTextSection(pdf, yPosition, 'Preferred Mode',
    `You prefer using ${usagePatterns.preferredMode === 'style' ? 'Style Mode' : 'Purpose Mode'} for text transformations.`)

  return yPosition
}

/**
 * 添加基础报告页脚
 * @param {jsPDF} pdf - PDF实例
 */
function addBasicReportFooter(pdf) {
  const pageCount = pdf.internal.getNumberOfPages()

  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i)

    // 页码
    pdf.setFontSize(8)
    pdf.setTextColor(150, 150, 150)
    pdf.text(`${i} / ${pageCount}`, 105, 290, { align: 'center' })

    // 品牌信息
    pdf.text('Generated by WordShelf - Smart Text Expression Assistant', 105, 285, { align: 'center' })
  }
}

/**
 * 转换时间模式为英文
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
 * 转换星期为英文
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

/**
 * 添加英文文本章节
 * @param {jsPDF} pdf - PDF实例
 * @param {number} yPosition - Y坐标
 * @param {string} title - 标题
 * @param {string} content - 内容
 * @returns {number} - 新的Y坐标
 */
function addEnglishTextSection(pdf, yPosition, title, content) {
  // 检查是否需要新页面
  if (yPosition > 250) {
    pdf.addPage()
    yPosition = 20
  }

  // 小标题
  pdf.setFontSize(12)
  pdf.setTextColor(46, 125, 50)
  pdf.text(`• ${title}`, 20, yPosition)
  yPosition += 8

  // 内容
  pdf.setFontSize(10)
  pdf.setTextColor(60, 60, 60)
  const lines = pdf.splitTextToSize(content, 150)
  pdf.text(lines, 25, yPosition)
  yPosition += lines.length * 5 + 5

  return yPosition
}

/**
 * 添加智能报告头部
 * @param {jsPDF} pdf - PDF实例
 * @param {number} yPosition - Y坐标
 * @param {Object} userProfile - 用户资料
 * @returns {number} - 新的Y坐标
 */
function addSmartReportHeader(pdf, yPosition, userProfile) {
  // Logo区域
  pdf.setFontSize(16)
  pdf.setTextColor(46, 125, 50) // WordShelf绿色
  pdf.text('WordShelf', 20, yPosition)

  yPosition += 25

  // 主标题
  pdf.setFontSize(24)
  pdf.setTextColor(46, 125, 50) // WordShelf绿色
  pdf.text('Smart Analysis Report', 105, yPosition, { align: 'center' })

  yPosition += 15

  // 副标题
  pdf.setFontSize(12)
  pdf.setTextColor(100, 100, 100)
  const currentDate = new Date().toLocaleDateString('en-US')
  pdf.text(`Generated on: ${currentDate}`, 105, yPosition, { align: 'center' })

  yPosition += 20

  // 分隔线
  pdf.setDrawColor(200, 200, 200)
  pdf.line(20, yPosition, 190, yPosition)

  return yPosition + 15
}

/**
 * 添加AI洞察分析部分
 * @param {jsPDF} pdf - PDF实例
 * @param {number} yPosition - Y坐标
 * @param {Object} aiInsights - AI分析结果
 * @returns {Promise<number>} - 新的Y坐标
 */
async function addAIInsightsSection(pdf, yPosition, aiInsights) {
  // 章节标题
  pdf.setFontSize(16)
  pdf.setTextColor(0, 0, 0)
  pdf.text('AI Smart Insights', 20, yPosition)
  yPosition += 10

  // 成就等级徽章
  yPosition = addAchievementBadge(pdf, yPosition, aiInsights.achievementLevel)

  // 个性分析
  yPosition = addEnglishTextSection(pdf, yPosition, 'Personality Traits', aiInsights.personalityInsights)

  // 使用习惯
  yPosition = addEnglishTextSection(pdf, yPosition, 'Usage Habits', aiInsights.usageHabits)

  // 发现的优势
  yPosition = addEnglishTextSection(pdf, yPosition, 'Discovered Strengths', aiInsights.strengths)

  // 个性化建议
  yPosition = addEnglishListSection(pdf, yPosition, 'Personalized Recommendations', aiInsights.recommendations)

  // 有趣发现
  if (aiInsights.interestingPatterns && aiInsights.interestingPatterns.length > 0) {
    yPosition = addEnglishListSection(pdf, yPosition, 'Interesting Patterns', aiInsights.interestingPatterns)
  }

  return yPosition + 10
}

/**
 * 添加成就等级徽章
 * @param {jsPDF} pdf - PDF实例
 * @param {number} yPosition - Y坐标
 * @param {string} level - 等级
 * @returns {number} - 新的Y坐标
 */
function addAchievementBadge(pdf, yPosition, level) {
  const badgeColors = {
    'beginner': [76, 175, 80],
    'intermediate': [33, 150, 243],
    'advanced': [255, 152, 0],
    'expert': [156, 39, 176]
  }

  const color = badgeColors[level] || [76, 175, 80]

  // 绘制徽章背景
  pdf.setFillColor(...color)
  pdf.roundedRect(20, yPosition - 5, 50, 12, 3, 3, 'F')

  // 徽章文字
  pdf.setFontSize(10)
  pdf.setTextColor(255, 255, 255)
  pdf.text(`${level.toUpperCase()} USER`, 45, yPosition + 2, { align: 'center' })

  // 重置颜色
  pdf.setTextColor(0, 0, 0)

  return yPosition + 15
}

/**
 * 添加英文列表章节
 * @param {jsPDF} pdf - PDF实例
 * @param {number} yPosition - Y坐标
 * @param {string} title - 标题
 * @param {Array} items - 列表项
 * @returns {number} - 新的Y坐标
 */
function addEnglishListSection(pdf, yPosition, title, items) {
  // 检查是否需要新页面
  if (yPosition > 240) {
    pdf.addPage()
    yPosition = 20
  }

  // 小标题
  pdf.setFontSize(12)
  pdf.setTextColor(46, 125, 50)
  pdf.text(`• ${title}`, 20, yPosition)
  yPosition += 8

  // 列表项
  pdf.setFontSize(10)
  pdf.setTextColor(60, 60, 60)

  items.forEach((item, index) => {
    if (yPosition > 260) {
      pdf.addPage()
      yPosition = 20
    }

    const lines = pdf.splitTextToSize(`${index + 1}. ${item}`, 140)
    pdf.text(lines, 30, yPosition)
    yPosition += lines.length * 5 + 2
  })

  return yPosition + 5
}

/**
 * 添加文本章节
 * @param {jsPDF} pdf - PDF实例
 * @param {number} yPosition - Y坐标
 * @param {string} title - 标题
 * @param {string} content - 内容
 * @returns {number} - 新的Y坐标
 */
function addTextSection(pdf, yPosition, title, content) {
  // 检查是否需要新页面
  if (yPosition > 250) {
    pdf.addPage()
    yPosition = 20
  }

  // 小标题
  pdf.setFontSize(12)
  pdf.setTextColor(46, 125, 50)
  pdf.text(`● ${title}`, 20, yPosition)
  yPosition += 8

  // 内容
  pdf.setFontSize(10)
  pdf.setTextColor(60, 60, 60)
  const lines = pdf.splitTextToSize(content, 150)
  pdf.text(lines, 25, yPosition)
  yPosition += lines.length * 5 + 5

  return yPosition
}

/**
 * 添加列表章节
 * @param {jsPDF} pdf - PDF实例
 * @param {number} yPosition - Y坐标
 * @param {string} title - 标题
 * @param {Array} items - 列表项
 * @returns {number} - 新的Y坐标
 */
function addListSection(pdf, yPosition, title, items) {
  // 检查是否需要新页面
  if (yPosition > 240) {
    pdf.addPage()
    yPosition = 20
  }

  // 小标题
  pdf.setFontSize(12)
  pdf.setTextColor(46, 125, 50)
  pdf.text(`● ${title}`, 20, yPosition)
  yPosition += 8

  // 列表项
  pdf.setFontSize(10)
  pdf.setTextColor(60, 60, 60)

  items.forEach((item, index) => {
    if (yPosition > 260) {
      pdf.addPage()
      yPosition = 20
    }

    const lines = pdf.splitTextToSize(`${index + 1}. ${item}`, 140)
    pdf.text(lines, 30, yPosition)
    yPosition += lines.length * 5 + 2
  })

  return yPosition + 5
}

/**
 * 添加图表部分
 * @param {jsPDF} pdf - PDF实例
 * @param {number} yPosition - Y坐标
 * @param {Object} processedData - 数据
 * @returns {Promise<number>} - 新的Y坐标
 */
async function addChartsSection(pdf, yPosition, processedData) {
  // 新页面用于图表
  pdf.addPage()
  yPosition = 20

  // 章节标题
  pdf.setFontSize(16)
  pdf.setTextColor(0, 0, 0)
  pdf.text('Data Visualization', 20, yPosition)
  yPosition += 15

  // 风格使用分布饼图
  if (processedData.styleAnalysis.styleDistribution) {
    const chartCanvas = await createStyleDistributionChart(processedData.styleAnalysis.styleDistribution)
    if (chartCanvas) {
      const chartImage = chartCanvas.toDataURL('image/png')
      pdf.addImage(chartImage, 'PNG', 20, yPosition, 80, 60)

      // 图表标题
      pdf.setFontSize(10)
      pdf.text('Style Usage Distribution', 60, yPosition + 65, { align: 'center' })
    }
  }

  // 时间使用模式条形图
  if (processedData.timePatterns.hourlyDistribution) {
    const timeChartCanvas = await createHourlyUsageChart(processedData.timePatterns.hourlyDistribution)
    if (timeChartCanvas) {
      const timeChartImage = timeChartCanvas.toDataURL('image/png')
      pdf.addImage(timeChartImage, 'PNG', 110, yPosition, 80, 60)

      // 图表标题
      pdf.setFontSize(10)
      pdf.text('Hourly Usage Distribution', 150, yPosition + 65, { align: 'center' })
    }
  }

  return yPosition + 80
}

/**
 * 创建风格分布饼图
 * @param {Object} styleDistribution - 风格分布数据
 * @returns {Promise<HTMLCanvasElement>} - Canvas元素
 */
async function createStyleDistributionChart(styleDistribution) {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 300
    const ctx = canvas.getContext('2d')

    const data = Object.entries(styleDistribution).map(([style, count]) => ({
      label: style,
      value: count
    }))

    if (data.length === 0) return null

    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          data: data.map(d => d.value),
          backgroundColor: [
            '#4CAF50', '#2196F3', '#FF9800', '#9C27B0',
            '#F44336', '#607D8B', '#795548', '#009688'
          ]
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { font: { size: 12 } }
          }
        }
      }
    })

    // 等待图表渲染
    await new Promise(resolve => setTimeout(resolve, 500))

    return canvas
  } catch (error) {
    console.error('创建风格分布图失败:', error)
    return null
  }
}

/**
 * 创建时间使用分布条形图
 * @param {Object} hourlyDistribution - 小时分布数据
 * @returns {Promise<HTMLCanvasElement>} - Canvas元素
 */
async function createHourlyUsageChart(hourlyDistribution) {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 300
    const ctx = canvas.getContext('2d')

    const hours = Array.from({ length: 24 }, (_, i) => i)
    const data = hours.map(hour => hourlyDistribution[hour] || 0)

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: hours.map(h => `${h}:00`),
        datasets: [{
          label: '使用次数',
          data: data,
          backgroundColor: '#4CAF50',
          borderColor: '#2E7D32',
          borderWidth: 1
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            ticks: { font: { size: 8 } }
          },
          y: {
            beginAtZero: true,
            ticks: { font: { size: 10 } }
          }
        }
      }
    })

    // 等待图表渲染
    await new Promise(resolve => setTimeout(resolve, 500))

    return canvas
  } catch (error) {
    console.error('创建时间分布图失败:', error)
    return null
  }
}

/**
 * 添加统计信息部分
 * @param {jsPDF} pdf - PDF实例
 * @param {number} yPosition - Y坐标
 * @param {Object} processedData - 数据
 * @returns {number} - 新的Y坐标
 */
function addStatisticsSection(pdf, yPosition, processedData) {
  const { basicStats, styleAnalysis, languageAnalysis } = processedData

  // 新页面
  pdf.addPage()
  yPosition = 20

  // 章节标题
  pdf.setFontSize(16)
  pdf.setTextColor(0, 0, 0)
  pdf.text('Detailed Statistics', 20, yPosition)
  yPosition += 15

  // 基础统计
  const stats = [
    ['总转换次数', basicStats.totalTransformations],
    ['收藏数量', basicStats.favoritesCount],
    ['收藏率', `${basicStats.favoriteRate}%`],
    ['活跃天数', `${basicStats.activeDays}天`],
    ['平均每日使用', `${basicStats.averagePerDay}次`],
    ['平均文本长度', `${basicStats.averageTextLength}字符`],
    ['使用的风格数量', styleAnalysis.uniqueStylesUsed],
    ['主要输入语言', languageAnalysis.primaryInputLanguage],
    ['主要输出语言', languageAnalysis.primaryOutputLanguage]
  ]

  // 创建统计表格
  yPosition = addStatsTable(pdf, yPosition, stats)

  return yPosition
}

/**
 * 添加统计表格
 * @param {jsPDF} pdf - PDF实例
 * @param {number} yPosition - Y坐标
 * @param {Array} stats - 统计数据
 * @returns {number} - 新的Y坐标
 */
function addStatsTable(pdf, yPosition, stats) {
  const tableWidth = 150
  const rowHeight = 8
  const leftMargin = 20

  pdf.setFontSize(10)

  stats.forEach((stat, index) => {
    const y = yPosition + index * rowHeight

    // 背景条纹
    if (index % 2 === 0) {
      pdf.setFillColor(248, 248, 248)
      pdf.rect(leftMargin, y - 3, tableWidth, rowHeight, 'F')
    }

    // 统计项名称
    pdf.setTextColor(60, 60, 60)
    pdf.text(stat[0], leftMargin + 5, y + 2)

    // 统计值
    pdf.setTextColor(0, 0, 0)
    pdf.text(String(stat[1]), leftMargin + tableWidth - 5, y + 2, { align: 'right' })
  })

  return yPosition + stats.length * rowHeight + 10
}

/**
 * 添加趋势部分
 * @param {jsPDF} pdf - PDF实例
 * @param {number} yPosition - Y坐标
 * @param {Object} processedData - 数据
 * @returns {number} - 新的Y坐标
 */
function addTrendsSection(pdf, yPosition, processedData) {
  const { timePatterns, topTransformations } = processedData

  // 使用模式分析
  yPosition = addEnglishTextSection(pdf, yPosition, 'Time Preference',
    `You are a ${getEnglishTimePattern(timePatterns.peakUsagePattern)} user, most active on ${getEnglishDayName(timePatterns.mostActiveDay)} at ${timePatterns.mostActiveHour}:00.`)

  // Top转换展示
  if (topTransformations.length > 0) {
    yPosition = addTopTransformationsSection(pdf, yPosition, topTransformations.slice(0, 5))
  }

  return yPosition
}

/**
 * 添加智能报告页脚
 * @param {jsPDF} pdf - PDF实例
 */
function addSmartReportFooter(pdf) {
  const pageCount = pdf.internal.getNumberOfPages()

  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i)

    // 页码
    pdf.setFontSize(8)
    pdf.setTextColor(150, 150, 150)
    pdf.text(`${i} / ${pageCount}`, 105, 290, { align: 'center' })

    // 品牌信息
    pdf.text('Generated by WordShelf - AI Smart Text Expression Assistant', 105, 285, { align: 'center' })
  }
}

/**
 * 添加热门转换部分
 * @param {jsPDF} pdf - PDF实例
 * @param {number} yPosition - Y坐标
 * @param {Array} topTransformations - 热门转换
 * @returns {number} - 新的Y坐标
 */
function addTopTransformationsSection(pdf, yPosition, topTransformations) {
  // 检查是否需要新页面
  if (yPosition > 200) {
    pdf.addPage()
    yPosition = 20
  }

  // 小标题
  pdf.setFontSize(12)
  pdf.setTextColor(46, 125, 50)
  pdf.text('● Top Transformations', 20, yPosition)
  yPosition += 10

  pdf.setFontSize(9)

  topTransformations.forEach((transformation, index) => {
    if (yPosition > 260) {
      pdf.addPage()
      yPosition = 20
    }

    // 排名
    pdf.setTextColor(46, 125, 50)
    pdf.text(`${index + 1}.`, 25, yPosition)

    // 原文（截取）
    pdf.setTextColor(80, 80, 80)
    const originalText = transformation.original.length > 50
      ? transformation.original.substring(0, 50) + '...'
      : transformation.original
    pdf.text(`Original: ${originalText}`, 30, yPosition)
    yPosition += 4

    // 转换结果（截取）
    const disguisedText = transformation.disguised.length > 50
      ? transformation.disguised.substring(0, 50) + '...'
      : transformation.disguised
    pdf.text(`Result: ${disguisedText}`, 30, yPosition)
    yPosition += 4

    // 统计信息
    pdf.setTextColor(120, 120, 120)
    pdf.text(`Used ${transformation.usageCount} times ${transformation.isFavorited ? '★' : ''}`, 30, yPosition)
    yPosition += 8
  })

  return yPosition
}

/**
 * 添加报告页脚
 * @param {jsPDF} pdf - PDF实例
 */
function addReportFooter(pdf) {
  const pageCount = pdf.internal.getNumberOfPages()

  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i)

    // 页码
    pdf.setFontSize(8)
    pdf.setTextColor(150, 150, 150)
    pdf.text(`${i} / ${pageCount}`, 105, 290, { align: 'center' })

    // 品牌信息
    pdf.text('Generated by WordShelf - 智能文本表达助手', 105, 285, { align: 'center' })
  }
}

/**
 * 生成收藏集合HTML
 * @param {Array} favoriteRecords - 收藏记录
 * @param {Object} userProfile - 用户资料
 * @returns {string} - HTML内容
 */
export function generateFavoriteHTML(favoriteRecords, userProfile) {
  const currentDate = new Date().toLocaleDateString('en-US')

  // Pre-process records to include display names
  const processedRecords = favoriteRecords.map(record => ({
    ...record,
    styleDisplayName: getStyleDisplayName(record.style)
  }))

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WordShelf Favorite Collection</title>
    <style>
        body {
            font-family: 'Poppins', Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: #f8f9fa;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #2E7D32;
            margin: 0;
            font-size: 2.5em;
        }
        .header p {
            color: #666;
            margin: 10px 0 0 0;
        }
        .favorite-item {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            background: #fafafa;
        }
        .favorite-item:hover {
            box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
        }
        .original-text {
            background: #fff;
            padding: 15px;
            border-left: 4px solid #2196F3;
            margin-bottom: 15px;
            border-radius: 4px;
        }
        .disguised-text {
            background: #fff;
            padding: 15px;
            border-left: 4px solid #4CAF50;
            margin-bottom: 15px;
            border-radius: 4px;
        }
        .meta-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.9em;
            color: #666;
            margin-top: 10px;
        }
        .tags {
            display: flex;
            gap: 5px;
        }
        .tag {
            background: #E8F5E8;
            color: #2E7D32;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
        }
        .stats {
            background: #E3F2FD;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 30px;
            text-align: center;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
                
                <h1 style="margin: 0; color: #2E7D32;">My Favorite Collection</h1>
            </div>
            <p>Export Date: ${currentDate} | Total Favorites: ${processedRecords.length}</p>
        </div>

        <div class="stats">
            <h3>Collection Statistics</h3>
            <p>You have favorited <strong>${processedRecords.length}</strong> excellent transformations, showing great content curation taste!</p>
        </div>

        ${processedRecords.map((record, index) => `
        <div class="favorite-item">
            <h3>Favorite #${index + 1}</h3>

            <div class="original-text">
                <strong>Original:</strong><br>
                ${record.original}
            </div>

            <div class="disguised-text">
                <strong>Transformed:</strong><br>
                ${record.disguised}
            </div>

            ${record.notes ? `
            <div style="background: #FFF3E0; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
                <strong>Notes:</strong> ${record.notes}
            </div>
            ` : ''}

            <div class="meta-info">
                <div>
                    <span>Created: ${new Date(record.createdAt).toLocaleDateString('en-US')}</span>
                    ${record.styleDisplayName ? ` | Style: ${record.styleDisplayName}` : ''}
                    ${record.purpose ? ` | Purpose: ${record.purpose}` : ''}
                    ${record.usageCount > 1 ? ` | Used ${record.usageCount} times` : ''}
                </div>

                <div class="tags">
                    ${record.tags ? record.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
                </div>
            </div>
        </div>
        `).join('')}

        <div class="footer">
            <p>Generated by <strong>WordShelf</strong> - Smart Text Expression Assistant</p>
            <p>Thank you for using WordShelf, continue creating amazing expressions!</p>
        </div>
    </div>
</body>
</html>
  `.trim()
}

/**
 * 下载文件
 * @param {Blob} blob - 文件Blob
 * @param {string} filename - 文件名
 */

export function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const fileGenerationService = {
  generateBasicStatsReport,
  generateSmartAnalysisReport,
  generateFavoriteHTML,
  downloadFile
}