// 自定义确认对话框组件
import '../../styles/ConfirmDialog.css'

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'default' // 'default', 'danger'
}) {
  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm()
    onCancel() // 关闭对话框
  }

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
        <div className="confirm-header">
          <h3 className="confirm-title">{title}</h3>
        </div>

        <div className="confirm-body">
          <p className="confirm-message">{message}</p>
        </div>

        <div className="confirm-footer">
          <button
            className="confirm-button secondary"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className={`confirm-button ${type === 'danger' ? 'danger' : 'primary'}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog