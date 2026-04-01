'use client'

import { useState } from 'react'
import { Package, ChevronDown, ChevronRight, Lightbulb, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type TeardownMode = 'IMPROVE_FEATURE' | 'DEFINE_NORTH_STAR' | 'PRIORITIZE_ROADMAP' | 'DESIGN_V2' | 'COMPETITIVE_ANALYSIS' | 'DEFINE_METRICS'

const MODE_CONFIG: Record<TeardownMode, { label: string; desc: string; icon: string }> = {
  IMPROVE_FEATURE: { label: 'Improve a Feature', desc: 'Identify and enhance a weak feature', icon: '🔧' },
  DEFINE_NORTH_STAR: { label: 'North Star Metric', desc: 'Define the single most important metric', icon: '⭐' },
  PRIORITIZE_ROADMAP: { label: 'Prioritize Roadmap', desc: 'Order features by impact vs effort', icon: '📋' },
  DESIGN_V2: { label: 'Design V2', desc: 'Reimagine the product from scratch', icon: '✨' },
  COMPETITIVE_ANALYSIS: { label: 'Competitive Analysis', desc: 'Analyze vs competitors', icon: '🏆' },
  DEFINE_METRICS: { label: 'Define Metrics', desc: 'Build a full metrics framework', icon: '📊' },
}

const SUGGESTED_PRODUCTS = ['Spotify', 'Airbnb', 'Slack', 'Notion', 'LinkedIn', 'Instagram', 'Uber', 'DoorDash', 'Duolingo', 'Discord']

interface Attempt {
  id: string
  productName: string
  mode: TeardownMode
  score: number | null
  createdAt: string
}

interface Challenge {
  prompt: string
  hints: string[]
  evaluationCriteria: string[]
}

interface ScoreResult {
  scores: { structure: number; insight: number; feasibility: number; creativity: number }
  strengths: string[]
  improvements: string[]
  sampleAnswer: string
}

export function TeardownArena({ recentAttempts }: { recentAttempts: Attempt[] }) {
  const [product, setProduct] = useState('')
  const [mode, setMode] = useState<TeardownMode>('IMPROVE_FEATURE')
  const [generating, setGenerating] = useState(false)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [response, setResponse] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<ScoreResult | null>(null)
  const [showHints, setShowHints] = useState(false)

  const generateChallenge = async () => {
    if (!product.trim()) return toast.error('Enter a product name')
    setGenerating(true)
    setChallenge(null)
    setResult(null)
    setResponse('')
    try {
      const res = await fetch('/api/teardown/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: product, mode }),
      })
      const data = await res.json()
      setChallenge(data)
    } catch {
      toast.error('Failed to generate challenge')
    } finally {
      setGenerating(false)
    }
  }

  const submitResponse = async () => {
    if (!response.trim()) return toast.error('Write your analysis first')
    if (!challenge) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/teardown/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: product, mode, challengePrompt: challenge.prompt, response }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      toast.error('Failed to evaluate response')
    } finally {
      setSubmitting(false)
    }
  }

  const avgScore = result ? Math.round(Object.values(result.scores).reduce((a, b) => a + b, 0) / 4) : null

  return (
    <div className="space-y-8">
      {/* Setup */}
      {!result && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Product</label>
            <div className="space-y-2">
              <Input
                value={product}
                onChange={e => setProduct(e.target.value)}
                placeholder="e.g. Spotify, Airbnb, Notion..."
                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_PRODUCTS.map(p => (
                  <button key={p} onClick={() => setProduct(p)} className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors">{p}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Challenge Mode</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {(Object.keys(MODE_CONFIG) as TeardownMode[]).map(m => {
                const cfg = MODE_CONFIG[m]
                return (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn('text-left p-3 rounded-xl border transition-all', mode === m ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300')}
                  >
                    <div className="text-lg mb-1">{cfg.icon}</div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{cfg.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{cfg.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          <Button onClick={generateChallenge} disabled={generating} className="w-full bg-blue-700 hover:bg-blue-600 h-11">
            {generating ? 'Generating Challenge...' : 'Generate Challenge'}
          </Button>
        </div>
      )}

      {/* Challenge */}
      {challenge && !result && (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-amber-900 dark:text-amber-300">Your Challenge</h3>
              <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full ml-auto">{product} · {MODE_CONFIG[mode].label}</span>
            </div>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{challenge.prompt}</p>

            {challenge.evaluationCriteria.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Evaluation Criteria</p>
                <ul className="space-y-1">
                  {challenge.evaluationCriteria.map((c, i) => (
                    <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex gap-2"><span className="text-amber-500">·</span>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {challenge.hints.length > 0 && (
              <button onClick={() => setShowHints(!showHints)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <Lightbulb className="w-4 h-4" />
                {showHints ? 'Hide hints' : 'Show hints'}
                {showHints ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
            )}
            {showHints && (
              <ul className="space-y-1 bg-white dark:bg-slate-800 rounded-xl p-4">
                {challenge.hints.map((h, i) => <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex gap-2"><span className="text-slate-400">{i + 1}.</span>{h}</li>)}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Your Analysis</label>
            <Textarea
              value={response}
              onChange={e => setResponse(e.target.value)}
              placeholder="Structure your response clearly. Think about frameworks, user impact, and measurable outcomes..."
              rows={10}
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 resize-none text-sm leading-relaxed"
            />
            <p className="text-xs text-slate-400">{response.length} characters</p>
          </div>

          <div className="flex gap-3">
            <Button onClick={submitResponse} disabled={submitting || !response.trim()} className="bg-blue-700 hover:bg-blue-600 h-11 flex-1">
              {submitting ? 'Evaluating...' : 'Submit & Evaluate'}
            </Button>
            <Button onClick={() => { setChallenge(null); setResult(null) }} variant="ghost" className="border border-slate-200 dark:border-slate-700">
              New Challenge
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Evaluation Results</h3>
              <div className={cn('text-2xl font-bold', avgScore! >= 80 ? 'text-emerald-500' : avgScore! >= 60 ? 'text-amber-500' : 'text-red-500')}>
                {avgScore}/100
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {Object.entries(result.scores).map(([key, val]) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize text-slate-600 dark:text-slate-400">{key}</span>
                    <span className={cn('font-medium', val >= 80 ? 'text-emerald-500' : val >= 60 ? 'text-amber-500' : 'text-red-500')}>{val}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', val >= 80 ? 'bg-emerald-500' : val >= 60 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${val}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Strengths</h4>
                <ul className="space-y-1">
                  {result.strengths.map((s, i) => <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex gap-2"><span className="text-emerald-500">✓</span>{s}</li>)}
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-amber-600 dark:text-amber-400">Improvements</h4>
                <ul className="space-y-1">
                  {result.improvements.map((s, i) => <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex gap-2"><span className="text-amber-500">→</span>{s}</li>)}
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400">Sample Strong Answer</h4>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{result.sampleAnswer}</div>
            </div>
          </div>

          <Button onClick={() => { setChallenge(null); setResult(null); setResponse('') }} className="w-full bg-blue-700 hover:bg-blue-600">
            Try Another Challenge
          </Button>
        </div>
      )}

      {/* History */}
      {recentAttempts.length > 0 && !challenge && !result && (
        <div className="space-y-3">
          <h2 className="font-semibold text-slate-900 dark:text-white text-sm uppercase tracking-wide text-slate-400">Recent Attempts</h2>
          <div className="space-y-2">
            {recentAttempts.map(a => (
              <div key={a.id} className="flex items-center justify-between py-3 px-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{a.productName}</span>
                  <span className="text-slate-400 mx-2">·</span>
                  <span className="text-slate-500 text-sm">{MODE_CONFIG[a.mode]?.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  {a.score && (
                    <span className={cn('text-sm font-medium', a.score >= 80 ? 'text-emerald-500' : a.score >= 60 ? 'text-amber-500' : 'text-red-500')}>
                      {Math.round(a.score)}/100
                    </span>
                  )}
                  <span className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
