'use client'

import { useState, useEffect } from 'react'
import { AIThinking } from '@/components/shared/AIThinking'
import { ScoreRing } from '@/components/shared/ScoreRing'
import { ReadinessBadge } from '@/components/learn/ReadinessBadge'
import type { ReadinessCertification } from '@/types/learn'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from 'recharts'

interface CategoryScore {
  category: string
  avgScore: number
  practiceCount: number
}

interface StreakInfo {
  currentStreak: number
  longestStreak: number
  totalActiveDays: number
}

interface ProgressData {
  readinessScore: number
  categoryScores: CategoryScore[]
  recentActivity: Array<{
    id: string
    category: string
    activity: string
    score: number | null
    timeSpent: number
    createdAt: string
  }>
  streak: StreakInfo | null
  totalSessions: number
  weeklyActivity: number[]
  certification: ReadinessCertification | null
  activeEnrollmentPathTitle: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  PRODUCT_SENSE: 'Product Sense',
  EXECUTION: 'Execution',
  STRATEGY: 'Strategy',
  BEHAVIORAL: 'Behavioral',
  ESTIMATION: 'Estimation',
  TECHNICAL_AI: 'Technical AI',
  ML_SYSTEM_DESIGN: 'ML System Design',
  AI_ETHICS: 'AI Ethics',
  METRICS: 'Metrics',
  PRODUCT_DESIGN: 'Product Design',
}

const ACTIVITY_LABELS: Record<string, string> = {
  MOCK_INTERVIEW: 'Mock Interview',
  TEARDOWN: 'Teardown',
  FRAMEWORK_STUDY: 'Framework Study',
  STORY_CRAFTING: 'Story Crafting',
  COMPANY_RESEARCH: 'Company Research',
  DEBRIEF: 'Debrief',
  PANIC_MODE_REVIEW: 'Panic Mode',
}

const DAY_LABELS = ['6d ago', '5d ago', '4d ago', '3d ago', '2d ago', 'Yesterday', 'Today']

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/progress')
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <AIThinking message="Loading your progress..." size="lg" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 text-slate-500 text-center">Failed to load progress data.</div>
    )
  }

  const radarData = data.categoryScores.slice(0, 8).map((c) => ({
    category: CATEGORY_LABELS[c.category]?.split(' ')[0] || c.category,
    score: c.avgScore || 0,
    fullMark: 100,
  }))

  const barData = data.weeklyActivity.map((count, i) => ({
    day: DAY_LABELS[i],
    sessions: count,
  }))

  const totalTime = data.recentActivity.reduce((sum, a) => sum + a.timeSpent, 0)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Progress</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Track your interview readiness over time
        </p>
      </div>

      {/* Learn Readiness Badge */}
      {data.certification && data.activeEnrollmentPathTitle && (
        <div className="mb-8">
          <ReadinessBadge
            certification={data.certification}
            pathTitle={data.activeEnrollmentPathTitle}
          />
        </div>
      )}

      {/* Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col items-center">
          <ScoreRing score={data.readinessScore} size={80} strokeWidth={7} label="Readiness" />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 text-center">
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            {data.streak?.currentStreak ?? 0}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Day Streak</p>
          {data.streak?.longestStreak && data.streak.longestStreak > 0 && (
            <p className="text-xs text-slate-400 mt-1">Best: {data.streak.longestStreak}</p>
          )}
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 text-center">
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            {data.totalSessions}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Mock Interviews</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 text-center">
          <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            {totalTime < 60 ? `${totalTime}m` : `${Math.floor(totalTime / 60)}h`}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Time Practiced</p>
          <p className="text-xs text-slate-400 mt-1">{totalTime} min total</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Activity */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="font-bold text-slate-900 dark:text-white mb-4">Weekly Activity</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} margin={{ top: 4, right: 4, left: -24, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="sessions" fill="#1E40AF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Skill Radar */}
        {radarData.length > 2 && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="font-bold text-slate-900 dark:text-white mb-4">Skill Radar</h2>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData}>
                <PolarGrid className="stroke-slate-200 dark:stroke-slate-700" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#1E40AF"
                  fill="#1E40AF"
                  fillOpacity={0.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Category Scores */}
      {data.categoryScores.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
          <h2 className="font-bold text-slate-900 dark:text-white mb-4">Category Breakdown</h2>
          <div className="space-y-3">
            {data.categoryScores
              .sort((a, b) => b.practiceCount - a.practiceCount)
              .map((cat) => (
                <div key={cat.category}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {CATEGORY_LABELS[cat.category] || cat.category}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{cat.practiceCount} sessions</span>
                      {cat.avgScore > 0 && (
                        <span className="text-sm font-medium text-slate-900 dark:text-white w-10 text-right">
                          {cat.avgScore}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${cat.avgScore || Math.min(cat.practiceCount * 10, 100)}%`,
                        backgroundColor: cat.avgScore > 70 ? '#059669' : cat.avgScore > 40 ? '#D97706' : '#1E40AF',
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {data.recentActivity.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="font-bold text-slate-900 dark:text-white mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {data.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {ACTIVITY_LABELS[activity.activity] || activity.activity}
                    </p>
                    <p className="text-xs text-slate-400">
                      {CATEGORY_LABELS[activity.category] || activity.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  {activity.score !== null && (
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {activity.score}%
                    </span>
                  )}
                  <span className="text-xs text-slate-400">{activity.timeSpent}m</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recentActivity.length === 0 && data.totalSessions === 0 && (
        <div className="text-center py-10 text-slate-400">
          <p className="text-sm">No activity yet. Start practicing to see your progress here.</p>
        </div>
      )}
    </div>
  )
}
