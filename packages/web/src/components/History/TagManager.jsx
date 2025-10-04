// 标签管理组件
// 用于添加、编辑和删除历史记录的标签

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { 
  updateHistoryRecord, 
  getUserTags, 
  addUserTag 
} from '../../services/historyService.js'

const TagManager = forwardRef(({ recordId, currentTags = [], userTags = [], onTagsUpdate }, ref) => {
  const { userId } = useAuth()
  
  // 状态管理
  const [tags, setTags] = useState(currentTags)
  const [newTagInput, setNewTagInput] = useState('')
  const [suggestedTags, setSuggestedTags] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 预定义的推荐标签
  const recommendedTags = [
    '请假', '高情商', '微信发', '邮件', '工作', '生活',
    'PPT', '报告', '通知', '道歉', '感谢', '邀请',
    '拒绝', '商务', '客服', '朋友', '家人', '领导'
  ]

  // 更新建议标签
  useEffect(() => {
    // 合并用户标签和推荐标签，去重
    const allSuggestions = [...new Set([...userTags, ...recommendedTags])]
    // 排除已经选中的标签
    const filteredSuggestions = allSuggestions.filter(tag => !tags.includes(tag))
    setSuggestedTags(filteredSuggestions)
  }, [userTags, tags])

  // 添加标签
  const addTag = async (tag) => {
    if (!tag.trim() || tags.includes(tag.trim())) {
      return
    }

    const newTag = tag.trim()
    const updatedTags = [...tags, newTag]
    setTags(updatedTags)
    
    // 更新建议标签列表
    setSuggestedTags(prev => prev.filter(t => t !== newTag))
    
    // 保存到用户标签库
    if (userId) {
      try {
        await addUserTag(userId, newTag)
      } catch (error) {
        console.error('保存标签到标签库失败:', error)
      }
    }
  }

  // 删除标签
  const removeTag = (tagToRemove) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove)
    setTags(updatedTags)
    
    // 重新添加到建议列表
    if (recommendedTags.includes(tagToRemove) || suggestedTags.length < 20) {
      setSuggestedTags(prev => [...prev, tagToRemove].sort())
    }
  }

  // 处理新标签输入
  const handleNewTagSubmit = (e) => {
    e.preventDefault()
    if (newTagInput.trim()) {
      addTag(newTagInput.trim())
      setNewTagInput('')
    }
  }

  // 处理输入框按键
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleNewTagSubmit(e)
    } else if (e.key === 'Escape') {
      setNewTagInput('')
    }
  }

  // 保存标签到历史记录
  const saveTagsToRecord = async () => {
    if (!userId || !recordId) return

    setIsSaving(true)
    try {
      await updateHistoryRecord(userId, recordId, { tags })
      onTagsUpdate(tags)
    } catch (error) {
      console.error('保存标签失败:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // 检查标签是否有变化
  const hasChanges = JSON.stringify(tags.sort()) !== JSON.stringify(currentTags.sort())
  
  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    saveIfHasChanges: async () => {
      if (hasChanges) {
        await saveTagsToRecord()
      }
    }
  }), [hasChanges, tags, userId, recordId])

  return (
    <div className="tag-manager">
      {/* 当前标签 */}
      <div className="current-tags-section">
        <div className="tags-list">
          {tags.map((tag, index) => (
            <div key={index} className="tag-item editable">
              <span className="tag-text">{tag}</span>
              <button
                className="tag-remove-button"
                onClick={() => removeTag(tag)}
                title="Remove tag"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 添加新标签 */}
      <div className="add-tag-section">
        <form onSubmit={handleNewTagSubmit} className="new-tag-form">
          <input
            type="text"
            className="new-tag-input"
            placeholder="Add a new tag..."
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            maxLength={20}
          />
          <button
            type="submit"
            className="add-tag-button"
            disabled={!newTagInput.trim() || tags.includes(newTagInput.trim())}
          >
            Add
          </button>
        </form>
      </div>

      {/* 推荐标签 */}
      {suggestedTags.length > 0 && (
        <div className="suggested-tags-section">
          <h5 className="suggested-tags-title">Suggested Tags:</h5>
          <div className="suggested-tags-list">
            {suggestedTags.slice(0, 12).map((tag, index) => (
              <button
                key={index}
                className="suggested-tag-button"
                onClick={() => addTag(tag)}
                disabled={isLoading}
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 保存按钮 */}
      {hasChanges && (
        <div className="save-tags-section">
          <button
            className="save-tags-button"
            onClick={saveTagsToRecord}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Tags'}
          </button>
        </div>
      )}

      {/* 标签统计 */}
      <div className="tag-stats">
        <span className="tag-count">
          {tags.length} tag{tags.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
})

TagManager.displayName = 'TagManager'

export default TagManager