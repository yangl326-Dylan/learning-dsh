import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getChapter } from '../data/loader'
import { useApp } from '../store'
import { useLocale } from '../i18n'
import { extractHeadings } from '../lib/slug'
import type { ChapterSummary } from '../data/types'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

/** Left navigation tree: chapters with their h2 sub-chapters.
 *  Only the active chapter's body is fetched (lazy); other chapters expand
 *  to a placeholder that resolves once navigated to.
 */
export function Sidebar({ open, onClose }: SidebarProps) {
  const { currentVersion } = useApp()
  const { locale, t } = useLocale()
  const location = useLocation()
  const navigate = useNavigate()

  const activeChapterId = useMemo(() => {
    const m = location.pathname.match(/^\/([^/]+)$/)
    return m ? m[1] : undefined
  }, [location.pathname])

  const [expanded, setExpanded] = useState<string | null>(activeChapterId ?? null)
  const [bodies, setBodies] = useState<Record<string, { en: string; zh: string }>>({})

  useEffect(() => {
    if (activeChapterId) setExpanded(activeChapterId)
  }, [activeChapterId])

  const chapters: ChapterSummary[] = currentVersion?.chapters ?? []

  const loadedId = expanded ?? activeChapterId
  useEffect(() => {
    if (!loadedId) return
    if (!currentVersion) return
    if (bodies[loadedId]) return
    let cancelled = false
    void getChapter(currentVersion.id, loadedId).then((data) => {
      if (cancelled || !data) return
      setBodies((prev) => ({ ...prev, [loadedId!]: data.body }))
    })
    return () => {
      cancelled = true
    }
  }, [loadedId, currentVersion, bodies])

  const toggle = (id: string) => {
    setExpanded((cur) => (cur === id ? null : id))
  }

  const goToSub = (chapterId: string, headingId: string) => {
    onClose()
    if (chapterId === activeChapterId) {
      document.getElementById(headingId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      navigate(`/${chapterId}`, { state: { scrollTo: headingId } })
    }
  }

  const subsOf = (ch: ChapterSummary): { id: string; text: string }[] | undefined => {
    const body = bodies[ch.id]
    if (!body) return undefined
    return extractHeadings(body[locale])
      .filter((h) => h.level === 2)
      .map((h) => ({ id: h.id, text: h.text }))
  }

  return (
    <aside className={`sidebar${open ? ' sidebar-open' : ''}`} aria-label={t.chapters}>
      <div className="sidebar-head">
        <span className="sidebar-title">{t.chapters}</span>
        <button type="button" className="icon-btn sidebar-close" onClick={onClose} aria-label="close">
          ×
        </button>
      </div>
      <nav className="sidebar-nav">
        {chapters.map((ch) => {
          const isActive = ch.id === activeChapterId
          const isExpanded = expanded === ch.id
          const subs = subsOf(ch)
          return (
            <div key={ch.id} className={`tree-chapter${isActive ? ' tree-active' : ''}`}>
              <div className="tree-row" role="treeitem" aria-expanded={isExpanded}>
                <button
                  type="button"
                  className="tree-caret"
                  onClick={() => toggle(ch.id)}
                  aria-label={isExpanded ? 'collapse' : 'expand'}
                >
                  {isExpanded ? '▾' : '▸'}
                </button>
                <Link to={`/${ch.id}`} className="tree-link" onClick={onClose}>
                  <span className="tree-order">{String(ch.order).padStart(2, '0')}</span>
                  <span className="tree-title">{ch.title[locale]}</span>
                </Link>
              </div>
              {isExpanded && (
                <ul className="tree-subs">
                  {subs ? (
                    subs.map((s) => (
                      <li key={s.id}>
                        <button type="button" className="tree-sub" onClick={() => goToSub(ch.id, s.id)}>
                          {s.text}
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="tree-sub tree-sub-placeholder">{t.loading}</li>
                  )}
                </ul>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
