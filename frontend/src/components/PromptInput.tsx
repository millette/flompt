import { useState } from 'react'
import { Zap, Loader } from 'lucide-react'
import { useFlowStore } from '@/store/flowStore'
import { decomposePrompt } from '@/services/api'
import { useLocale } from '@/i18n/LocaleContext'

const PromptInput = () => {
  const { rawPrompt, setRawPrompt, setNodes, setEdges, setIsDecomposing, isDecomposing, setActiveTab } =
    useFlowStore()
  const { t } = useLocale()
  const [error, setError] = useState<string | null>(null)

  const handleDecompose = async () => {
    if (!rawPrompt.trim()) return
    setError(null)
    setIsDecomposing(true)
    // Navigate to canvas immediately so user sees the loading
    setActiveTab('canvas')
    try {
      const { nodes, edges } = await decomposePrompt(rawPrompt)
      setNodes(nodes)
      setEdges(edges)
    } catch (e) {
      setError(t.promptInput.errorDecompose)
      console.error(e)
    } finally {
      setIsDecomposing(false)
    }
  }

  return (
    <div className="prompt-input-panel">
      <h2 className="panel-title">{t.promptInput.title}</h2>
      <textarea
        className="prompt-textarea"
        value={rawPrompt}
        onChange={(e) => setRawPrompt(e.target.value)}
        placeholder={t.promptInput.placeholder}
        rows={5}
      />
      {error && <p className="error-msg">{error}</p>}
      <button
        className="btn btn-primary"
        onClick={handleDecompose}
        disabled={isDecomposing || !rawPrompt.trim()}
      >
        {isDecomposing
          ? <><Loader size={14} className="icon-spin" /> {t.promptInput.decomposing}</>
          : <><Zap size={14} /> {t.promptInput.decompose}</>
        }
      </button>
    </div>
  )
}

export default PromptInput
