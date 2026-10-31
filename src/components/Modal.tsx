import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.focus()
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
      if (e.key === 'Tab') {
        const elements = ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), textarea, select, a[href], [tabindex="0"]',
        )
        if (!elements?.length) return
        const first = elements[0],
          last = elements[elements.length - 1]
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault()
          last.focus()
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', handler)
      previous?.focus()
    }
  }, [])
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        ref={ref}
      >
        <header>
          <h2 id="modal-title">{title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Cerrar ventana"
          >
            <X size={22} />
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}
