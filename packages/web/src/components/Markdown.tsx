/** Minimal, safe Markdown renderer for chapter bodies.
 *  The body.md source is compiled to plain markdown per locale (language
 *  blocks already split at build time). Supports the subset used by the
 *  content: ## / ### headings, paragraphs, `code`, **bold**, lists,
 *  fenced code blocks, and [links](url).
 *
 *  Safety: all text is rendered as JSX children — React escapes text nodes
 *  and attribute values automatically, so raw strings are never injected
 *  as HTML. No manual entity-escaping is applied (double-escaping would
 *  surface literal entities like &quot; in the page).
 */
import { Fragment, type ReactNode } from 'react'
import { extractHeadings } from '../lib/slug'

/** Inline tokens: `code`, **bold**, [text](url). */
function renderInline(raw: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = []
  let key = 0
  const tokenRe = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))/g
  let lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = tokenRe.exec(raw)) !== null) {
    if (m.index > lastIndex) {
      parts.push(<Fragment key={`${keyPrefix}-t${key++}`}>{raw.slice(lastIndex, m.index)}</Fragment>)
    }
    if (m[1]) {
      parts.push(<code key={`${keyPrefix}-c${key++}`}>{m[1].slice(1, -1)}</code>)
    } else if (m[2]) {
      parts.push(<strong key={`${keyPrefix}-b${key++}`}>{m[2].slice(2, -2)}</strong>)
    } else if (m[3]) {
      const inner = m[3]
      const close = inner.lastIndexOf('](')
      const text = inner.slice(1, close)
      const href = inner.slice(close + 2, -1)
      parts.push(
        <a key={`${keyPrefix}-a${key++}`} href={href} target="_blank" rel="noreferrer">
          {text}
        </a>,
      )
    }
    lastIndex = m.index + m[0].length
  }
  if (lastIndex < raw.length) {
    parts.push(<Fragment key={`${keyPrefix}-e${key++}`}>{raw.slice(lastIndex)}</Fragment>)
  }
  return parts
}

export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let key = 0
  let i = 0

  // Pre-compute stable heading ids (same order/duplicates as the sidebar).
  const headingIds = extractHeadings(text)
  let headingIdx = 0
  const nextHeadingId = (level: number): string | undefined => {
    const h = headingIds[headingIdx]
    if (h && h.level === level) {
      headingIdx++
      return h.id
    }
    return undefined
  }

  while (i < lines.length) {
    const line = lines[i] ?? ''

    // Fenced code block
    if (line.startsWith('```')) {
      const buf: string[] = []
      i++
      while (i < lines.length && !(lines[i] ?? '').startsWith('```')) {
        buf.push(lines[i] ?? '')
        i++
      }
      i++ // consume closing fence
      blocks.push(
        <pre key={`pre${key++}`}>
          <code>{buf.join('\n')}</code>
        </pre>,
      )
      continue
    }

    // Headings
    const h3 = line.match(/^###\s+(.*)$/)
    if (h3) {
      const id = nextHeadingId(3)
      blocks.push(
        <h3 key={`h3${key++}`} id={id}>
          {renderInline(h3[1] ?? '', `h3${key}`)}
        </h3>,
      )
      i++
      continue
    }
    const h2 = line.match(/^##\s+(.*)$/)
    if (h2) {
      const id = nextHeadingId(2)
      blocks.push(
        <h2 key={`h2${key++}`} id={id}>
          {renderInline(h2[1] ?? '', `h2${key}`)}
        </h2>,
      )
      i++
      continue
    }

    // Unordered list (consecutive "- " lines)
    if (line.startsWith('- ')) {
      const items: ReactNode[] = []
      while (i < lines.length && (lines[i] ?? '').startsWith('- ')) {
        items.push(<li key={`li${i}`}>{renderInline((lines[i] ?? '').slice(2), `li${i}`)}</li>)
        i++
      }
      blocks.push(<ul key={`ul${key++}`}>{items}</ul>)
      continue
    }

    // Ordered list (consecutive "N. " lines)
    const olMatch = line.match(/^\d+\.\s+(.*)$/)
    if (olMatch) {
      const items: ReactNode[] = []
      while (i < lines.length) {
        const m = lines[i]?.match(/^\d+\.\s+(.*)$/)
        if (!m) break
        items.push(<li key={`oli${i}`}>{renderInline(m[1] ?? '', `oli${i}`)}</li>)
        i++
      }
      blocks.push(<ol key={`ol${key++}`}>{items}</ol>)
      continue
    }

    // Blank line -> paragraph separator
    if (line.trim() === '') {
      i++
      continue
    }

    // Paragraph: collect until next blank line
    const para: string[] = []
    while (i < lines.length && (lines[i] ?? '').trim() !== '') {
      para.push(lines[i] ?? '')
      i++
    }
    blocks.push(<p key={`p${key++}`}>{renderInline(para.join(' '), `p${key}`)}</p>)
  }

  return <div className="markdown-body">{blocks}</div>
}
