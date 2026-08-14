import { Link } from 'react-router-dom'
import { useApp } from '../store'
import { useLocale } from '../i18n'
import { useTheme } from '../theme'

interface HeaderProps {
  onToggleSidebar?: () => void
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { versions, currentVersion, setCurrentVersionId } = useApp()
  const { locale, setLocale, t } = useLocale()
  const [theme, toggleTheme] = useTheme()

  return (
    <header className="site-header">
      <div className="header-left">
        {onToggleSidebar && (
          <button
            type="button"
            className="icon-btn sidebar-toggle"
            onClick={onToggleSidebar}
            aria-label="toggle navigation"
            title="Navigation"
          >
            ☰
          </button>
        )}
        <Link to="/" className="brand">
          {t.brand}
          <span className="brand-dot">·</span>
        </Link>
      </div>

      <div className="header-controls">
        {versions.length > 0 && (
          <label className="version-select">
            <span className="control-label">{t.versions}</span>
            <select
              value={currentVersion?.id ?? ''}
              onChange={(e) => setCurrentVersionId(e.target.value)}
              disabled={versions.length <= 1}
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          className="icon-btn"
          type="button"
          onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
          title={locale === 'zh' ? 'Switch to English' : '切换到中文'}
        >
          {locale === 'zh' ? 'EN' : '中'}
        </button>

        <button
          className="icon-btn"
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </div>
    </header>
  )
}
