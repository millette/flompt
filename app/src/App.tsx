import { useEffect } from 'react'
import { Undo2, Redo2, Workflow, PenLine, Network, Sparkles, Trash2, Github } from 'lucide-react'
import { initAnalytics, setSource, analytics } from '@/lib/analytics'
import FlowCanvas from '@/components/FlowCanvas'
import Sidebar from '@/components/Sidebar'
import PromptInput from '@/components/PromptInput'
import PromptOutput from '@/components/PromptOutput'
import KeyboardShortcuts from '@/components/KeyboardShortcuts'
import GuidedTour from '@/components/GuidedTour'
import { useFlowStore } from '@/store/flowStore'
import type { Tab } from '@/store/flowStore'
import { useLocale } from '@/i18n/LocaleContext'
import type { Locale } from '@/i18n/translations'
import './styles.css'

const TAB_IDS: { id: Tab; Icon: typeof Workflow }[] = [
  { id: 'input',  Icon: PenLine },
  { id: 'canvas', Icon: Network },
  { id: 'output', Icon: Sparkles },
]

const isExtension = new URLSearchParams(window.location.search).get('extension') === '1'

const App = () => {
  const { undo, redo, reset, past, future, nodes, activeTab, setActiveTab, isDecomposing } = useFlowStore()
  const { t, locale, setLocale } = useLocale()

  // Init PostHog after first render — non-blocking
  useEffect(() => {
    initAnalytics()
    setSource(isExtension ? 'extension' : 'web')
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  const toggleLocale = () => {
    const next = locale === 'en' ? 'fr' : 'en' as Locale
    setLocale(next)
    analytics.localeChanged(next)
  }

  return (
    <div className="app">
      {!isExtension && (
        <header className="header">
          <a href="/" className="header-brand" style={{ textDecoration: 'none' }}>
            <h1 className="logo">flompt</h1>
          </a>

          <div className="header-spacer" />

          {/* Node count */}
          {nodes.length > 0 && (
            <span className="node-count hide-mobile">{t.nodeCount(nodes.length)}</span>
          )}

          <div className="header-actions">
            <button className="btn-icon" onClick={undo} disabled={past.length === 0} title={t.header.undo}>
              <Undo2 size={14} />
            </button>
            <button className="btn-icon" onClick={redo} disabled={future.length === 0} title={t.header.redo}>
              <Redo2 size={14} />
            </button>
            <KeyboardShortcuts />
            <button
              className="btn-locale"
              onClick={toggleLocale}
              title={locale === 'en' ? 'Passer en français' : 'Switch to English'}
            >
              {locale.toUpperCase()}
            </button>
            <a
              className="btn-icon btn-github"
              href="https://github.com/Nyrok/flompt"
              target="_blank"
              rel="noopener noreferrer"
              title="Star on GitHub"
            >
              <Github size={14} />
            </a>
            <button
              className="btn-icon btn-clear-desktop"
              onClick={() => { if (confirm(t.header.resetConfirm)) reset() }}
              title={t.header.reset}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </header>
      )}

      <main className={`main${isDecomposing ? ' is-decomposing' : ''}`}>
        <aside className={`left-panel${activeTab !== 'input' ? ' panel-hidden' : ''}`}>
          <PromptInput />
          <div className="panel-divider" />
          <Sidebar />
        </aside>

        <div className={`canvas-wrap${activeTab !== 'canvas' ? ' panel-hidden' : ''}`}>
          <FlowCanvas />
        </div>

        <aside className={`right-panel${activeTab !== 'output' ? ' panel-hidden' : ''}`}>
          <PromptOutput />
        </aside>
      </main>

      {/* Guided tour — desktop only, first visit only */}
      <GuidedTour />

      <nav className="tab-bar">
        {TAB_IDS.map(({ id, Icon }) => (
          <button
            key={id}
            className={`tab-btn${activeTab === id ? ' tab-btn--active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={18} className="tab-icon" />
            <span className="tab-label">{t.tabs[id]}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
