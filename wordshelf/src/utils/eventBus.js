// 简单的事件总线，用于跨组件通信
// 主要用于同步样式状态更新

class EventBus {
  constructor() {
    this.events = {}
  }

  // 订阅事件
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)

    // 返回取消订阅的函数
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback)
    }
  }

  // 触发事件
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`EventBus error in ${event}:`, error)
        }
      })
    }
  }

  // 清除所有事件监听器
  clear() {
    this.events = {}
  }
}

// 创建全局实例
const eventBus = new EventBus()

// 预定义的事件类型
export const EVENTS = {
  STYLES_UPDATED: 'styles_updated',      // 样式列表更新
  STYLE_CREATED: 'style_created',        // 新样式创建
  STYLE_UPDATED: 'style_updated',        // 样式更新
  STYLE_DELETED: 'style_deleted',        // 样式删除
}

export default eventBus