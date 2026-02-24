import { useState, useRef } from 'react'
import { Zap, Loader, ClipboardPaste } from 'lucide-react'
import { useFlowStore } from '@/store/flowStore'
import { decomposePrompt, classifyError } from '@/services/api'
import { useLocale } from '@/i18n/LocaleContext'

const PromptInput = () => {
  const { rawPrompt, setRawPrompt, setNodes, setEdges, setIsDecomposing, isDecomposing, setActiveTab } =
    useFlowStore()
  const { t } = useLocale()
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleDecompose = async () => {
    if (!rawPrompt.trim()) return
    const prompt = rawPrompt
    setError(null)
    setIsDecomposing(true)
    // Switch to canvas tab AFTER setting decomposing flag
    // Use setTimeout to ensure state is committed before tab switch
    setTimeout(() => setActiveTab('canvas'), 0)
    try {
      const { nodes, edges } = await decomposePrompt(prompt)
      setNodes(nodes)
      setEdges(edges)
    } catch (e) {
      // Switch back to input tab to show the error
      setActiveTab('input')
      const errType = classifyError(e)
      setError(t.errors[errType])
      console.error(e)
    } finally {
      setIsDecomposing(false)
    }
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setRawPrompt(rawPrompt ? rawPrompt + '\n' + text : text)
        textareaRef.current?.focus()
      }
    } catch {
      // Fallback: focus textarea so user can Ctrl+V
      textareaRef.current?.focus()
    }
  }

  return (
    <div className="prompt-input-panel">
      <h2 className="panel-title">{t.promptInput.title}</h2>
      <div className="textarea-wrap">
        <textarea
          ref={textareaRef}
          className="prompt-textarea"
          value={rawPrompt}
          onChange={(e) => setRawPrompt(e.target.value)}
          placeholder={t.promptInput.placeholder}
          rows={5}
        />
        <button
          className="btn-paste"
          onClick={handlePaste}
          title={t.promptInput.paste}
          type="button"
        >
          <ClipboardPaste size={14} />
        </button>
      </div>
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
