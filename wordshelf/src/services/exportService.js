// 主导出服务模块
// 统一管理所有数据导出功能

import { dataProcessingService } from './dataProcessingService.js'
import { aiAnalysisService } from './aiAnalysisService.js'
import { fileGenerationService } from './fileGenerationService.js'

/**
 * 导出个人报告（简单PDF格式）
 * @param {Array} historyRecords - 用户历史记录
 * @param {Object} userProfile - 用户资料
 * @param {Array} userTags - 用户标签
 * @param {Function} onProgress - 进度回调函数 (percentage) => void
 * @returns {Promise<void>} - 完成后自动下载文件
 */
export async function exportPersonalReport(historyRecords, userProfile, userTags, onProgress = () => {}) {
  try {
    onProgress(20)

    // 1. 处理基础统计数据
    const processedData = dataProcessingService.processUserData(historyRecords, userTags)
    onProgress(60)

    // 2. 生成简单统计PDF报告（不含AI分析）
    const pdfBlob = await fileGenerationService.generateBasicStatsReport(processedData, userProfile)
    onProgress(90)

    // 3. 下载文件
    const fileName = `WordShelf-Personal-Report-${new Date().toISOString().split('T')[0]}.pdf`
    fileGenerationService.downloadFile(pdfBlob, fileName)
    onProgress(100)

  } catch (error) {
    console.error('Export personal report failed:', error)
    throw new Error(`Export failed: ${error.message}`)
  }
}

/**
 * 导出智能数据包（包含AI分析的PDF格式）
 * @param {Array} historyRecords - 用户历史记录
 * @param {Object} userProfile - 用户资料
 * @param {Array} userTags - 用户标签
 * @param {Function} onProgress - 进度回调函数 (percentage) => void
 * @returns {Promise<void>} - 完成后自动下载文件
 */
export async function exportSmartDataPack(historyRecords, userProfile, userTags, onProgress = () => {}) {
  try {
    onProgress(10)

    // 1. 处理和分析数据
    const processedData = dataProcessingService.processUserData(historyRecords, userTags)
    onProgress(30)

    // 2. 获取AI智能分析
    const aiInsights = await aiAnalysisService.generateUserInsights(processedData, userProfile)
    onProgress(60)

    // 3. 生成智能分析PDF报告
    const pdfBlob = await fileGenerationService.generateSmartAnalysisReport(processedData, aiInsights, userProfile)
    onProgress(90)

    // 4. 下载文件
    const fileName = `WordShelf-Smart-Analysis-${new Date().toISOString().split('T')[0]}.pdf`
    fileGenerationService.downloadFile(pdfBlob, fileName)
    onProgress(100)

  } catch (error) {
    console.error('Export smart analysis failed:', error)
    throw new Error(`Export failed: ${error.message}`)
  }
}

/**
 * 导出个人收藏集合（HTML格式）
 * @param {Array} historyRecords - 用户历史记录
 * @param {Object} userProfile - 用户资料
 * @param {Function} onProgress - 进度回调函数
 * @returns {Promise<void>}
 */
export async function exportFavoriteCollection(historyRecords, userProfile, onProgress = () => {}) {
  try {
    onProgress(20)

    // 筛选收藏记录
    const favoriteRecords = historyRecords.filter(record => record.isFavorited)

    if (favoriteRecords.length === 0) {
      throw new Error('您还没有收藏任何内容')
    }

    onProgress(50)

    // 生成HTML文档
    const htmlContent = fileGenerationService.generateFavoriteHTML(favoriteRecords, userProfile)
    const htmlBlob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })

    onProgress(80)

    // 下载文件
    const fileName = `WordShelf收藏集合-${new Date().toISOString().split('T')[0]}.html`
    fileGenerationService.downloadFile(htmlBlob, fileName)
    onProgress(100)

  } catch (error) {
    console.error('导出收藏集合失败:', error)
    throw new Error(`导出失败: ${error.message}`)
  }
}

