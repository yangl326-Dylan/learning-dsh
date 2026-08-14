import { useEffect, useRef } from 'react'

interface DiagramLightboxProps {
  src: string
  alt: string
  caption: string
  onClose: () => void
}

/** Fullscreen overlay for a clicked diagram. Closes on Escape, backdrop
 *  click, or the close button; locks body scroll while open.
 */
export function DiagramLightbox({ src, alt, caption, onClose }: DiagramLightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={caption} onClick={onClose}>
      <figure className="lightbox-figure" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={alt} />
        <figcaption className="lightbox-caption">{caption}</figcaption>
      </figure>
      <button
        ref={closeRef}
        type="button"
        className="lightbox-close"
        aria-label="close"
        onClick={onClose}
      >
        ×
      </button>
    </div>
  )
}
