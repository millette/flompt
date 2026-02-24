import { useState } from 'react'
import { Clipboard, ClipboardCheck, FileText, Braces, Sparkles, Play, Loader } from 'lucide-react'
import { useFlowStore } from '@/store/flowStore'
import { compilePrompt } from '@/services/api'

const PromptOutput = () => {
  const { nodes, edges, compiledPrompt, setCompiledPrompt, setIsCompiling, isCompiling } = useFlowStore()
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCompile = async () => {
    if (nodes.length === 0) return
    setIsCompiling(true)
    setError(null)
    try {
      const blocks = nodes.map((n) => n.data)
      const result = await compilePrompt(blocks)
      setCompiledPrompt(result)
    } catch (e) {
      console.error(e)
      setError('Erreur lors de la compilation. Vérifiez que le backend est lancé.')
    } finally {
      setIsCompiling(false)
    }
  }

  const handleCopy = () => {
    if (!compiledPrompt) return
    navigator.clipboard.writeText(compiledPrompt.raw).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleExportTxt = () => {
    if (!compiledPrompt) return
    const blob = new Blob([compiledPrompt.raw], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'flompt-prompt.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportJSON = () => {
    const data = { nodes, edges, compiledPrompt, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'flompt-session.json'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="prompt-output-panel">
      <div className="output-header">
        <h2 className="panel-title">Résultat</h2>
        {compiledPrompt && (
          <span className="token-badge">~{compiledPrompt.tokenEstimate} tokens</span>
        )}
      </div>

      {compiledPrompt ? (
        <>
          <pre className="compiled-output">{compiledPrompt.raw}</pre>
          <div className="export-actions">
            <button className="btn btn-secondary export-copy" onClick={handleCopy}>
              {copied
                ? <><ClipboardCheck size={13} /> Copié !</>
                : <><Clipboard size={13} /> Copier</>
              }
            </button>
            <div className="export-row2">
              <button className="btn btn-secondary export-btn" onClick={handleExportTxt} title="Exporter en .txt">
                <FileText size={13} /> .txt
              </button>
              <button className="btn btn-secondary export-btn" onClick={handleExportJSON} title="Exporter en .json">
                <Braces size={13} /> .json
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="output-placeholder">
          <Sparkles size={28} className="output-placeholder-icon" />
          <span>Construis ton flowchart<br />puis compile pour voir le résultat.</span>
        </div>
      )}

      {error && <p className="error-msg">{error}</p>}

      <button
        className="btn btn-primary"
        onClick={handleCompile}
        disabled={isCompiling || nodes.length === 0}
      >
        {isCompiling
          ? <><Loader size={14} className="icon-spin" /> Compilation...</>
          : <><Play size={14} /> Compiler</>
        }
      </button>
    </div>
  )
}

export default PromptOutput
