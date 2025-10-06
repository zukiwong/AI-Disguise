// Toast 提示组件
// 用于显示简单的操作反馈提示

import { useEffect } from 'react'
import './Toast.css'

function Toast({ message, onClose, duration = 2000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div className="toast">
      {message}
    </div>
  )
}

export default Toast
