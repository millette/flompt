import { useEffect, useState } from 'react'
import FlowCanvas from '@/components/FlowCanvas'
import Sidebar from '@/components/Sidebar'
import PromptInput from '@/components/PromptInput'
import PromptOutput from '@/components/PromptOutput'
import { useFlowStore } from '@/store/flowStore'
import './styles.css'

type Tab = 'input' | 'canvas' | 'output'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'input',  label: 'Prompt',  icon: '✏️' },
  { id: 'canvas', label: 'Canvas',  icon: '⬡' },
  { id: 'output', label: 'Résultat', icon: '✨' },
]

const App = () => {
  const { undo, redo, reset, past, future } = useFlowStore()
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
      {/* Header */}
      <header className="header">
        <div className="header-brand">
          <div className="logo-icon">⬡</div>
          <h1 className="logo">flompt</h1>
          <span className="tagline hide-mobile">Visual Prompt Builder</span>
        </div>

        <div className="header-spacer" />

        <div className="header-actions">
          <button className="btn-icon" onClick={undo} disabled={past.length === 0} title="Annuler (Ctrl+Z)">↩</button>
          <button className="btn-icon" onClick={redo} disabled={future.length === 0} title="Rétablir (Ctrl+Y)">↪</button>
          <button
            className="btn-icon"
            onClick={() => { if (confirm('Réinitialiser le canvas ?')) reset() }}
            title="Réinitialiser"
            style={{ color: 'var(--error)', borderColor: 'rgba(239,68,68,0.2)' }}
          >✕</button>
        </div>
      </header>

      {/* Main layout */}
      <main className="main">
        {/* Left panel */}
        <aside className={`left-panel${activeTab !== 'input' ? ' panel-hidden' : ''}`}>
          <PromptInput />
          <div className="panel-divider" />
          <Sidebar />
        </aside>

        {/* Canvas */}
        <div className={`canvas-wrap${activeTab !== 'canvas' ? ' panel-hidden' : ''}`}>
          <FlowCanvas />
        </div>

        {/* Right panel */}
        <aside className={`right-panel${activeTab !== 'output' ? ' panel-hidden' : ''}`}>
          <PromptOutput />
        </aside>
      </main>

      {/* Mobile tab bar */}
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
