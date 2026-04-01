'use client'

import { Award, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReadinessCertification } from '@/types/learn'

const AREA_LABELS: Record<string, string> = {
  strategy: 'Strategy',
  execution: 'Execution',
  metrics: 'Metrics',
  behavioral: 'Behavioral',
  'ai-pm': 'AI-PM',
}

interface ReadinessBadgeProps {
  certification: ReadinessCertification
  pathTitle: string
}

export function ReadinessBadge({ certification, pathTitle }: ReadinessBadgeProps) {
  const { score, lessonScore, quizScore, mockScore, weakAreas, strongAreas } = certification

  const tier =
    score >= 85 ? { label: 'Excellent', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' } :
    score >= 70 ? { label: 'Strong', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' } :
    score >= 50 ? { label: 'Developing', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' } :
    { label: 'Building', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800' }

  const weakLabel = weakAreas.map((a) => AREA_LABELS[a] ?? a).join(', ')
  const strongLabel = strongAreas.map((a) => AREA_LABELS[a] ?? a).join(', ')

  return (
    <div className={cn('rounded-2xl border p-6 space-y-5', tier.bg)}>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
          <Award className={cn('w-7 h-7', tier.color)} />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Readiness Score — {pathTitle}
          </p>
          <div className="flex items-end gap-2 mt-0.5">
            <span className={cn('text-4xl font-bold', tier.color)}>{score}</span>
            <span className="text-slate-400 dark:text-slate-500 text-sm mb-1">/100</span>
            <span className={cn('text-sm font-semibold mb-1', tier.color)}>{tier.label}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Lessons', value: lessonScore, weight: '30%' },
          { label: 'Quizzes', value: quizScore, weight: '30%' },
          { label: 'Mock Score', value: mockScore, weight: '40%' },
        ].map(({ label, value, weight }) => (
          <div
            key={label}
            className="text-center p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{weight}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {strongAreas.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <span className="text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5">✓</span>
            <span className="text-slate-700 dark:text-slate-300">
              <strong>Strong:</strong> {strongLabel}
            </span>
          </div>
        )}
        {weakAreas.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
            <span className="text-slate-700 dark:text-slate-300">
              <strong>To improve:</strong> {weakLabel} — take{' '}
              {weakAreas.length === 1 ? '2 more mock interviews' : 'targeted mock interviews'} in{' '}
              {weakAreas.length === 1 ? 'this area' : 'these areas'}.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
