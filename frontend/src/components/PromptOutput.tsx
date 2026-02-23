import { useFlowStore } from '@/store/flowStore'
import { compilePrompt } from '@/services/api'

const PromptOutput = () => {
  const { nodes, compiledPrompt, setCompiledPrompt, setIsCompiling, isCompiling } = useFlowStore()

  const handleCompile = async () => {
    if (nodes.length === 0) return
    setIsCompiling(true)
    try {
      const blocks = nodes.map((n) => n.data)
      const result = await compilePrompt(blocks)
      setCompiledPrompt(result)
    } catch (e) {
      console.error(e)
    } finally {
      setIsCompiling(false)
    }
  }

  const handleCopy = () => {
    if (compiledPrompt) navigator.clipboard.writeText(compiledPrompt.raw)
  }

  return (
    <div className="prompt-output-panel">
      <div className="output-header">
        <h2 className="panel-title">Prompt optimisé</h2>
        {compiledPrompt && (
          <span className="token-badge">~{compiledPrompt.tokenEstimate} tokens</span>
        )}
      </div>

      {compiledPrompt ? (
        <>
          <pre className="compiled-output">{compiledPrompt.raw}</pre>
          <button className="btn btn-secondary" onClick={handleCopy}>
            📋 Copier
          </button>
        </>
      ) : (
        <p className="output-placeholder">
          Construis ton flowchart puis valide pour générer le prompt optimisé.
        </p>
      )}

      <button
        className="btn btn-primary"
        onClick={handleCompile}
        disabled={isCompiling || nodes.length === 0}
      >
        {isCompiling ? 'Compilation...' : '✅ Valider & Compiler'}
      </button>
    </div>
  )
}

export default PromptOutput
