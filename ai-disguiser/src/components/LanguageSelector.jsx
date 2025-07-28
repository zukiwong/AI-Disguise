// 语言选择器组件
// 独立的模块化组件，可以轻松启用或停用

import { LANGUAGE_FEATURE, LANGUAGE_CONFIG } from '../services/config.js'

/**
 * 语言选择器组件
 * @param {Object} props - 组件属性
 * @param {string} props.selectedLanguage - 当前选择的语言
 * @param {Function} props.onLanguageChange - 语言改变时的回调函数
 * @param {boolean} props.disabled - 是否禁用选择器
 * @param {string} props.className - 额外的 CSS 类名
 * @returns {JSX.Element|null} - 语言选择器组件或 null（当功能停用时）
 */
function LanguageSelector({ 
  selectedLanguage = 'auto', 
  onLanguageChange, 
  disabled = false,
  className = ''
}) {
  // 如果多语言功能未启用，返回 null（不渲染任何内容）
  if (!LANGUAGE_FEATURE.ENABLED) {
    return null
  }

  // 处理语言选择变化
  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value
    if (onLanguageChange) {
      onLanguageChange(newLanguage)
    }
  }

  return (
    <div className={`language-selector ${className}`}>
      <h3>输出语言:</h3>
      <select 
        value={selectedLanguage}
        onChange={handleLanguageChange}
        disabled={disabled}
        className="language-select"
        title="选择转换结果的语言"
      >
        {Object.entries(LANGUAGE_CONFIG).map(([key, language]) => (
          <option key={key} value={key}>
            {language.displayName}
          </option>
        ))}
      </select>
      
      {/* 语言说明文本 */}
      {selectedLanguage !== 'auto' && LANGUAGE_CONFIG[selectedLanguage] && (
        <p className="language-description">
          {LANGUAGE_CONFIG[selectedLanguage].description}
        </p>
      )}
      
      {selectedLanguage === 'auto' && (
        <p className="language-description">
          将根据输入文本自动检测语言并保持一致的输出语言
        </p>
      )}
    </div>
  )
}

export default LanguageSelector