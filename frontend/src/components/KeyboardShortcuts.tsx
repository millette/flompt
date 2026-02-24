import { useState, useEffect } from 'react'
import { Keyboard, X } from 'lucide-react'

const SHORTCUTS = [
  { keys: ['Ctrl', 'Z'], label: 'Annuler' },
  { keys: ['Ctrl', 'Y'], label: 'Rétablir' },
  { keys: ['Ctrl', '⇧', 'Z'], label: 'Rétablir (alt)' },
  { keys: ['Del'], label: 'Supprimer le bloc sélectionné' },
  { keys: ['Ctrl', 'A'], label: 'Tout sélectionner' },
  { keys: ['Scroll'], label: 'Zoom in/out' },
  { keys: ['Click', 'drag'], label: 'Déplacer un bloc' },
  { keys: ['Bg drag'], label: 'Déplacer le canvas' },
  { keys: ['?'], label: 'Afficher les raccourcis' },
]

const KeyboardShortcuts = () => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <button
        className="btn-icon shortcuts-btn"
        onClick={() => setOpen((v) => !v)}
        title="Raccourcis clavier (?)"
      >
        <Keyboard size={14} />
      </button>

      {open && (
        <div className="shortcuts-overlay" onClick={() => setOpen(false)}>
          <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shortcuts-header">
              <h2 className="shortcuts-title">Raccourcis clavier</h2>
              <button className="btn-icon" onClick={() => setOpen(false)}><X size={14} /></button>
            </div>
            <div className="shortcuts-list">
              {SHORTCUTS.map((s, i) => (
                <div key={i} className="shortcut-row">
                  <div className="shortcut-keys">
                    {s.keys.map((k, j) => (
                      <span key={j} className="shortcut-key">{k}</span>
                    ))}
                  </div>
                  <span className="shortcut-label">{s.label}</span>
                </div>
              ))}
            </div>
            <p className="shortcuts-hint">Appuie sur <span className="shortcut-key">Esc</span> ou <span className="shortcut-key">?</span> pour fermer</p>
          </div>
        </div>
      )}
    </>
  )
}

export default KeyboardShortcuts
