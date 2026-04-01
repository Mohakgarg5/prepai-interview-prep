'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AIThinking } from '@/components/shared/AIThinking'
import { toast } from 'sonner'
import { Zap, BookOpen, Star, MessageSquare, Lightbulb, TrendingUp } from 'lucide-react'
import type { PanicModeItem } from '@/types'

const ICON_MAP: Record<string, React.ReactNode> = {
  framework: <BookOpen className="w-4 h-4" />,
  story: <Star className="w-4 h-4" />,
  question: <MessageSquare className="w-4 h-4" />,
  tip: <Lightbulb className="w-4 h-4" />,
  talking_point: <TrendingUp className="w-4 h-4" />,
}

const COLOR_MAP: Record<string, string> = {
  framework: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
  story: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200',
  question: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
  tip: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
  talking_point: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200',
}

const LABEL_MAP: Record<string, string> = {
  framework: 'Framework',
  story: 'Story',
  question: 'Likely Q',
  tip: 'Tip',
  talking_point: 'Talking Point',
}

export default function PanicModePage() {
  const [items, setItems] = useState<PanicModeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [company, setCompany] = useState('')
  const [round, setRound] = useState('')

  const generate = async () => {
    setLoading(true)
    setGenerated(false)
    try {
      const res = await fetch('/api/ai/panic-mode/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: company.trim() || undefined,
          round: round.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setItems(data.items || [])
      setGenerated(true)
    } catch {
      toast.error('Failed to generate panic mode content. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const grouped = items.reduce<Record<string, PanicModeItem[]>>((acc, item) => {
    const key = item.type || 'tip'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-7 h-7 text-amber-500" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Panic Mode</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Interview in less than 24 hours? Get a hyper-focused review list tailored to your profile.
        </p>
      </div>

      {/* Config */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Quick Setup (optional)</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Company (e.g., Google, Meta)"
            value={company}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompany(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Round (e.g., Onsite, Final Round)"
            value={round}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRound(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={generate}
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
          >
            {loading ? (
              <AIThinking size="sm" message="" />
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                {generated ? 'Regenerate' : 'Generate My List'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center">
          <AIThinking message="Building your personalized review list..." size="lg" />
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-4">
            Analyzing your profile, weak areas, and stories
          </p>
        </div>
      )}

      {/* Empty initial state */}
      {!loading && !generated && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-5xl mb-4">⚡</div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Your Interview is Soon
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mb-6">
            Panic Mode generates a prioritized, personalized review list based on your weak areas,
            your story bank, and the company you&apos;re interviewing at.
          </p>
          <Button
            onClick={generate}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Zap className="w-4 h-4 mr-2" />
            Generate My Review List
          </Button>
        </div>
      )}

      {/* Results */}
      {generated && !loading && items.length > 0 && (
        <div className="space-y-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {items.length} items · sorted by priority · personalized for your profile
            {company && ` · ${company}`}
          </p>

          {/* Priority items first */}
          {items
            .slice()
            .sort((a, b) => a.priority - b.priority)
            .slice(0, 3).length > 0 && (
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="text-red-500">🔥</span> Top Priority
              </h2>
              <div className="space-y-3">
                {items
                  .slice()
                  .sort((a, b) => a.priority - b.priority)
                  .slice(0, 3)
                  .map((item, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border p-4 ${COLOR_MAP[item.type] || COLOR_MAP.tip}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">{ICON_MAP[item.type] || ICON_MAP.tip}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                              {LABEL_MAP[item.type] || item.type}
                            </span>
                            <span className="text-xs opacity-50">#{item.priority}</span>
                          </div>
                          <p className="font-semibold text-sm mb-1">{item.title}</p>
                          <p className="text-sm opacity-80 leading-relaxed">{item.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Grouped by type */}
          {Object.entries(grouped).map(([type, typeItems]) => (
            typeItems.length > 0 && (
              <div key={type}>
                <h2 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  {ICON_MAP[type] || ICON_MAP.tip}
                  {LABEL_MAP[type] ? `${LABEL_MAP[type]}s` : type}
                  <span className="text-xs font-normal text-slate-400">({typeItems.length})</span>
                </h2>
                <div className="space-y-3">
                  {typeItems.map((item, i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{item.title}</p>
                        <span className="text-xs text-slate-400 shrink-0">#{item.priority}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )
}
