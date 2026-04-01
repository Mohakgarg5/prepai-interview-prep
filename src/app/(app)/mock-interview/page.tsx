'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Play, History, Clock, Building2 } from 'lucide-react'

const CATEGORIES = [
  { value: 'PRODUCT_SENSE', label: 'Product Sense', description: 'Design, user empathy, product thinking', icon: '🎯' },
  { value: 'EXECUTION', label: 'Execution', description: 'Metrics, prioritization, trade-offs', icon: '⚡' },
  { value: 'STRATEGY', label: 'Strategy', description: 'Market analysis, roadmap, competition', icon: '🗺️' },
  { value: 'BEHAVIORAL', label: 'Behavioral', description: 'Leadership, conflict, teamwork stories', icon: '🤝' },
  { value: 'ESTIMATION', label: 'Estimation', description: 'Market sizing, back-of-envelope', icon: '📊' },
  { value: 'METRICS', label: 'Metrics', description: 'Success metrics, KPIs, North Star', icon: '📈' },
  { value: 'PRODUCT_DESIGN', label: 'Product Design', description: 'UX, feature design, user flows', icon: '✏️' },
  { value: 'TECHNICAL_AI', label: 'Technical/AI', description: 'AI/ML concepts, system design', icon: '🤖' },
  { value: 'ML_SYSTEM_DESIGN', label: 'ML System Design', description: 'ML pipelines, model architecture', icon: '⚙️' },
  { value: 'AI_ETHICS', label: 'AI Ethics', description: 'Fairness, safety, responsible AI', icon: '⚖️' },
] as const

const DIFFICULTIES = [
  { value: 'EASY', label: 'Easy', description: 'Foundational concepts', color: 'border-emerald-700 bg-emerald-900/30 text-emerald-300', activeRing: 'ring-emerald-600' },
  { value: 'MEDIUM', label: 'Medium', description: 'Realistic scenarios', color: 'border-amber-700 bg-amber-900/30 text-amber-300', activeRing: 'ring-amber-600' },
  { value: 'HARD', label: 'Hard', description: 'Tough follow-ups', color: 'border-orange-700 bg-orange-900/30 text-orange-300', activeRing: 'ring-orange-600' },
  { value: 'FAANG_LEVEL', label: 'FAANG Level', description: 'Top-tier intensity', color: 'border-red-700 bg-red-900/30 text-red-300', activeRing: 'ring-red-600' },
] as const

const TIME_LIMITS = [
  { value: '15', label: '15 min' },
  { value: '20', label: '20 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '60 min' },
]

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-red-400'
}

const CATEGORY_LABELS: Record<string, string> = {
  PRODUCT_SENSE: 'Product Sense',
  EXECUTION: 'Execution',
  STRATEGY: 'Strategy',
  BEHAVIORAL: 'Behavioral',
  ESTIMATION: 'Estimation',
  TECHNICAL_AI: 'Technical/AI',
  ML_SYSTEM_DESIGN: 'ML System Design',
  AI_ETHICS: 'AI Ethics',
  METRICS: 'Metrics',
  PRODUCT_DESIGN: 'Product Design',
}

interface RecentSession {
  id: string
  category: string
  difficulty: string
  overallScore: number | null
  createdAt: string
  companyContext: string | null
}

// This page is a client component that fetches recent sessions via an inline server action pattern.
// The actual data fetching happens in a separate RSC wrapper that passes props.
// For simplicity, we render this as a client page that loads recent sessions on mount.

export default function MockInterviewPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('MEDIUM')
  const [companyContext, setCompanyContext] = useState('')
  const [timedMode, setTimedMode] = useState(false)
  const [timeLimit, setTimeLimit] = useState('30')
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState('')
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])
  const [loadedSessions, setLoadedSessions] = useState(false)

  // Load recent sessions on mount
  useState(() => {
    fetch('/api/ai/mock/recent')
      .then((r) => r.json())
      .then((data: { sessions: RecentSession[] }) => {
        setRecentSessions(data.sessions ?? [])
        setLoadedSessions(true)
      })
      .catch(() => setLoadedSessions(true))
  })

  const handleStart = async () => {
    if (!selectedCategory) {
      setError('Please select an interview category.')
      return
    }
    setError('')
    setIsStarting(true)

    try {
      const response = await fetch('/api/ai/mock/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          difficulty: selectedDifficulty,
          companyContext: companyContext.trim() || undefined,
          timedMode,
          timeLimitMinutes: timedMode ? parseInt(timeLimit, 10) : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json() as { error?: string }
        throw new Error(data.error ?? 'Failed to start interview')
      }

      const { sessionId } = await response.json() as { sessionId: string }
      router.push(`/mock-interview/session/${sessionId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setIsStarting(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mock Interview</h1>
          <p className="text-slate-400 text-sm mt-1">
            Practice with an AI interviewer. Get real-time feedback and scoring.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/mock-interview/history')}
          className="border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent flex items-center gap-2"
        >
          <History className="w-4 h-4" />
          History
        </Button>
      </div>

      {/* Recent Sessions */}
      {loadedSessions && recentSessions.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recent Sessions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recentSessions.slice(0, 3).map((s) => (
              <button
                key={s.id}
                onClick={() => router.push(`/mock-interview/session/${s.id}`)}
                className="bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-lg px-4 py-3 text-left transition-colors group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-400 font-medium">
                    {CATEGORY_LABELS[s.category] ?? s.category}
                  </span>
                  {s.overallScore !== null && (
                    <span className={`text-sm font-bold ${scoreColor(s.overallScore)}`}>
                      {Math.round(s.overallScore)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs border-slate-600 text-slate-400 bg-slate-900/50 py-0"
                  >
                    {s.difficulty.replace(/_/g, ' ')}
                  </Badge>
                  {s.companyContext && (
                    <span className="text-xs text-slate-500 truncate">{s.companyContext}</span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1.5">
                  {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(s.createdAt))}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Configuration */}
      <div className="space-y-6">
        {/* Category */}
        <div className="space-y-3">
          <Label className="text-slate-200 text-sm font-semibold">
            Interview Category <span className="text-red-400">*</span>
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.value
              return (
                <button
                  key={cat.value}
                  onClick={() => {
                    setSelectedCategory(cat.value)
                    setError('')
                  }}
                  className={`relative flex flex-col items-start gap-1.5 px-3 py-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-900/30 ring-1 ring-blue-600'
                      : 'border-slate-700 bg-slate-900 hover:border-slate-600 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-lg leading-none">{cat.icon}</span>
                  <span className={`text-xs font-semibold leading-snug ${isSelected ? 'text-blue-300' : 'text-slate-300'}`}>
                    {cat.label}
                  </span>
                  <span className="text-xs text-slate-500 leading-snug hidden sm:block">
                    {cat.description}
                  </span>
                </button>
              )
            })}
          </div>
          {error && !selectedCategory && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>

        {/* Difficulty */}
        <div className="space-y-3">
          <Label className="text-slate-200 text-sm font-semibold">Difficulty</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DIFFICULTIES.map((d) => {
              const isSelected = selectedDifficulty === d.value
              return (
                <button
                  key={d.value}
                  onClick={() => setSelectedDifficulty(d.value)}
                  className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? `${d.color} ring-1 ${d.activeRing}`
                      : 'border-slate-700 bg-slate-900 hover:border-slate-600 hover:bg-slate-800/60 text-slate-400'
                  }`}
                >
                  <span className={`text-sm font-semibold ${isSelected ? '' : 'text-slate-300'}`}>
                    {d.label}
                  </span>
                  <span className="text-xs opacity-75">{d.description}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Optional settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Company context */}
          <div className="space-y-2">
            <Label htmlFor="company" className="text-slate-300 text-sm font-medium flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              Company Context
              <span className="text-slate-600 font-normal">(optional)</span>
            </Label>
            <Input
              id="company"
              value={companyContext}
              onChange={(e) => setCompanyContext(e.target.value)}
              placeholder="e.g. Google, Meta, Stripe…"
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-600"
            />
            <p className="text-xs text-slate-600">
              Tailors questions and style to the company&apos;s PM culture.
            </p>
          </div>

          {/* Timed mode */}
          <div className="space-y-2">
            <Label className="text-slate-300 text-sm font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Timed Mode
            </Label>
            <div className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300">Enable timer</p>
                <p className="text-xs text-slate-600">Auto-ends when time is up</p>
              </div>
              <Switch
                checked={timedMode}
                onCheckedChange={setTimedMode}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
            {timedMode && (
              <Select value={timeLimit} onValueChange={setTimeLimit}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-300 focus:ring-blue-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {TIME_LIMITS.map((t) => (
                    <SelectItem
                      key={t.value}
                      value={t.value}
                      className="text-slate-300 focus:bg-slate-800 focus:text-white"
                    >
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Error */}
        {error && selectedCategory && (
          <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        {/* Start button */}
        <div className="flex items-center justify-end pt-2">
          <Button
            onClick={handleStart}
            disabled={isStarting || !selectedCategory}
            size="lg"
            className="bg-blue-700 hover:bg-blue-600 text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting interview…
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Interview
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
