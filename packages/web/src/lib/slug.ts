/** Heading extraction and slugging for chapter bodies.
 *
 *  Mirrors the heading subset rendered by Markdown.tsx (h2/h3): the sidebar
 *  and the renderer must agree on the same ordered heading list so heading
 *  ids stay aligned. h1 lines are document titles ignored by the renderer,
 *  so they are excluded here too. Duplicate headings get stable -N suffixes.
 */

export interface HeadingInfo {
  level: number
  id: string
  text: string
}

function cleanText(raw: string): string {
  return raw
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()
}

function slugify(raw: string): string {
  const slug = cleanText(raw)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'heading'
}

export function extractHeadings(markdown: string): HeadingInfo[] {
  const out: HeadingInfo[] = []
  const counts = new Map<string, number>()
  const re = /^(#{2,3})\s+(.*)$/gm
  let m: RegExpExecArray | null
  while ((m = re.exec(markdown)) !== null) {
    const level = m[1]!.length
    const text = m[2] ?? ''
    const base = slugify(text)
    const n = counts.get(base) ?? 0
    counts.set(base, n + 1)
    out.push({ level, id: n === 0 ? base : `${base}-${n}`, text: cleanText(text) })
  }
  return out
}
