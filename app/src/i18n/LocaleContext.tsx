import { createContext, useContext, useState, type ReactNode } from 'react'
import { translations } from './translations'
import type { Locale, Translations } from './translations'

// ── Types ───────────────────────────────────────────────────────────────────

interface LocaleContextValue {
  t: Translations
  locale: Locale
  setLocale: (l: Locale) => void
}

// ── Context ─────────────────────────────────────────────────────────────────

const LocaleContext = createContext<LocaleContextValue | null>(null)

// ── Provider ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'flompt-locale'

function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'fr') return stored
  } catch {}
  return 'en'
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    try { localStorage.setItem(STORAGE_KEY, l) } catch {}
  }

  return (
    <LocaleContext.Provider value={{ t: translations[locale], locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used inside <LocaleProvider>')
  return ctx
}
