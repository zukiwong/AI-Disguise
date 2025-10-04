import { useRef, useEffect, useCallback } from 'react'

/**
 * 生成可分享的卡片图片
 * @param {Object} props - 组件属性
 * @param {Object} props.post - 帖子数据
 * @param {Function} props.onGenerated - 生成完成回调
 */
const ShareCardGenerator = ({ post, onGenerated }) => {
  const canvasRef = useRef(null)
  const hasGeneratedRef = useRef(false)

  useEffect(() => {
    if (!post || !canvasRef.current || hasGeneratedRef.current) return

    const generateCard = async () => {
      hasGeneratedRef.current = true
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      // 设置画布尺寸
      canvas.width = 1158  // 386 * 3 (3倍分辨率以保证清晰度)
      canvas.height = 1200 // 400 * 3

      // 白色背景（带圆角）
      const cornerRadius = 30
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.roundRect(0, 0, canvas.width, canvas.height, cornerRadius)
      ctx.fill()

      // 设置裁剪区域为圆角矩形
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(0, 0, canvas.width, canvas.height, cornerRadius)
      ctx.clip()

      // 顶部绿色条
      ctx.fillStyle = '#4CAF50'
      ctx.fillRect(0, 0, canvas.width, 24)

      // 标题 "AI Disguise"
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 108px Poppins, sans-serif'
      ctx.fillText('AI Disguise', 80, 180)

      // 风格标签（圆角黑色背景）
      const styleName = post.styleName || 'Custom'
      ctx.font = '500 48px Poppins, sans-serif'
      const styleTextWidth = ctx.measureText(styleName).width

      // 绘制圆角矩形背景（增加右侧空间）
      const badgeX = 80
      const badgeY = 235
      const badgeWidth = styleTextWidth + 120  // 从 80 增加到 120
      const badgeHeight = 72
      const badgeRadius = 36

      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, badgeRadius)
      ctx.fill()

      // 绿色圆点
      ctx.fillStyle = '#4CAF50'
      ctx.beginPath()
      ctx.arc(badgeX + 40, badgeY + 36, 12, 0, Math.PI * 2)
      ctx.fill()

      // 风格名称（白色文字）
      ctx.fillStyle = '#ffffff'
      ctx.font = '500 48px Poppins, sans-serif'
      ctx.fillText(styleName, badgeX + 70, badgeY + 52)

      // ORIGINAL 标签
      ctx.fillStyle = '#999999'
      ctx.font = '400 36px Poppins, sans-serif'
      ctx.fillText('ORIGINAL', 80, 420)

      // 原始文本
      ctx.fillStyle = '#000000'
      ctx.font = '400 42px Poppins, sans-serif'
      wrapText(ctx, post.originalText || '', 80, 480, canvas.width - 160, 60, 2)

      // 分隔线
      ctx.strokeStyle = '#e0e0e0'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(80, 640)
      ctx.lineTo(canvas.width - 80, 640)
      ctx.stroke()

      // TRANSFORMED 标签
      ctx.fillStyle = '#999999'
      ctx.font = '400 36px Poppins, sans-serif'
      ctx.fillText('TRANSFORMED', 80, 710)

      // 转换后文本
      ctx.fillStyle = '#000000'
      ctx.font = '600 42px Poppins, sans-serif'
      wrapText(ctx, post.transformedText || '', 80, 770, canvas.width - 160, 60, 2)

      // 底部信息
      const bottomY = canvas.height - 80

      // 作者信息
      ctx.fillStyle = '#666666'
      ctx.font = '400 42px Poppins, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`By ${post.authorName || 'Anonymous'}`, 80, bottomY)

      // 右下角渐变圆（在文字之前绘制，作为背景）
      const gradientCircleX = canvas.width - 200
      const gradientCircleY = canvas.height - 200
      const gradientCircleRadius = 800

      const circleGradient = ctx.createRadialGradient(
        gradientCircleX, gradientCircleY, 0,
        gradientCircleX, gradientCircleY, gradientCircleRadius
      )
      circleGradient.addColorStop(0, 'rgba(5, 223, 114, 0.15)')  // 绿色，15% 不透明度
      circleGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')   // 透明

      ctx.fillStyle = circleGradient
      ctx.beginPath()
      ctx.arc(gradientCircleX, gradientCircleY, gradientCircleRadius, 0, Math.PI * 2)
      ctx.fill()

      // 网站链接（右对齐，带下划线）
      const websiteText = 'ai-disguiser.vercel.app'
      ctx.fillStyle = '#000000'
      ctx.font = '600 42px Poppins, sans-serif'
      ctx.textAlign = 'right'
      const websiteX = canvas.width - 80
      ctx.fillText(websiteText, websiteX, bottomY)

      // 绘制下划线
      const websiteTextWidth = ctx.measureText(websiteText).width
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(websiteX - websiteTextWidth, bottomY + 8)
      ctx.lineTo(websiteX, bottomY + 8)
      ctx.stroke()

      // 恢复裁剪区域
      ctx.restore()

      // 生成图片并触发回调
      canvas.toBlob((blob) => {
        if (blob && onGenerated) {
          onGenerated(blob)
        }
      }, 'image/png')
    }

    generateCard()
  }, [post])

  /**
   * 文本换行辅助函数
   */
  const wrapText = (context, text, x, y, maxWidth, lineHeight, maxLines = 2) => {
    const words = text.split('')
    let line = ''
    let currentY = y
    let lineCount = 0

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n]
      const metrics = context.measureText(testLine)
      const testWidth = metrics.width

      if (testWidth > maxWidth && n > 0) {
        context.fillText(line, x, currentY)
        line = words[n]
        currentY += lineHeight
        lineCount++

        // 限制最大行数
        if (lineCount >= maxLines) {
          context.fillText(line + '...', x, currentY)
          break
        }
      } else {
        line = testLine
      }
    }
    if (lineCount < maxLines) {
      context.fillText(line, x, currentY)
    }
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'none' }}
      aria-hidden="true"
    />
  )
}

export default ShareCardGenerator
