import { useState } from 'react'
import { Clipboard, ClipboardCheck, FileText, Braces, Sparkles, Play, Loader, Share2 } from 'lucide-react'
import { useFlowStore } from '@/store/flowStore'
import { compilePrompt, classifyError } from '@/services/api'
import { useLocale } from '@/i18n/LocaleContext'
import { analytics } from '@/lib/analytics'

const PromptOutput = () => {
  const { nodes, edges, compiledPrompt, setCompiledPrompt, setIsCompiling, isCompiling } = useFlowStore()
  const { t } = useLocale()
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCompile = async () => {
    if (nodes.length === 0) return
    setIsCompiling(true)
    setError(null)
    analytics.compileClicked()
    try {
      const blocks = nodes.map((n) => n.data)
      const result = await compilePrompt(blocks)
      setCompiledPrompt(result)
      analytics.compileCompleted(result.tokenEstimate)
    } catch (e) {
      console.error(e)
      const errType = classifyError(e)
      setError(t.errors[errType])
      analytics.error('compile', errType)
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
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'flompt-prompt.txt'; a.click()
    URL.revokeObjectURL(url)
    analytics.promptExported('txt')
  }

  const handleExportJSON = () => {
    const data = { nodes, edges, compiledPrompt, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'flompt-session.json'; a.click()
    URL.revokeObjectURL(url)
    analytics.promptExported('json')
  }

  const handleShare = async () => {
    const shareData = {
      title: 'flompt — Visual AI Prompt Builder',
      text: 'Check out flompt! Turn any AI prompt into a visual flow. Free & open-source.',
      url: 'https://flompt.dev',
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

      {isCompiling ? (
        <div className="compile-loading">
          <div className="compile-loading-icon">
            <Sparkles size={32} className="compile-sparkle" />
          </div>
          <p className="compile-loading-text">{t.promptOutput.compiling}</p>
          <div className="compile-loading-dots">
            <span className="compile-dot" style={{ animationDelay: '0s' }} />
            <span className="compile-dot" style={{ animationDelay: '0.2s' }} />
            <span className="compile-dot" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      ) : compiledPrompt ? (
        <>
          <pre className="compiled-output">{compiledPrompt.raw}</pre>
          <div className="export-actions">
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

      {error && <p className="error-msg">{error}</p>}

      <button
        className="btn btn-primary"
        onClick={handleCompile}
        disabled={isCompiling || nodes.length === 0}
        data-tour="compile-btn"
      >
        {isCompiling
          ? <><Loader size={14} className="icon-spin" /> {t.promptOutput.compiling}</>
          : <><Play size={14} /> {t.promptOutput.compile}</>
        }
      </button>

      {/* Share CTA */}
      <button className="btn btn-secondary btn-share" onClick={handleShare}>
        <Share2 size={13} /> {t.promptOutput.share}
      </button>
    </div>
  )
}

export default PromptOutput
