import { useFlowStore } from '@/store/flowStore'
import { decomposePrompt } from '@/services/api'
import { useLocale } from '@/i18n/LocaleContext'

const TOUR_KEY = 'flompt-onboarded'

interface Props {
  onDone: () => void
}

const STEPS = [
  { color: '#c084fc' },
  { color: '#fbbf24' },
  { color: '#FF3570' },
] as const

const OnboardingCanvas = ({ onDone }: Props) => {
  const { setRawPrompt, setNodes, setEdges, setIsDecomposing, setActiveTab } = useFlowStore()
  const { t } = useLocale()

  const dismiss = () => {
    localStorage.setItem(TOUR_KEY, '1')
    onDone()
  }

  const goScratch = () => {
    setActiveTab('input')
    dismiss()
  }

  const tryExample = async () => {
    const sample = t.onboarding.samplePrompt
    setRawPrompt(sample)
    dismiss()
    setIsDecomposing(true)
    try {
      const { nodes, edges } = await decomposePrompt(sample)
      setNodes(nodes)
      setEdges(edges)
    } catch {
      // API unavailable — fall back to input panel with pre-filled prompt
      setActiveTab('input')
    } finally {
      setIsDecomposing(false)
    }
  }

  const steps = [
    { title: t.onboarding.step1title, desc: t.onboarding.step1desc },
    { title: t.onboarding.step2title, desc: t.onboarding.step2desc },
    { title: t.onboarding.step3title, desc: t.onboarding.step3desc },
  ]

  return (
    <div className="onboarding-wrap">
      <div className="onboarding-card">

        <div className="onboarding-header">
          <span className="onboarding-logo">flompt</span>
          <h2 className="onboarding-heading">{t.onboarding.heading}</h2>
          <p className="onboarding-tagline">{t.onboarding.tagline}</p>
        </div>

        <div className="onboarding-steps">
          {steps.map((s, i) => (
            <div key={i} className="onboarding-step">
              <div
                className="onboarding-step-num"
                style={{ color: STEPS[i].color, borderColor: STEPS[i].color + '50' }}
              >
                {i + 1}
              </div>
              <div className="onboarding-step-body">
                <p className="onboarding-step-title">{s.title}</p>
                <p className="onboarding-step-desc">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="onboarding-actions">
          <button className="onboarding-cta" onClick={tryExample}>
            {t.onboarding.tryExample}
          </button>
          <button className="onboarding-skip" onClick={goScratch}>
            {t.onboarding.skip}
          </button>
        </div>

      </div>
    </div>
  )
}

export default OnboardingCanvas
