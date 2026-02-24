import { useEffect } from 'react'
import { Undo2, Redo2, Workflow, PenLine, Network, Sparkles, Trash2 } from 'lucide-react'
import FlowCanvas from '@/components/FlowCanvas'
import Sidebar from '@/components/Sidebar'
import PromptInput from '@/components/PromptInput'
import PromptOutput from '@/components/PromptOutput'
import KeyboardShortcuts from '@/components/KeyboardShortcuts'
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

const App = () => {
  const { undo, redo, reset, past, future, nodes, activeTab, setActiveTab, isDecomposing } = useFlowStore()
  const { t, locale, setLocale } = useLocale()

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

  const toggleLocale = () => setLocale(locale === 'en' ? 'fr' : 'en' as Locale)

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <div className="logo-icon"><Workflow size={15} color="white" /></div>
          <h1 className="logo">flompt</h1>
        </div>

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
          <button
            className="btn-icon btn-clear-desktop"
            onClick={() => { if (confirm(t.header.resetConfirm)) reset() }}
            title={t.header.reset}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </header>

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
