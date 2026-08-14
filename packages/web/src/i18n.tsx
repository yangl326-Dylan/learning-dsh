import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Locale } from './data/types'

/** UI chrome strings (content text comes from the compiled data). */
export const ui = {
  en: {
    brand: 'learning-dsh',
    tagline: 'Understand DeepSeek Harness design and implementation from scratch',
    versions: 'Version',
    chapters: 'Chapters',
    home: 'Home',
    readingGuide: 'Reading guide',
    sourceAnchor: 'Source anchor',
    why: 'Why',
    alternatives: 'Alternatives considered',
    insight: 'Insight',
    codeRefs: 'Code refs',
    notFound: 'Chapter not found',
    loading: 'Loading…',
    backHome: 'Back to home',
    prevChapter: 'Prev',
    nextChapter: 'Next',
  },
  zh: {
    brand: 'learning-dsh',
    tagline: '从零理解 DeepSeek Harness 的设计与实现',
    versions: '版本',
    chapters: '章节',
    home: '首页',
    readingGuide: '阅读指引',
    sourceAnchor: '源码锚点',
    why: '为什么',
    alternatives: '备选方案',
    insight: '洞察',
    codeRefs: '代码引用',
    notFound: '未找到该章节',
    loading: '加载中…',
    backHome: '返回首页',
    prevChapter: '上一章',
    nextChapter: '下一章',
  },
} as const

export type UiStrings = (typeof ui)[Locale]

interface LocaleContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: UiStrings
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

const STORAGE_KEY = 'learning-dsh:locale'

function initialLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'zh') return stored
  return 'zh'
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem(STORAGE_KEY, l)
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t: ui[locale] }),
    [locale, setLocale],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
