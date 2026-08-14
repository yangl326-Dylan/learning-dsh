/** App-level state: current version selection + cached index data. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getIndex } from './data/loader'
import type { VersionSummary } from './data/types'

interface AppState {
  versions: VersionSummary[]
  currentVersion: VersionSummary | null
  setCurrentVersionId: (id: string) => void
  loading: boolean
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [versions, setVersions] = useState<VersionSummary[]>([])
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void getIndex().then((data) => {
      if (cancelled) return
      if (data) {
        setVersions(data.versions)
        setCurrentVersionId((prev) => prev ?? data.versions[0]?.id ?? null)
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const currentVersion = useMemo(
    () => versions.find((v) => v.id === currentVersionId) ?? null,
    [versions, currentVersionId],
  )

  const value = useMemo<AppState>(
    () => ({ versions, currentVersion, setCurrentVersionId, loading }),
    [versions, currentVersion, currentVersionId, loading],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppState {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

/** Reset selection to the first version (used by version selector). */
export function useVersionSelector() {
  const { versions, currentVersion, setCurrentVersionId } = useApp()
  const select = useCallback(
    (id: string) => {
      setCurrentVersionId(id)
    },
    [setCurrentVersionId],
  )
  return { versions, currentVersion, select }
}
