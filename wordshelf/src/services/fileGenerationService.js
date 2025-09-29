// 文件生成服务模块
// 负责生成各种格式的导出文件（PDF、HTML、JSON等）

import jsPDF from 'jspdf'
import { Chart, registerables } from 'chart.js'

// 注册Chart.js组件
Chart.register(...registerables)

/**
 * 获取样式显示名称
 * @param {string} styleId - 样式ID
 * @param {Array} availableStyles - 可选：当前可用的样式数组
 * @returns {string} - 显示名称
 */
function getStyleDisplayName(styleId, availableStyles = null) {
  if (!styleId) return 'Unknown Style'

  // 如果传入了样式数组，优先从中查找
  if (availableStyles && Array.isArray(availableStyles)) {
    const foundStyle = availableStyles.find(style => style && style.id === styleId)
    if (foundStyle && foundStyle.displayName) {
      return foundStyle.displayName
    }
  }

  // 尝试从localStorage缓存中获取
  try {
    // 尝试获取各种可能存储样式数据的localStorage key
    const possibleKeys = ['customStyles', 'styles', 'allStyles', 'userStyles']
    for (const key of possibleKeys) {
      const cachedData = localStorage.getItem(key)
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData)
          if (Array.isArray(parsed) && parsed.length > 0) {
            const foundStyle = parsed.find(style => style && style.id === styleId)
            if (foundStyle && foundStyle.displayName) {
              console.log(`找到样式: ${styleId} -> ${foundStyle.displayName}`)
              return foundStyle.displayName
            }
          }
        } catch (parseError) {
          console.warn(`解析${key}失败:`, parseError)
        }
      }
    }

    // 特殊情况：尝试从window.appState中获取（如果应用在全局存储了状态）
    if (typeof window !== 'undefined' && window.appState && window.appState.styles) {
      const foundStyle = window.appState.styles.find(style => style && style.id === styleId)
      if (foundStyle && foundStyle.displayName) {
        return foundStyle.displayName
      }
    }
  } catch (error) {
    console.warn('获取缓存样式数据失败:', error)
  }

  // 基础系统样式配置（从config.js同步）
  const SYSTEM_STYLES = {
    chat: 'Chat Style',
    poem: 'Poetic Style',
    social: 'Social Style',
    story: 'Story Style'
  }

  // 扩展样式映射（基于历史数据）
  const EXTENDED_STYLES = {
    // 基础系统样式
    ...SYSTEM_STYLES,

    // 常见用途样式
    formal: 'Formal Style',
    casual: 'Casual Style',
    professional: 'Professional Style',
    friendly: 'Friendly Style',
    academic: 'Academic Style',
    business: 'Business Style',

    // 情感表达样式
    excited: 'Excited Style',
    calm: 'Calm Style',
    confident: 'Confident Style',
    humble: 'Humble Style',
    encouraging: 'Encouraging Style',

    // 特殊场景样式
    interview: 'Interview Style',
    presentation: 'Presentation Style',
    email: 'Email Style',
    message: 'Message Style',
    report: 'Report Style',

    // 创意样式
    creative: 'Creative Style',
    artistic: 'Artistic Style',
    humorous: 'Humorous Style',
    witty: 'Witty Style',

    // 技术样式
    technical: 'Technical Style',
    explanatory: 'Explanatory Style',
    instructional: 'Instructional Style',

    // 社交样式
    diplomatic: 'Diplomatic Style',
    persuasive: 'Persuasive Style',
    supportive: 'Supportive Style',

    // 其他常见样式
    concise: 'Concise Style',
    detailed: 'Detailed Style',
    conversational: 'Conversational Style',
    neutral: 'Neutral Style'
  }

  // 检查是否在扩展映射中
  if (EXTENDED_STYLES[styleId]) {
    return EXTENDED_STYLES[styleId]
  }

  // 如果是长ID格式的自定义样式，返回更友好的格式
  if (styleId.length > 10 && /^[A-Za-z0-9]{10,}$/.test(styleId)) {
    return 'Custom Style'
  }

  // 最后的fallback
  return `Style: ${styleId}`
}

/**
 * 生成基础统计报告PDF
 * @param {Object} processedData - 处理后的数据
 * @param {Array} availableStyles - 可选：当前可用的样式数组
 * @returns {Promise<Blob>} - PDF文件Blob
 */
export async function generateBasicStatsReport(processedData, availableStyles = null) {
  const pdf = new jsPDF('p', 'mm', 'a4')

  // Set better font for consistency
  pdf.setFont('helvetica')

  let yPosition = 20

  // 1. 标题页
  yPosition = addBasicReportHeader(pdf, yPosition)

  // 2. 基础统计
  yPosition = addBasicStatisticsSection(pdf, yPosition, processedData)

  // 3. 使用趋势
  yPosition = addBasicTrendsSection(pdf, yPosition, processedData, availableStyles)

  // 4. 页脚
  addBasicReportFooter(pdf)

  return pdf.output('blob')
}


/**
 * 添加基础报告标题
 * @param {jsPDF} pdf - PDF实例
 * @param {number} yPosition - Y坐标
 * @returns {number} - 新的Y坐标
 */
function addBasicReportHeader(pdf, yPosition) {
  // 主标题 - 更大更醒目
  pdf.setFontSize(28)
  pdf.setTextColor(46, 125, 50) // 主题绿色
  pdf.text('Personal Report', 105, yPosition, { align: 'center' })

  yPosition += 5

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
 * @param {Array} availableStyles - 可选：当前可用的样式数组
 * @returns {number} - 新的Y坐标
 */
function addBasicTrendsSection(pdf, yPosition, processedData, availableStyles = null) {
  const { timePatterns, styleAnalysis } = processedData

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

  // 时间偏好
  yPosition = addEnglishTextSection(pdf, yPosition, 'Time Preference',
    `You are a ${getEnglishTimePattern(timePatterns.peakUsagePattern)} user, most active on ${getEnglishDayName(timePatterns.mostActiveDay)} at ${timePatterns.mostActiveHour}:00.`)

  // 最常用风格（改进版）
  const mostUsedStyle = styleAnalysis.mostUsedStyle
  const useCount = styleAnalysis.styleDistribution[mostUsedStyle]
  const totalUses = Object.values(styleAnalysis.styleDistribution).reduce((a, b) => a + b, 0)
  const percentage = Math.round((useCount / totalUses) * 100)

  yPosition = addEnglishTextSection(pdf, yPosition, 'Most Used Style',
    `"${getStyleDisplayName(mostUsedStyle, availableStyles)}" - used ${useCount} times (${percentage}% of all transformations).`)

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
 * 生成收藏集合HTML
 * @param {Array} favoriteRecords - 收藏记录
 * @param {Array} availableStyles - 可选：当前可用的样式数组
 * @returns {string} - HTML内容
 */
export function generateFavoriteHTML(favoriteRecords, availableStyles = null) {
  const currentDate = new Date().toLocaleDateString('en-US')

  // Pre-process records to include display names
  const processedRecords = favoriteRecords.map(record => ({
    ...record,
    styleDisplayName: getStyleDisplayName(record.style, availableStyles)
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
  generateFavoriteHTML,
  downloadFile
}