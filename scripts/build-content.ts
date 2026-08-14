/**
 * Content build pipeline — content/ → packages/web/public/data/.
 *
 * Reads the versioned bilingual content source (content/versions/*),
 * validates it against the content contract, splits body.md language
 * blocks, and emits static JSON consumed by the frontend.
 *
 * Contract: docs/contract/content-contract.md
 * Run: pnpm build:content
 */

import { readFile, readdir, writeFile, mkdir, copyFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { load as loadYamlDoc } from 'js-yaml'

// ---------------------------------------------------------------------------
// Types (mirror content-contract.md)
// ---------------------------------------------------------------------------

interface LocalizedText {
  en: string
  zh: string
}

interface CodeRef {
  path: string
  note: LocalizedText
}

interface SourceRef {
  type: 'commit' | 'tag'
  sha?: string
  tag?: string
}

interface Decision {
  id: string
  title: LocalizedText
  description: LocalizedText
  alternatives: LocalizedText
  codeRefs?: CodeRef[]
  diagram?: string
  insight?: LocalizedText
}

interface ChapterSummary {
  id: string
  order: number
  title: LocalizedText
  summary: LocalizedText
}

interface ChapterRef {
  id: string
  order: number
}

interface VersionManifest {
  id: string
  label: string
  sourceRef: SourceRef
  status: 'complete' | 'partial' | 'planned'
  releasedAt?: string
  chapters: ChapterRef[]
}

interface ChapterData extends ChapterSummary {
  topics?: string[]
  decisions: Decision[]
  diagrams?: string[]
  body: { en: string; zh: string }
}

interface VersionIndexEntry {
  id: string
  label: string
  status: VersionManifest['status']
  chapters: ChapterSummary[]
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const errors: string[] = []
const warnings: string[] = []

function isLocalized(v: unknown, where: string): asserts v is LocalizedText {
  const o = v as LocalizedText | undefined
  if (!o || typeof o.en !== 'string' || typeof o.zh !== 'string') {
    errors.push(`[V2] ${where}: LocalizedText must contain both "en" and "zh"`)
  }
}

function checkId(id: unknown, where: string): asserts id is string {
  if (typeof id !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
    errors.push(`[V7] ${where}: id must be kebab-case ("${String(id)}")`)
  }
}

function validateDecision(d: Decision, chapterId: string) {
  checkId(d.id, `chapter ${chapterId} decision`)
  isLocalized(d.title, `decision ${d.id}.title`)
  isLocalized(d.description, `decision ${d.id}.description`)
  isLocalized(d.alternatives, `decision ${d.id}.alternatives`)
  if (d.insight) isLocalized(d.insight, `decision ${d.id}.insight`)
  for (const ref of d.codeRefs ?? []) {
    isLocalized(ref.note, `decision ${d.id}.codeRef ${ref.path}`)
    if (!ref.path) errors.push(`[V5] decision ${d.id}: codeRef.path empty`)
  }
}

// ---------------------------------------------------------------------------
// body.md language-block parsing
// ---------------------------------------------------------------------------

const LOCALE_ANCHOR = /<!--\s*@locale:(\w+)\s*-->/g

/** Split a body.md into per-locale blocks. Missing blocks are contract errors. */
function parseBody(md: string, where: string): { en: string; zh: string } {
  const blocks = new Map<string, string>()
  let lastLocale: string | null = null
  let lastStart = 0
  for (const match of md.matchAll(LOCALE_ANCHOR)) {
    const index = match.index ?? 0
    if (lastLocale) {
      blocks.set(lastLocale, md.slice(lastStart, index).trim())
    }
    lastLocale = match[1]!
    lastStart = index + match[0].length
  }
  if (lastLocale) blocks.set(lastLocale, md.slice(lastStart).trim())

  const en = blocks.get('en')
  const zh = blocks.get('zh')
  if (typeof en !== 'string' || typeof zh !== 'string' || en === '' || zh === '') {
    errors.push(`[V3] ${where}: body.md must contain non-empty "@locale:en" and "@locale:zh" blocks`)
  }
  return { en: en ?? '', zh: zh ?? '' }
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

const ROOT = join(import.meta.dirname, '..')
const CONTENT_DIR = join(ROOT, 'content')
const VERSIONS_DIR = join(CONTENT_DIR, 'versions')
const DIAGRAMS_DIR = join(CONTENT_DIR, 'assets', 'diagrams')
const OUT_DIR = join(ROOT, 'packages', 'web', 'public', 'data')

async function loadYaml<T>(path: string): Promise<T> {
  const raw = await readFile(path, 'utf8')
  return loadYamlDoc(raw) as T
}

async function main() {
  const versionDirs = (await readdir(VERSIONS_DIR, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()

  if (versionDirs.length === 0) {
    errors.push('[V1] no version directories under content/versions/')
  }

  const indexEntries: VersionIndexEntry[] = []

  for (const versionId of versionDirs) {
    const vDir = join(VERSIONS_DIR, versionId)
    const manifest = await loadYaml<VersionManifest>(join(vDir, 'version.yaml'))
    if (manifest.id !== versionId) {
      errors.push(`[V1] version.yaml id "${manifest.id}" != directory "${versionId}"`)
    }

    const chapters: ChapterData[] = []
    for (const ref of manifest.chapters) {
      const cDir = join(vDir, 'chapters', ref.id)
      const chapter = await loadYaml<Omit<ChapterData, 'body'>>(join(cDir, 'chapter.yaml'))
      checkId(chapter.id, `version ${versionId} chapter`)
      isLocalized(chapter.title, `chapter ${chapter.id}.title`)
      isLocalized(chapter.summary, `chapter ${chapter.id}.summary`)
      for (const d of chapter.decisions) validateDecision(d, chapter.id)
      if (chapter.order !== ref.order) {
        warnings.push(`[V7] chapter ${chapter.id}: chapter.yaml order ${chapter.order} != version.yaml order ${ref.order}`)
      }
      const body = parseBody(await readFile(join(cDir, 'body.md'), 'utf8'), `chapter ${chapter.id} body.md`)
      chapters.push({ ...chapter, body })
    }
    chapters.sort((a, b) => a.order - b.order)

    const manifest2 = { ...manifest }
    const entries: ChapterSummary[] = chapters.map(({ id, order, title, summary }) => ({ id, order, title, summary }))
    indexEntries.push({ id: manifest.id, label: manifest.label, status: manifest.status, chapters: entries })

    // Write per-version and per-chapter artifacts.
    const vOut = join(OUT_DIR, 'versions')
    const cOut = join(OUT_DIR, 'chapters', versionId)
    await mkdir(vOut, { recursive: true })
    await mkdir(cOut, { recursive: true })
    await writeFile(join(vOut, `${versionId}.json`), JSON.stringify({ version: manifest2, chapters: entries }, null, 2))
    for (const chapter of chapters) {
      await writeFile(join(cOut, `${chapter.id}.json`), JSON.stringify(chapter, null, 2))
    }
  }

  // Copy diagram assets.
  const diagramsOut = join(OUT_DIR, 'diagrams')
  await mkdir(diagramsOut, { recursive: true })
  try {
    for (const file of await readdir(DIAGRAMS_DIR)) {
      if (file.endsWith('.svg')) {
        await copyFile(join(DIAGRAMS_DIR, file), join(diagramsOut, file))
      }
    }
  } catch {
    warnings.push('[V6] content/assets/diagrams missing or unreadable — no diagrams shipped')
  }

  // Write the version index.
  await writeFile(join(OUT_DIR, 'index.json'), JSON.stringify({ versions: indexEntries }, null, 2))

  // Report.
  if (errors.length > 0) {
    console.error('Content build FAILED:')
    for (const e of errors) console.error(`  ✗ ${e}`)
    process.exit(1)
  }
  for (const w of warnings) console.warn(`  ! ${w}`)
  console.log(`Content build OK — ${versionDirs.length} version(s), written to ${relative(ROOT, OUT_DIR)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
