// 自定义下拉选择组件
// 完全自定义的下拉框，不使用原生 select 元素

import { useState, useRef, useEffect } from 'react'
import './CustomSelect.css'

/**
 * 自定义下拉选择组件
 * @param {Object} props - 组件属性
 * @param {Array} props.options - 选项数组，格式: [{value: '', label: '', description: ''}]
 * @param {string} props.value - 当前选中的值
 * @param {Function} props.onChange - 值改变回调函数
 * @param {string} props.placeholder - 占位符文本
 * @param {boolean} props.disabled - 是否禁用
 * @param {string} props.className - 额外的CSS类名
 */
function CustomSelect({ 
  options = [], 
  value = '', 
  onChange, 
  placeholder = 'Select an option...',
  disabled = false,
  className = '' 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const selectRef = useRef(null)
  const listRef = useRef(null)

  // 找到当前选中的选项
  const selectedOption = options.find(option => option.value === value)
  
  // 点击外部关闭下拉框
  useEffect(() => {
    function handleClickOutside(event) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 键盘导航
  useEffect(() => {
    function handleKeyDown(event) {
      if (!isOpen) return

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setHighlightedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          event.preventDefault()
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : options.length - 1
          )
          break
        case 'Enter':
          event.preventDefault()
          if (highlightedIndex >= 0) {
            handleOptionClick(options[highlightedIndex])
          }
          break
        case 'Escape':
          setIsOpen(false)
          setHighlightedIndex(-1)
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, highlightedIndex, options])

  // 处理下拉框点击
  const handleToggle = () => {
    if (disabled) return
    setIsOpen(!isOpen)
    if (!isOpen) {
      setHighlightedIndex(-1)
    }
  }

  // 处理选项点击
  const handleOptionClick = (option) => {
    if (onChange) {
      onChange(option.value)
    }
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  // 处理鼠标悬浮
  const handleMouseEnter = (index) => {
    setHighlightedIndex(index)
  }

  return (
    <div 
      ref={selectRef}
      className={`custom-select ${className} ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
    >
      {/* 选择框头部 */}
      <div 
        className="select-header"
        onClick={handleToggle}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleToggle()
          }
        }}
      >
        <span className="select-text">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className={`select-arrow ${isOpen ? 'rotated' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.69043 11.5409C8.49492 11.7364 8.22969 11.9169 7.97949 11.8622C7.72793 11.9046 7.49141 11.7091 7.2959 11.5409L1.25703 5.47471C0.950781 5.16846 0.950781 4.66533 1.25703 4.35908C1.56328 4.05283 2.06641 4.05283 2.37266 4.35908L7.99316 10.1327L13.6273 4.35908C13.9336 4.05283 14.4367 4.05283 14.743 4.35908C15.0492 4.66533 15.0492 5.16846 14.743 5.47471L8.69043 11.5409Z" fill="currentColor"/>
          </svg>
        </div>
      </div>

      {/* 下拉选项列表 */}
      {isOpen && (
        <div className="select-dropdown" ref={listRef}>
          {options.map((option, index) => (
            <div
              key={option.value}
              className={`select-option ${
                index === highlightedIndex ? 'highlighted' : ''
              } ${option.value === value ? 'selected' : ''}`}
              onClick={() => handleOptionClick(option)}
              onMouseEnter={() => handleMouseEnter(index)}
            >
              <div className="option-content">
                <div className="option-label">{option.label}</div>
                {option.description && (
                  <div className="option-description">{option.description}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CustomSelect