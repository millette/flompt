import { useEffect, useState } from 'react'
import { Undo2, Redo2, X, Save, Workflow, PenLine, Network, Sparkles } from 'lucide-react'
// useBackendStatus retiré — badge supprimé à la demande
import FlowCanvas from '@/components/FlowCanvas'
import Sidebar from '@/components/Sidebar'
import PromptInput from '@/components/PromptInput'
import PromptOutput from '@/components/PromptOutput'
import KeyboardShortcuts from '@/components/KeyboardShortcuts'
import { useFlowStore } from '@/store/flowStore'
import './styles.css'

type Tab = 'input' | 'canvas' | 'output'

const TABS: { id: Tab; label: string; Icon: typeof Workflow }[] = [
  { id: 'input',  label: 'Prompt',   Icon: PenLine },
  { id: 'canvas', label: 'Canvas',   Icon: Network },
  { id: 'output', label: 'Résultat', Icon: Sparkles },
]

const formatSavedTime = (ts: number | null): string | null => {
  if (!ts) return null
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}

const App = () => {
  const { undo, redo, reset, past, future, nodes, lastSaved } = useFlowStore()
  const [activeTab, setActiveTab] = useState<Tab>('canvas')

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
          <span className="node-count hide-mobile">{nodes.length} bloc{nodes.length > 1 ? 's' : ''}</span>
        )}

        {/* Auto-save indicator */}
        {lastSaved && (
          <span className="autosave-indicator hide-mobile" title="Sauvegardé automatiquement">
            <Save size={11} /> {formatSavedTime(lastSaved)}
          </span>
        )}

        <div className="header-actions">
          <button className="btn-icon" onClick={undo} disabled={past.length === 0} title="Annuler (Ctrl+Z)">
            <Undo2 size={14} />
          </button>
          <button className="btn-icon" onClick={redo} disabled={future.length === 0} title="Rétablir (Ctrl+Y)">
            <Redo2 size={14} />
          </button>
          <KeyboardShortcuts />
          <button
            className="btn-icon"
            onClick={() => { if (confirm('Réinitialiser le canvas ?')) reset() }}
            title="Réinitialiser"
            style={{ color: 'var(--error)', borderColor: 'rgba(239,68,68,0.2)' }}
          >
            <X size={14} />
          </button>
        </div>
      </header>

      <main className="main">
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
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`tab-btn${activeTab === id ? ' tab-btn--active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={18} className="tab-icon" />
            <span className="tab-label">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
