/** Data contract types — mirror docs/contract/content-contract.md and the
 *  compiled JSON emitted by scripts/build-content.ts into public/data/. */

export interface LocalizedText {
  en: string
  zh: string
}

export interface CodeRef {
  path: string
  note: LocalizedText
}

export interface SourceRef {
  type: 'commit' | 'tag'
  sha?: string
  tag?: string
}

export interface Decision {
  id: string
  title: LocalizedText
  description: LocalizedText
  alternatives: LocalizedText
  codeRefs?: CodeRef[]
  diagram?: string
  insight?: LocalizedText
}

export interface ChapterSummary {
  id: string
  order: number
  title: LocalizedText
  summary: LocalizedText
}

export interface ChapterRef {
  id: string
  order: number
}

export interface VersionSummary {
  id: string
  label: string
  status: string
  chapters: ChapterSummary[]
}

export interface Version {
  id: string
  label: string
  sourceRef: SourceRef
  status: string
  releasedAt?: string
  chapters: ChapterRef[]
}

export interface IndexData {
  versions: VersionSummary[]
}

export interface VersionData {
  version: Version
}

export interface Chapter {
  id: string
  order: number
  title: LocalizedText
  summary: LocalizedText
  topics: string[]
  diagrams: string[]
  decisions: Decision[]
  body: LocalizedText
}

export type Locale = 'en' | 'zh'
