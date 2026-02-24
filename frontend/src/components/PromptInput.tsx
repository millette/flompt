import { useState } from 'react'
import { Zap, Loader } from 'lucide-react'
import { useFlowStore } from '@/store/flowStore'
import { decomposePrompt } from '@/services/api'

const PromptInput = () => {
  const { rawPrompt, setRawPrompt, setNodes, setEdges, setIsDecomposing, isDecomposing } =
    useFlowStore()
  const [error, setError] = useState<string | null>(null)

  const handleDecompose = async () => {
    if (!rawPrompt.trim()) return
    setError(null)
    setIsDecomposing(true)
    try {
      const { nodes, edges } = await decomposePrompt(rawPrompt)
      setNodes(nodes)
      setEdges(edges)
    } catch (e) {
      setError("Erreur lors de la décomposition. Vérifiez que le backend est lancé.")
      console.error(e)
    } finally {
      setIsDecomposing(false)
    }
  }

  return (
    <div className="prompt-input-panel">
      <h2 className="panel-title">Prompt brut</h2>
      <textarea
        className="prompt-textarea"
        value={rawPrompt}
        onChange={(e) => setRawPrompt(e.target.value)}
        placeholder="Colle ton prompt ici..."
        rows={5}
      />
      {error && <p className="error-msg">{error}</p>}
      <button
        className="btn btn-primary"
        onClick={handleDecompose}
        disabled={isDecomposing || !rawPrompt.trim()}
      >
        {isDecomposing
          ? <><Loader size={14} className="icon-spin" /> Décomposition...</>
          : <><Zap size={14} /> Décomposer en blocs</>
        }
      </button>
    </div>
  )
}

export default PromptInput
