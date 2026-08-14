import type { Decision } from '../data/types'
import { useLocale } from '../i18n'

export function DecisionCard({ decision }: { decision: Decision }) {
  const { locale, t } = useLocale()

  return (
    <article className="decision-card" id={decision.id}>
      <h3 className="decision-title">{decision.title[locale]}</h3>

      <p className="decision-description">{decision.description[locale]}</p>

      <div className="decision-row">
        <div className="decision-col">
          <h4 className="decision-col-heading">{t.why}</h4>
          <p>{decision.alternatives[locale]}</p>
        </div>
      </div>

      {decision.insight && (
        <div className="decision-insight">
          <span className="insight-label">{t.insight}</span>
          <p>{decision.insight[locale]}</p>
        </div>
      )}

      {decision.codeRefs && decision.codeRefs.length > 0 && (
        <div className="decision-codeRefs">
          <h4 className="decision-col-heading">{t.codeRefs}</h4>
          <ul>
            {decision.codeRefs.map((ref) => (
              <li key={ref.path} className="code-ref">
                <code>{ref.path}</code>
                <span className="code-ref-note">{ref.note[locale]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
