import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getChapter } from '../data/loader'
import type { Chapter, ChapterSummary } from '../data/types'
import { useApp } from '../store'
import { useLocale } from '../i18n'
import { Markdown } from '../components/Markdown'
import { DecisionCard } from '../components/DecisionCard'
import { DiagramLightbox } from '../components/DiagramLightbox'

export function ChapterPage() {
  const { chapterId } = useParams<{ chapterId: string }>()
  const { currentVersion } = useApp()
  const { locale, t } = useLocale()
  const location = useLocation()
  const navigate = useNavigate()
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    if (!currentVersion || !chapterId) {
      setLoading(false)
      return
    }
    void getChapter(currentVersion.id, chapterId).then((data) => {
      if (cancelled) return
      setChapter(data)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [currentVersion, chapterId])

  const scrollTarget = (location.state as { scrollTo?: string } | null)?.scrollTo
  useEffect(() => {
    if (loading || !scrollTarget) return
    document.getElementById(scrollTarget)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    navigate(location.pathname, { replace: true })
  }, [loading, scrollTarget, location.pathname, navigate])

  if (loading) return <p className="status-line">{t.loading}</p>
  if (!currentVersion || !chapter) return <p className="status-line">{t.notFound}</p>

  const chapters: ChapterSummary[] = currentVersion.chapters
  const idx = chapters.findIndex((c) => c.id === chapter.id)
  const prev = idx > 0 ? chapters[idx - 1] : undefined
  const next = idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1] : undefined

  return (
    <div className="chapter-page">
      <article className="chapter-main">
        <header className="chapter-header">
          <span className="chapter-badge">
            {String(chapter.order).padStart(2, '0')} · {currentVersion.label}
          </span>
          <h1>{chapter.title[locale]}</h1>
          <p className="chapter-summary">{chapter.summary[locale]}</p>
        </header>

        <Markdown text={chapter.body[locale]} />

        {chapter.diagrams.length > 0 && (
          <section className="chapter-diagrams">
            {chapter.diagrams.map((d) => (
              <figure key={d} className="diagram-figure">
                <button type="button" className="diagram-open" onClick={() => setLightbox(d)}>
                  <img src={`data/diagrams/${d}`} alt={d} loading="lazy" />
                  <span className="diagram-expand-icon" aria-hidden="true">
                    ⤢
                  </span>
                </button>
              </figure>
            ))}
          </section>
        )}

        {chapter.topics.length > 0 && (
          <section className="chapter-topics">
            <h2>{t.readingGuide}</h2>
            <ul>
              {chapter.topics.map((tp) => (
                <li key={tp}>
                  <code>{tp}</code>
                </li>
              ))}
            </ul>
          </section>
        )}

        <nav className="chapter-nav" aria-label="chapter navigation">
          {prev ? (
            <Link to={`/${prev.id}`} className="chapter-nav-link">
              <span className="nav-dir">{t.prevChapter}</span>
              <span className="nav-title">{prev.title[locale]}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link to={`/${next.id}`} className="chapter-nav-link next">
              <span className="nav-dir">{t.nextChapter}</span>
              <span className="nav-title">{next.title[locale]}</span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>

      <aside className="chapter-decisions">
        <h2 className="decisions-heading">Decisions</h2>
        {chapter.decisions.map((d) => (
          <DecisionCard key={d.id} decision={d} />
        ))}
      </aside>

      {lightbox && (
        <DiagramLightbox
          src={`data/diagrams/${lightbox}`}
          alt={lightbox}
          caption={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}
