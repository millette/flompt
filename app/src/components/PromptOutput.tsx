import { useState, useCallback } from 'react'
import {
  Clipboard, ClipboardCheck, FileText, Braces,
  Sparkles, Play, Share2, Send, RefreshCw, Wand2, Loader,
} from 'lucide-react'
import { useFlowStore } from '@/store/flowStore'
import { useLocale } from '@/i18n/LocaleContext'
import { analytics } from '@/lib/analytics'
import { assemblePrompt } from '@/lib/assemblePrompt'
import { compilePrompt, classifyError } from '@/services/api'

/** Detect if flompt is running inside the browser extension sidebar */
const isExtension = new URLSearchParams(window.location.search).get('extension') === '1'

// ─── Composant ────────────────────────────────────────────────────────────────

const PromptOutput = () => {
  const {
    nodes, edges,
    compiledPrompt, setCompiledPrompt,
    compiledStale,
    isCompiling, setIsCompiling,
  } = useFlowStore()
  const { t } = useLocale()
  const [copied,       setCopied]       = useState(false)
  const [injected,     setInjected]     = useState(false)
  const [enhanceError, setEnhanceError] = useState<string | null>(null)

  // ── Compile local (instantané) ───────────────────────────────────────────
  const handleCompile = () => {
    if (nodes.length === 0) return
    analytics.compileClicked()
    const result = assemblePrompt(nodes, edges)
    setCompiledPrompt(result)
    analytics.compileCompleted(result.tokenEstimate)
    setEnhanceError(null)
  }

  // ── Enhance with AI (backend /api/compile) ───────────────────────────────
  const handleEnhance = async () => {
    if (nodes.length === 0) return
    setIsCompiling(true)
    setEnhanceError(null)
    analytics.compileClicked()
    try {
      const blocks = nodes.map(n => n.data)
      const result = await compilePrompt(blocks)
      setCompiledPrompt(result)
      analytics.compileCompleted(result.tokenEstimate)
    } catch (e) {
      const errType = classifyError(e)
      setEnhanceError(t.errors[errType])
      analytics.error('enhance', errType)
      console.error(e)
    } finally {
      setIsCompiling(false)
    }
  }

  const handleCopy = () => {
    if (!compiledPrompt) return
    navigator.clipboard.writeText(compiledPrompt.raw).then(() => {
      setCopied(true)
      analytics.promptCopied()
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleExportTxt = () => {
    if (!compiledPrompt) return
    const blob = new Blob([compiledPrompt.raw], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'flompt-prompt.txt'; a.click()
    URL.revokeObjectURL(url)
    analytics.promptExported('txt')
  }

  const handleExportJSON = () => {
    const data = { nodes, edges, compiledPrompt, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'flompt-session.json'; a.click()
    URL.revokeObjectURL(url)
    analytics.promptExported('json')
  }

  /** Envoie le prompt compilé vers le content script de l'extension */
  const handleInjectToAI = useCallback(() => {
    if (!compiledPrompt) return
    window.parent.postMessage({ type: 'FLOMPT_INJECT', prompt: compiledPrompt.raw }, '*')
    setInjected(true)
    analytics.promptCopied()
    setTimeout(() => setInjected(false), 2500)
  }, [compiledPrompt])

  const handleShare = async () => {
    const shareData = {
      title: 'flompt — Visual AI Prompt Builder',
      text:  'Check out flompt! Turn any AI prompt into a visual flow. Free & open-source.',
      url:   'https://flompt.dev',
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch { /* user cancelled */ }
  }

  return (
    <div className="prompt-output-panel">
      <div className="output-header">
        <h2 className="panel-title">{t.promptOutput.title}</h2>
        {compiledPrompt && (
          <span className="token-badge">~{compiledPrompt.tokenEstimate} tokens</span>
        )}
      </div>

      {compiledPrompt ? (
        <>
          {/* Stale indicator — blocs modifiés depuis le dernier compile */}
          {compiledStale && (
            <div className="stale-banner">
              <RefreshCw size={12} />
              <span>{t.promptOutput.outdated}</span>
            </div>
          )}

          <pre className="compiled-output">{compiledPrompt.raw}</pre>

          <div className="export-actions">
            {/* Send to AI — uniquement dans la sidebar extension */}
            {isExtension && (
              <button
                className={`btn btn-primary export-inject${injected ? ' injected' : ''}`}
                onClick={handleInjectToAI}
                title="Inject this prompt into the AI chat input"
              >
                {injected
                  ? <><ClipboardCheck size={13} /> Injected!</>
                  : <><Send size={13} /> Send to AI</>
                }
              </button>
            )}
            <button className="btn btn-secondary export-copy" onClick={handleCopy}>
              {copied
                ? <><ClipboardCheck size={13} /> {t.promptOutput.copied}</>
                : <><Clipboard size={13} /> {t.promptOutput.copy}</>
              }
            </button>
            <div className="export-row2">
              <button className="btn btn-secondary export-btn" onClick={handleExportTxt} title="Export .txt">
                <FileText size={13} /> {t.promptOutput.exportTxt}
              </button>
              <button className="btn btn-secondary export-btn" onClick={handleExportJSON} title="Export .json">
                <Braces size={13} /> {t.promptOutput.exportJson}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="output-placeholder">
          <Sparkles size={28} className="output-placeholder-icon" />
          <span>{t.promptOutput.placeholder.split('\\n').map((line, i) => (
            <span key={i}>{line}{i === 0 && <br />}</span>
          ))}</span>
        </div>
      )}

      {/* Compile local — instantané */}
      <button
        className={`btn btn-primary${compiledStale && compiledPrompt ? ' btn-stale' : ''}`}
        onClick={handleCompile}
        disabled={nodes.length === 0}
        data-tour="compile-btn"
      >
        <Play size={14} />
        {compiledStale && compiledPrompt
          ? <><RefreshCw size={13} className="stale-icon" /> {t.promptOutput.compile}</>
          : t.promptOutput.compile
        }
      </button>

      {/* Enhance with AI — appel backend Claude */}
      <button
        className="btn btn-secondary btn-enhance"
        onClick={handleEnhance}
        disabled={nodes.length === 0 || isCompiling}
        title={t.promptOutput.enhance}
      >
        {isCompiling
          ? <><Loader size={13} className="icon-spin" /> {t.promptOutput.enhancing}</>
          : <><Wand2 size={13} /> {t.promptOutput.enhance}</>
        }
      </button>

      {enhanceError && <p className="error-msg">{enhanceError}</p>}

      <button className="btn btn-secondary btn-share" onClick={handleShare}>
        <Share2 size={13} /> {t.promptOutput.share}
      </button>
    </div>
  )
}

export default PromptOutput
