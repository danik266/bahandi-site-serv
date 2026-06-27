import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'

export function SuccessToast({
  message,
  onClose,
}: {
  message: string
  onClose: () => void
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300) // allow exit animation
    }, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`success-toast ${visible ? 'visible' : ''}`}>
      <CheckCircle2 size={18} />
      <span>{message}</span>
    </div>
  )
}
