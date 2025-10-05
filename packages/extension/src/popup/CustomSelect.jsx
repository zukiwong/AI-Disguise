// 自定义下拉选择组件（插件简化版）
import { useState, useRef, useEffect } from 'react'

function CustomSelect({
  options = [],
  value = '',
  onChange,
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef(null)

  // 找到当前选中的选项
  const selectedOption = options.find(option => option.value === value)

  // 点击外部关闭下拉框
  useEffect(() => {
    function handleClickOutside(event) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 处理下拉框点击
  const handleToggle = () => {
    if (disabled) return
    setIsOpen(!isOpen)
  }

  // 处理选项点击
  const handleOptionClick = (option) => {
    if (onChange) {
      onChange(option.value)
    }
    setIsOpen(false)
  }

  return (
    <div
      ref={selectRef}
      className={`custom-select ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
    >
      {/* 选择框头部 */}
      <div
        className="select-header"
        onClick={handleToggle}
      >
        <span className="select-text">
          {selectedOption ? selectedOption.label : 'Select...'}
        </span>
        <div className={`select-arrow ${isOpen ? 'rotated' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.69043 11.5409C8.49492 11.7364 8.22969 11.9169 7.97949 11.8622C7.72793 11.9046 7.49141 11.7091 7.2959 11.5409L1.25703 5.47471C0.950781 5.16846 0.950781 4.66533 1.25703 4.35908C1.56328 4.05283 2.06641 4.05283 2.37266 4.35908L7.99316 10.1327L13.6273 4.35908C13.9336 4.05283 14.4367 4.05283 14.743 4.35908C15.0492 4.66533 15.0492 5.16846 14.743 5.47471L8.69043 11.5409Z" fill="currentColor"/>
          </svg>
        </div>
      </div>

      {/* 下拉选项列表 */}
      {isOpen && (
        <div className="select-dropdown">
          {options.map((option) => (
            <div
              key={option.value}
              className={`select-option ${option.value === value ? 'selected' : ''}`}
              onClick={() => handleOptionClick(option)}
            >
              <div className="option-content">
                <div className="option-label">{option.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CustomSelect
