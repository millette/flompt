import { useState, useEffect, useCallback } from 'react'
import { ChevronRight, Check, Loader } from 'lucide-react'
import { useFlowStore } from '@/store/flowStore'
import { useLocale } from '@/i18n/LocaleContext'
import { analytics } from '@/lib/analytics'
import type { FlomptNode, FlomptEdge } from '@/types/blocks'

const TOUR_KEY = 'flompt-onboarded'
const TW = 280 // tooltip width
const TH = 220 // estimated tooltip height

type Placement = 'right' | 'left' | 'top' | 'bottom' | 'inside-top'

interface Rect { top: number; left: number; width: number; height: number }

const calcTooltipPos = (r: Rect, p: Placement): { top: number; left: number } => {
  const gap = 18
  switch (p) {
    case 'right':      return { top: r.top + r.height / 2 - TH / 2, left: r.left + r.width + gap }
    case 'left':       return { top: r.top + r.height / 2 - TH / 2, left: r.left - TW - gap }
    case 'top':        return { top: r.top - TH - gap,               left: r.left + r.width / 2 - TW / 2 }
    case 'bottom':     return { top: r.top + r.height + gap,         left: r.left + r.width / 2 - TW / 2 }
    case 'inside-top': return { top: r.top + 24,                     left: r.left + r.width / 2 - TW / 2 }
  }
}

// ── Hardcoded example — no API call needed ───────────────────────────────────

const EXAMPLE_NODES_EN: FlomptNode[] = [
  { id: 'tour-role',    type: 'block', position: { x: 60,  y: 40  }, data: { type: 'role',          label: 'Role',          description: "Defines the AI's persona / role",    content: 'You are a senior Python developer.' } },
  { id: 'tour-obj',     type: 'block', position: { x: 60,  y: 210 }, data: { type: 'objective',     label: 'Objective',     description: 'What we want to accomplish',          content: 'Review the following code for bugs, performance issues, and style violations.' } },
  { id: 'tour-cst',     type: 'block', position: { x: 60,  y: 380 }, data: { type: 'constraints',   label: 'Constraints',   description: 'Rules and limits to respect',         content: 'Be concise, prioritize critical issues, and explain each finding in one sentence.' } },
  { id: 'tour-out',     type: 'block', position: { x: 60,  y: 550 }, data: { type: 'output_format', label: 'Output Format', description: 'Expected format of the response',     content: 'Respond with a numbered list.' } },
]

const EXAMPLE_NODES_FR: FlomptNode[] = [
  { id: 'tour-role',    type: 'block', position: { x: 60,  y: 40  }, data: { type: 'role',          label: 'Rôle',          description: "Définit la persona / le rôle de l'IA", content: 'Tu es un développeur Python senior.' } },
  { id: 'tour-obj',     type: 'block', position: { x: 60,  y: 210 }, data: { type: 'objective',     label: 'Objectif',      description: "Ce qu'on veut accomplir",              content: 'Fais une revue du code suivant : identifie les bugs, les problèmes de performance et les violations de style.' } },
  { id: 'tour-cst',     type: 'block', position: { x: 60,  y: 380 }, data: { type: 'constraints',   label: 'Contraintes',   description: 'Règles et limites à respecter',        content: 'Sois concis, priorise les problèmes critiques, et explique chaque point en une phrase.' } },
  { id: 'tour-out',     type: 'block', position: { x: 60,  y: 550 }, data: { type: 'output_format', label: 'Sortie',        description: 'Format attendu de la réponse',         content: 'Réponds avec une liste numérotée.' } },
]

const EXAMPLE_EDGES: FlomptEdge[] = [
  { id: 'tour-e1', source: 'tour-role', target: 'tour-obj',  animated: true },
  { id: 'tour-e2', source: 'tour-obj',  target: 'tour-cst',  animated: true },
  { id: 'tour-e3', source: 'tour-cst',  target: 'tour-out',  animated: true },
]

// ── Component ────────────────────────────────────────────────────────────────

const GuidedTour = () => {
  const { t, locale } = useLocale()
  const { setRawPrompt, setNodes, setEdges } = useFlowStore()

  const [active, setActive] = useState(() =>
    typeof window !== 'undefined' &&
    window.innerWidth >= 900 &&
    !localStorage.getItem(TOUR_KEY)
  )

  const [step, setStep]     = useState(0)
  const [rect, setRect]     = useState<Rect | null>(null)
  const [acting, setActing] = useState(false)

  // Step definitions
  const steps = [
    { target: '.prompt-textarea',            placement: 'right' as Placement,      title: t.tour.step1title,       desc: t.tour.step1desc,       nextLabel: t.tour.next },
    { target: '.block-list',                 placement: 'right' as Placement,      title: t.tour.stepBlocksTitle,  desc: t.tour.stepBlocksDesc,  nextLabel: t.tour.next },
    { target: '[data-tour="decompose-btn"]', placement: 'right' as Placement,      title: t.tour.step2title,       desc: t.tour.step2desc,       nextLabel: t.tour.step2action, action: 'decompose' as const },
    { target: '.flow-canvas',                placement: 'inside-top' as Placement, title: t.tour.step3title,       desc: t.tour.step3desc,       nextLabel: t.tour.next },
    { target: '[data-tour="compile-btn"]',   placement: 'left' as Placement,       title: t.tour.step4title,       desc: t.tour.step4desc,       nextLabel: t.tour.finish, action: 'finish' as const },
  ]

  const cur = steps[step]

  /* ── Sync spotlight rect ─────────────────────────────────────────────────── */
  const updateRect = useCallback(() => {
    const el = document.querySelector(cur.target)
    if (el) {
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
  }, [cur.target])

  useEffect(() => {
    if (!active) return
    if (step === 0) {
      setRawPrompt(t.tour.samplePrompt)
      analytics.tourStarted()
    }
    analytics.tourStep(step + 1, steps[step]?.title ?? '')
    const id = setTimeout(updateRect, 50)
    window.addEventListener('resize', updateRect)
    return () => { clearTimeout(id); window.removeEventListener('resize', updateRect) }
  }, [step, active, updateRect, setRawPrompt, t.tour.samplePrompt])

  /* ── Dismiss ─────────────────────────────────────────────────────────────── */
  const dismiss = useCallback((completed = false) => {
    if (!completed) analytics.tourSkipped(step)
    localStorage.setItem(TOUR_KEY, '1')
    setActive(false)
  }, [step])

  /* ── Next / Action ───────────────────────────────────────────────────────── */
  const handleNext = useCallback(() => {
    if (!cur.action) { setStep(s => s + 1); return }
    if (cur.action === 'finish') { analytics.tourCompleted(); dismiss(true); return }

    if (cur.action === 'decompose') {
      setActing(true)
      // Short fake loading — makes it feel real without an API call
      setTimeout(() => {
        const nodes = locale === 'fr' ? EXAMPLE_NODES_FR : EXAMPLE_NODES_EN
        setNodes(nodes)
        setEdges(EXAMPLE_EDGES)
        setActing(false)
        setStep(s => s + 1) // advance to canvas step
      }, 900)
    }
  }, [cur, dismiss, locale, setNodes, setEdges])

  /* ── Render ──────────────────────────────────────────────────────────────── */
  if (!active || !rect) return null

  const raw   = calcTooltipPos(rect, cur.placement)
  const ttTop  = Math.max(60, raw.top)
  const ttLeft = Math.max(8, Math.min(window.innerWidth - TW - 8, raw.left))
  const isLast = step === steps.length - 1

  return (
    <>
      <div className="tour-backdrop" />

      <div
        className="tour-spotlight"
        style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }}
      />

      <div className="tour-tooltip" style={{ top: ttTop, left: ttLeft }}>

        <div className="tour-progress" role="progressbar" aria-valuenow={step + 1} aria-valuemax={steps.length}>
          {steps.map((_, i) => (
            <div key={i} className={`tour-dot${i === step ? ' active' : i < step ? ' done' : ''}`} />
          ))}
        </div>

        <p className="tour-step-num">
          {t.tour.stepOf.replace('{n}', String(step + 1)).replace('{total}', String(steps.length))}
        </p>

        <h3 className="tour-title">{cur.title}</h3>
        <p className="tour-desc">{cur.desc}</p>

        <div className="tour-actions">
          <button className="tour-skip" onClick={() => dismiss()}>{t.tour.skip}</button>
          <button className="tour-next" onClick={handleNext} disabled={acting}>
            {acting
              ? <><Loader size={13} className="icon-spin" />{t.tour.acting}</>
              : isLast
                ? <>{cur.nextLabel}<Check size={12} /></>
                : <>{cur.nextLabel}<ChevronRight size={13} /></>
            }
          </button>
        </div>

      </div>
    </>
  )
}

export default GuidedTour
