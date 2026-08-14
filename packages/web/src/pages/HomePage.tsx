import { Link } from 'react-router-dom'
import { useApp } from '../store'
import { useLocale } from '../i18n'

export function HomePage() {
  const { currentVersion, loading } = useApp()
  const { locale, t } = useLocale()

  if (loading) return <p className="status-line">{t.loading}</p>
  if (!currentVersion) return <p className="status-line">{t.notFound}</p>

  return (
    <div className="home">
      <section className="hero">
        <h1>{t.tagline}</h1>
        <p className="hero-sub">
          {currentVersion.label} · {t.sourceAnchor} {currentVersion.id}
        </p>
      </section>

      <section className="chapter-list">
        <h2>{t.chapters}</h2>
        <ol className="chapter-cards">
          {currentVersion.chapters.map((ch) => (
            <li key={ch.id}>
              <Link to={`/${ch.id}`} className="chapter-card">
                <span className="chapter-order">{String(ch.order).padStart(2, '0')}</span>
                <span className="chapter-card-body">
                  <span className="chapter-card-title">{ch.title[locale]}</span>
                  <span className="chapter-card-summary">{ch.summary[locale]}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
