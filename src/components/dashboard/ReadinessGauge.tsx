'use client'

import { ScoreRing } from '@/components/shared/ScoreRing'
import { getReadinessLabel } from '@/lib/utils'

interface ReadinessGaugeProps {
  score: number
}

export function ReadinessGauge({ score }: ReadinessGaugeProps) {
  return (
    <div className="flex flex-col items-center">
      <ScoreRing
        score={score}
        size={140}
        strokeWidth={12}
        label={getReadinessLabel(score)}
      />
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Interview Readiness</p>
    </div>
  )
}
