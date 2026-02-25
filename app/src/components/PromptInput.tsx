import { useState, useRef, useEffect } from 'react'
import { Zap, Loader, ClipboardPaste, Download } from 'lucide-react'
import { useFlowStore } from '@/store/flowStore'
import { decomposePrompt, classifyError } from '@/services/api'
import { useLocale } from '@/i18n/LocaleContext'
import { analytics } from '@/lib/analytics'

const isExt = new URLSearchParams(window.location.search).get('extension') === '1'

const PromptInput = () => {
  const {
    rawPrompt, setRawPrompt,
    setNodes, setEdges,
    setIsDecomposing, isDecomposing,
    setActiveTab,
  } = useFlowStore()
  const { t } = useLocale()
  const [error, setError] = useState<string | null>(null)
  const [platformName, setPlatformName] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── Réception de l'import depuis la plateforme (mode extension uniquement) ──
  useEffect(() => {
    if (!isExt) return

    const handler = (event: MessageEvent) => {
      // Nom de la plateforme envoyé au chargement → label du bouton immédiat
      if (event.data?.type === 'FLOMPT_PLATFORM_INFO') {
        const platform = event.data.platform as string
        if (platform && platform !== 'Unknown') setPlatformName(platform)
        return
      }
      if (event.data?.type !== 'FLOMPT_PLATFORM_INPUT') return
      const text = event.data.text as string
      const platform = event.data.platform as string
      if (typeof text !== 'string') return
      setRawPrompt(text)
      if (platform && platform !== 'Unknown') setPlatformName(platform)
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [setRawPrompt])

  /** Demande le prompt actuel à la plateforme — déclenché par le bouton */
  const handleImportFromPlatform = () => {
    window.parent.postMessage({ type: 'FLOMPT_SYNC_REQUEST' }, '*')
  }

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
      textareaRef.current?.focus()
    }
  }

  return (
    <div className="prompt-input-panel">
      <h2 className="panel-title">{t.promptInput.title}</h2>

      {/* Bouton import plateforme — visible uniquement dans l'extension */}
      {isExt && (
        <button
          className="btn btn-secondary btn-import-platform"
          onClick={handleImportFromPlatform}
          type="button"
        >
          <Download size={13} />
          {platformName
            ? `Import from ${platformName}`
            : t.promptInput.importFromPlatform
          }
        </button>
      )}

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
