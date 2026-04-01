'use client'

import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts'
import type { LearnSkillArea } from '@/types/learn'

const AREA_LABELS: Record<LearnSkillArea, string> = {
  strategy: 'Strategy',
  execution: 'Execution',
  metrics: 'Metrics',
  behavioral: 'Behavioral',
  'ai-pm': 'AI-PM',
}

interface SkillMasteryProps {
  scores: Partial<Record<LearnSkillArea, number>>
}

export function SkillMastery({ scores }: SkillMasteryProps) {
  const areas: LearnSkillArea[] = ['strategy', 'execution', 'metrics', 'behavioral', 'ai-pm']

  const data = areas.map((area) => ({
    subject: AREA_LABELS[area],
    score: scores[area] ?? 0,
    fullMark: 100,
  }))

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Skill Mastery</h3>

      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#2563eb"
            fill="#2563eb"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>

      <div className="space-y-2">
        {areas.map((area) => {
          const score = scores[area] ?? 0
          const color =
            score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-400'
          return (
            <div key={area} className="flex items-center gap-3">
              <span className="text-xs text-slate-600 dark:text-slate-400 w-20 shrink-0">
                {AREA_LABELS[area]}
              </span>
              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${color}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-8 text-right">
                {score}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
