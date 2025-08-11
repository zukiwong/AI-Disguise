// 语言选择器组件
// 使用自定义下拉框，独立的模块化组件，可以轻松启用或停用

import { LANGUAGE_FEATURE, LANGUAGE_CONFIG } from '../services/config.js'
import CustomSelect from './CustomSelect.jsx'

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

  // 转换为自定义下拉框需要的选项格式
  const options = Object.entries(LANGUAGE_CONFIG).map(([key, language]) => ({
    value: key,
    label: language.displayName,
    description: language.description
  }))

  // 处理语言选择变化
  const handleLanguageChange = (newLanguage) => {
    if (onLanguageChange) {
      onLanguageChange(newLanguage)
    }
  }

  return (
    <div className={`language-selector ${className}`}>
      <h3>Output Language:</h3>
      <CustomSelect
        options={options}
        value={selectedLanguage}
        onChange={handleLanguageChange}
        disabled={disabled}
        placeholder="Select output language..."
        className="language-custom-select"
      />
      
      {/* 语言说明文本 - 现在在下拉框内显示，这里可以移除或保留 */}
      {selectedLanguage !== 'auto' && LANGUAGE_CONFIG[selectedLanguage] && (
        <p className="language-description">
          {LANGUAGE_CONFIG[selectedLanguage].description}
        </p>
      )}
      
      {selectedLanguage === 'auto' && (
        <p className="language-description">
          Will automatically detect language based on input text and maintain consistent output language
        </p>
      )}
    </div>
  )
}

export default LanguageSelector