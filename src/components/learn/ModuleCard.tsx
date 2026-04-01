'use client'

import Link from 'next/link'
import { Clock, ChevronRight, CheckCircle2, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProgressRing } from './ProgressRing'
import type { ModuleWithProgress } from '@/types/learn'

interface ModuleCardProps {
  module: ModuleWithProgress
  pathSlug: string
  isLocked?: boolean
}

export function ModuleCard({ module, pathSlug, isLocked = false }: ModuleCardProps) {
  const completionPercent =
    module.totalCount > 0
      ? Math.round((module.completedCount / module.totalCount) * 100)
      : 0
  const isComplete = completionPercent === 100

  const card = (
    <div
      className={cn(
        'group flex items-center gap-4 p-4 rounded-xl border transition-all',
        isLocked
          ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 opacity-60 cursor-not-allowed'
          : isComplete
          ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-700'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm cursor-pointer'
      )}
    >
      {/* Progress ring */}
      <div className="shrink-0">
        {isComplete ? (
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        ) : isLocked ? (
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Lock className="w-4 h-4 text-slate-400" />
          </div>
        ) : (
          <ProgressRing percent={completionPercent} size={40} strokeWidth={4} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {module.weekNumber && (
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 shrink-0">
              Week {module.weekNumber}
            </span>
          )}
          <h3 className="font-medium text-slate-900 dark:text-white text-sm truncate">
            {module.title}
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
          {module.description}
        </p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {module.estimatedMinutes}m
          </span>
          <span>{module.completedCount}/{module.totalCount} lessons</span>
        </div>
      </div>

      {/* Arrow */}
      {!isLocked && (
        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors" />
      )}
    </div>
  )

  if (isLocked) return card

  return (
    <Link href={`/learn/${pathSlug}/${module.slug}`} className="block">
      {card}
    </Link>
  )
}
