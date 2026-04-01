'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layers, ChevronRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const ROLES = [
  { value: 'GENERAL_PM', label: 'General PM', desc: 'Product Manager at a tech company' },
  { value: 'AI_PM', label: 'AI / ML PM', desc: 'PM for AI-powered products' },
  { value: 'TECHNICAL_PM', label: 'Technical PM', desc: 'Engineering background, technical depth' },
  { value: 'GROWTH_PM', label: 'Growth PM', desc: 'Focused on user acquisition & retention' },
]

const EXPERIENCE_LEVELS = [
  { value: 'NEW_GRAD', label: 'New Grad', desc: '0–1 years' },
  { value: 'JUNIOR', label: 'Junior PM', desc: '1–3 years' },
  { value: 'MID', label: 'Mid-level PM', desc: '3–6 years' },
  { value: 'SENIOR', label: 'Senior PM', desc: '6+ years' },
]

const WEAK_AREAS = [
  'PRODUCT_SENSE', 'EXECUTION', 'STRATEGY', 'BEHAVIORAL',
  'ESTIMATION', 'METRICS', 'TECHNICAL_AI', 'PRODUCT_DESIGN',
]

const AREA_LABELS: Record<string, string> = {
  PRODUCT_SENSE: 'Product Sense', EXECUTION: 'Execution', STRATEGY: 'Strategy',
  BEHAVIORAL: 'Behavioral', ESTIMATION: 'Estimation', METRICS: 'Metrics',
  TECHNICAL_AI: 'AI / Technical', PRODUCT_DESIGN: 'Product Design',
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    targetRole: 'GENERAL_PM',
    experienceLevel: 'MID',
    weakAreas: [] as string[],
    interviewTimeline: '',
  })

  const toggleWeakArea = (area: string) => {
    setForm(f => ({
      ...f,
      weakAreas: f.weakAreas.includes(area)
        ? f.weakAreas.filter(a => a !== area)
        : [...f.weakAreas, area],
    }))
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } catch {
      // non-blocking
    }
    router.push('/dashboard')
  }

  const steps = [
    {
      title: "What's your target role?",
      subtitle: 'This helps us tailor interview questions to your track.',
      content: (
        <div className="space-y-3">
          {ROLES.map(r => (
            <button
              key={r.value}
              onClick={() => setForm(f => ({ ...f, targetRole: r.value }))}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                form.targetRole === r.value
                  ? 'border-blue-600 bg-blue-600/10 text-white'
                  : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500'
              }`}
            >
              <div className="font-medium">{r.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{r.desc}</div>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Your experience level?',
      subtitle: 'We calibrate question difficulty to match your seniority.',
      content: (
        <div className="space-y-3">
          {EXPERIENCE_LEVELS.map(e => (
            <button
              key={e.value}
              onClick={() => setForm(f => ({ ...f, experienceLevel: e.value }))}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                form.experienceLevel === e.value
                  ? 'border-blue-600 bg-blue-600/10 text-white'
                  : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500'
              }`}
            >
              <div className="font-medium">{e.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{e.desc}</div>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Which areas feel weakest?',
      subtitle: 'Select all that apply — we\'ll focus your practice here.',
      content: (
        <div className="grid grid-cols-2 gap-2">
          {WEAK_AREAS.map(area => {
            const selected = form.weakAreas.includes(area)
            return (
              <button
                key={area}
                onClick={() => toggleWeakArea(area)}
                className={`p-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${
                  selected
                    ? 'border-blue-600 bg-blue-600/10 text-white'
                    : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500'
                }`}
              >
                {selected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                <span>{AREA_LABELS[area]}</span>
              </button>
            )
          })}
        </div>
      ),
    },
    {
      title: 'When is your interview?',
      subtitle: 'Optional — helps us pace your prep schedule.',
      content: (
        <div className="space-y-4">
          <Input
            type="date"
            value={form.interviewTimeline}
            onChange={e => setForm(f => ({ ...f, interviewTimeline: e.target.value }))}
            className="bg-slate-800 border-slate-700 text-white h-12 text-base"
            min={new Date().toISOString().split('T')[0]}
          />
          <p className="text-slate-500 text-sm text-center">You can skip this and set it later in Settings.</p>
        </div>
      ),
    },
  ]

  const currentStep = steps[step]
  const isLast = step === steps.length - 1

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-blue-800 flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-white">PrepAI</span>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i <= step ? 'bg-blue-600' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-white mb-1">{currentStep.title}</h1>
            <p className="text-slate-400 text-sm">{currentStep.subtitle}</p>
          </div>

          {currentStep.content}

          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <Button
                variant="ghost"
                onClick={() => setStep(s => s - 1)}
                className="text-slate-400 hover:text-white"
              >
                Back
              </Button>
            )}
            <Button
              onClick={isLast ? handleFinish : () => setStep(s => s + 1)}
              disabled={saving}
              className="flex-1 bg-blue-700 hover:bg-blue-600 h-11"
            >
              {saving ? 'Setting up...' : isLast ? 'Start Prepping →' : (
                <span className="flex items-center gap-2">Continue <ChevronRight className="w-4 h-4" /></span>
              )}
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">Step {step + 1} of {steps.length}</p>
      </div>
    </div>
  )
}
