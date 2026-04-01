'use client'

import Link from 'next/link'
import { BookMarked, Zap, Brain, CheckCircle2, Clock, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PathWithProgress } from '@/types/learn'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BookMarked,
  Zap,
  Brain,
}

interface PathCardProps {
  path: PathWithProgress
  onEnroll: (pathSlug: string) => void
  enrolling: boolean
}

export function PathCard({ path, onEnroll, enrolling }: PathCardProps) {
  const Icon = ICON_MAP[path.icon] ?? BookMarked
  const isEnrolled = !!path.enrollment
  const hasProgress = path.completedLessons > 0

  const colorMap: Record<string, { bg: string; icon: string; bar: string; badge: string }> = {
    playbook: {
      bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
      icon: 'bg-blue-800 text-white',
      bar: 'bg-blue-600',
      badge: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    },
    'fast-track': {
      bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
      icon: 'bg-amber-500 text-white',
      bar: 'bg-amber-500',
      badge: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300',
    },
    'ai-pm': {
      bg: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
      icon: 'bg-purple-700 text-white',
      bar: 'bg-purple-600',
      badge: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    },
  }

  const colors = colorMap[path.slug] ?? colorMap.playbook

  const totalMinutes = path.modules.reduce((sum, m) => sum + m.estimatedMinutes, 0)
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  return (
    <div className={cn('rounded-2xl border p-6 flex flex-col gap-4 transition-all', colors.bg)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', colors.icon)}>
          <Icon className="w-5 h-5" />
        </div>
        {isEnrolled && (
          <span className={cn('text-xs font-medium px-2 py-1 rounded-full', colors.badge)}>
            Enrolled
          </span>
        )}
      </div>

      {/* Title + desc */}
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-white text-lg leading-snug">
          {path.title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
          {path.description}
        </p>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {path.totalLessons} lessons
        </span>
        <span>{path.modules.length} modules</span>
      </div>

      {/* Progress bar (if enrolled) */}
      {isEnrolled && (
        <div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span>{path.completedLessons}/{path.totalLessons} lessons done</span>
            <span>{path.progressPercent}%</span>
          </div>
          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', colors.bar)}
              style={{ width: `${path.progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mt-auto pt-2">
        {isEnrolled ? (
          <Link href={`/learn/${path.slug}`}>
            <Button className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white">
              {hasProgress ? 'Continue Learning' : 'Start Learning'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        ) : (
          <Button
            onClick={() => onEnroll(path.slug)}
            disabled={enrolling}
            variant="outline"
            className="w-full"
          >
            {enrolling ? 'Enrolling...' : 'Enroll — Free'}
          </Button>
        )}
      </div>
    </div>
  )
}
