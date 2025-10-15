// 风格选择器组件 - 点击悬浮球时弹出，快速切换风格

import { getAllStyles, getSelectedStyle } from '../utils/storage.js'
import styleSelectorCSS from '../styles/styleSelector.css?inline'

/**
 * 创建风格选择器面板
 * @param {Function} onSelect - 选择风格后的回调函数
 */
export function createStyleSelector(onSelect) {
  const panel = document.createElement('div')
  panel.className = 'style-selector-panel'

  // 注入样式
  const style = document.createElement('style')
  style.textContent = styleSelectorCSS
  panel.appendChild(style)

  // 创建面板内容
  const content = document.createElement('div')

  // 头部
  const header = document.createElement('div')
  header.className = 'selector-header'

  const title = document.createElement('h3')
  title.className = 'selector-title'
  title.textContent = 'Select Style'
  header.appendChild(title)
  content.appendChild(header)

  // 搜索框
  const searchBox = document.createElement('div')
  searchBox.className = 'search-box'

  const searchInput = document.createElement('input')
  searchInput.className = 'search-input'
  searchInput.type = 'text'
  searchInput.placeholder = 'Search styles...'
  searchBox.appendChild(searchInput)
  content.appendChild(searchBox)

  // 风格列表
  const styleList = document.createElement('div')
  styleList.className = 'style-list'
  content.appendChild(styleList)

  panel.appendChild(content)

  // 加载并渲染风格列表
  loadAndRenderStyles(styleList, searchInput, onSelect)

  // 搜索功能
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase()
    filterStyles(styleList, searchTerm)
  })

  // 点击面板外部关闭
  setTimeout(() => {
    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target)) {
        panel.remove()
      }
    }, { once: true })
  }, 100)

  return panel
}

/**
 * 加载并渲染风格列表
 */
async function loadAndRenderStyles(container, searchInput, onSelect) {
  const styles = await getAllStyles()
  const currentStyle = await getSelectedStyle()

  if (styles.length === 0) {
    container.innerHTML = '<div class="empty-state">No styles available</div>'
    return
  }

  // 渲染每个风格项
  styles.forEach(style => {
    const item = createStyleItem(style, currentStyle, onSelect)
    container.appendChild(item)
  })
}

/**
 * 创建单个风格项
 */
function createStyleItem(style, currentStyle, onSelect) {
  const item = document.createElement('div')
  item.className = 'style-item'
  item.dataset.styleId = style.id
  item.dataset.styleName = (style.displayName || style.name).toLowerCase()
  item.dataset.styleDesc = (style.description || '').toLowerCase()

  // 如果是当前选中的风格，添加 selected 类
  if (currentStyle && currentStyle.id === style.id) {
    item.classList.add('selected')
  }

  const name = document.createElement('div')
  name.className = 'style-name'
  name.textContent = style.displayName || style.name

  const description = document.createElement('p')
  description.className = 'style-description'
  description.textContent = style.description || ''

  item.appendChild(name)
  item.appendChild(description)

  // 点击选择风格
  item.addEventListener('click', () => {
    onSelect(style)
  })

  return item
}

/**
 * 过滤风格列表
 */
function filterStyles(container, searchTerm) {
  const items = container.querySelectorAll('.style-item')

  let visibleCount = 0

  items.forEach(item => {
    const name = item.dataset.styleName
    const desc = item.dataset.styleDesc

    if (name.includes(searchTerm) || desc.includes(searchTerm)) {
      item.style.display = 'block'
      visibleCount++
    } else {
      item.style.display = 'none'
    }
  })

  // 如果没有匹配结果，显示提示
  const emptyState = container.querySelector('.empty-state')
  if (visibleCount === 0 && !emptyState) {
    const empty = document.createElement('div')
    empty.className = 'empty-state'
    empty.textContent = 'No styles match your search'
    container.appendChild(empty)
  } else if (visibleCount > 0 && emptyState) {
    emptyState.remove()
  }
}
