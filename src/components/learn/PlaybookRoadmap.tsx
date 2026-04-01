'use client'

import Link from 'next/link'
import { CheckCircle2, Clock, ArrowRight, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ModuleWithProgress } from '@/types/learn'

interface PlaybookRoadmapProps {
  modules: ModuleWithProgress[]
  pathSlug: string
}

export function PlaybookRoadmap({ modules, pathSlug }: PlaybookRoadmapProps) {
  const weeks = [...modules].sort((a, b) => (a.weekNumber ?? 0) - (b.weekNumber ?? 0))

  return (
    <div className="space-y-4">
      {weeks.map((module, index) => {
        const isComplete = module.completedCount === module.totalCount && module.totalCount > 0
        const isInProgress = module.completedCount > 0 && !isComplete
        const prevModule = weeks[index - 1]
        const isPrevComplete =
          !prevModule ||
          (prevModule.completedCount === prevModule.totalCount && prevModule.totalCount > 0)
        const isUnlocked = index === 0 || isPrevComplete

        const firstUncompletedLesson = module.lessons.find((l) => !l.progress?.completedAt)
        const targetLesson = firstUncompletedLesson ?? module.lessons[0]

        return (
          <div key={module.id} className="flex gap-4">
            {/* Timeline spine */}
            <div className="flex flex-col items-center shrink-0 w-8">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10',
                  isComplete
                    ? 'bg-emerald-600 text-white'
                    : isInProgress
                    ? 'bg-blue-600 text-white'
                    : isUnlocked
                    ? 'bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 text-slate-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isUnlocked ? (
                  <span className="text-xs font-bold">{module.weekNumber}</span>
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
              </div>
              {index < weeks.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 flex-1 mt-1',
                    isComplete ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'
                  )}
                />
              )}
            </div>

            {/* Content card */}
            <div
              className={cn(
                'flex-1 mb-4 rounded-xl border p-4 transition-all',
                isComplete
                  ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/10'
                  : isInProgress
                  ? 'border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/10'
                  : isUnlocked
                  ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 opacity-60'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        'text-xs font-semibold uppercase tracking-wide',
                        isComplete
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isInProgress
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-400 dark:text-slate-500'
                      )}
                    >
                      Week {module.weekNumber}
                    </span>
                    {isInProgress && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        In Progress
                      </span>
                    )}
                    {isComplete && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Complete
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                    {module.title.replace(/^Week \d+ — /, '')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {module.description}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {module.estimatedMinutes}m
                    </span>
                    <span>
                      {module.completedCount}/{module.totalCount} lessons
                    </span>
                  </div>

                  {isInProgress && (
                    <div className="mt-2 h-1 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.round((module.completedCount / module.totalCount) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>

                {isUnlocked && targetLesson && (
                  <Link href={`/learn/${pathSlug}/${module.slug}/${targetLesson.slug}`}>
                    <button
                      className={cn(
                        'shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                        isComplete
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600'
                          : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/60'
                      )}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
