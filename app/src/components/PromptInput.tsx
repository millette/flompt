import { useState, useRef, useEffect } from 'react'
import { Zap, Loader, ClipboardPaste } from 'lucide-react'
import { useFlowStore } from '@/store/flowStore'
import { decomposePrompt, classifyError } from '@/services/api'
import { assemblePrompt } from '@/lib/assemblePrompt'
import { useLocale } from '@/i18n/LocaleContext'
import { analytics } from '@/lib/analytics'

const PromptInput = () => {
  const {
    rawPrompt, setRawPrompt,
    setNodes, setEdges,
    setIsDecomposing, isDecomposing,
    setActiveTab,
    setCompiledPrompt,
  } = useFlowStore()
  const { t } = useLocale()
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── Sync bidirectionnelle : plateforme → app (mode extension uniquement) ──
  useEffect(() => {
    const isExt = new URLSearchParams(window.location.search).get('extension') === '1'
    if (!isExt) return

    const handler = (event: MessageEvent) => {
      if (event.data?.type !== 'FLOMPT_PLATFORM_INPUT') return
      const text = event.data.text as string
      if (typeof text !== 'string') return
      // Toujours mettre à jour depuis la plateforme — elle est source de vérité
      setRawPrompt(text)
    }

    window.addEventListener('message', handler)

    // Demander la valeur initiale au content script dès le montage
    window.parent.postMessage({ type: 'FLOMPT_SYNC_REQUEST' }, '*')

    return () => window.removeEventListener('message', handler)
  }, [setRawPrompt])

  const handleDecompose = async () => {
    if (!rawPrompt.trim()) return
    const prompt = rawPrompt
    setError(null)
    setIsDecomposing(true)
    analytics.decomposeClicked()
    setTimeout(() => setActiveTab('canvas'), 0)
    try {
      const { nodes, edges } = await decomposePrompt(prompt)
      setNodes(nodes)
      setEdges(edges)
      analytics.decomposeCompleted(nodes.length)

      // Auto-compile local immédiatement → output prêt dès que l'user switche
      const compiled = assemblePrompt(nodes, edges)
      setCompiledPrompt(compiled)
      analytics.compileCompleted(compiled.tokenEstimate)
    } catch (e) {
      setActiveTab('input')
      const errType = classifyError(e)
      setError(t.errors[errType])
      analytics.error('decompose', errType)
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
        {!rawPrompt && (
          <button
            className="btn-paste"
            onClick={handlePaste}
            title={t.promptInput.paste}
            type="button"
          >
            <ClipboardPaste size={14} />
          </button>
        )}
      </div>
      {error && <p className="error-msg">{error}</p>}
      <button
        className="btn btn-primary"
        onClick={handleDecompose}
        disabled={isDecomposing || !rawPrompt.trim()}
        data-tour="decompose-btn"
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
