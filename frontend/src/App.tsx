import { useEffect, useState } from 'react'
import FlowCanvas from '@/components/FlowCanvas'
import Sidebar from '@/components/Sidebar'
import PromptInput from '@/components/PromptInput'
import PromptOutput from '@/components/PromptOutput'
import KeyboardShortcuts from '@/components/KeyboardShortcuts'
import { useFlowStore } from '@/store/flowStore'
import './styles.css'

type Tab = 'input' | 'canvas' | 'output'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'input',  label: 'Prompt',  icon: '✏️' },
  { id: 'canvas', label: 'Canvas',  icon: '⬡' },
  { id: 'output', label: 'Résultat', icon: '✨' },
]

const useBackendStatus = () => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/decompose', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: 'ping' }), signal: AbortSignal.timeout(3000) })
        setStatus(res.ok ? 'online' : 'offline')
      } catch {
        setStatus('offline')
      }
    }
    check()
    const interval = setInterval(check, 15000)
    return () => clearInterval(interval)
  }, [])

  return status
}

const formatSavedTime = (ts: number | null): string | null => {
  if (!ts) return null
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}

const App = () => {
  const { undo, redo, reset, past, future, nodes, lastSaved } = useFlowStore()
  const [activeTab, setActiveTab] = useState<Tab>('canvas')
  const backendStatus = useBackendStatus()

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
          <div className="logo-icon">⬡</div>
          <h1 className="logo">flompt</h1>
          <span className="tagline hide-mobile">Visual Prompt Builder</span>
        </div>

        <div className="header-spacer" />

        {/* Node count */}
        {nodes.length > 0 && (
          <span className="node-count hide-mobile">{nodes.length} bloc{nodes.length > 1 ? 's' : ''}</span>
        )}

        {/* Backend status */}
        <div className={`backend-status backend-status--${backendStatus}`} title={`Backend ${backendStatus}`}>
          <span className="backend-dot" />
          <span className="backend-label hide-mobile">
            {backendStatus === 'checking' ? 'Connexion...' : backendStatus === 'online' ? 'Backend OK' : 'Backend off'}
          </span>
        </div>

        {/* Auto-save indicator */}
        {lastSaved && (
          <span className="autosave-indicator hide-mobile" title="Sauvegardé automatiquement">
            💾 {formatSavedTime(lastSaved)}
          </span>
        )}

        <div className="header-actions">
          <button className="btn-icon" onClick={undo} disabled={past.length === 0} title="Annuler (Ctrl+Z)">↩</button>
          <button className="btn-icon" onClick={redo} disabled={future.length === 0} title="Rétablir (Ctrl+Y)">↪</button>
          <KeyboardShortcuts />
          <button
            className="btn-icon"
            onClick={() => { if (confirm('Réinitialiser le canvas ?')) reset() }}
            title="Réinitialiser"
            style={{ color: 'var(--error)', borderColor: 'rgba(239,68,68,0.2)' }}
          >✕</button>
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
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? ' tab-btn--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
