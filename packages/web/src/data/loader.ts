/** Fetch helpers for the compiled content JSON under public/data/.
 *  All paths are relative (vite config uses base './'). */

import type { Chapter, IndexData, VersionData } from './types'

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function getIndex(): Promise<IndexData | null> {
  return getJson<IndexData>('data/index.json')
}

export async function getVersion(versionId: string): Promise<VersionData | null> {
  return getJson<VersionData>(`data/versions/${versionId}.json`)
}

export async function getChapter(versionId: string, chapterId: string): Promise<Chapter | null> {
  return getJson<Chapter>(`data/chapters/${versionId}/${chapterId}.json`)
}
