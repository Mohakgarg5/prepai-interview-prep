'use client'

import Link from 'next/link'
import { ArrowLeft, BookMarked, Zap, Brain } from 'lucide-react'
import { ModuleCard } from './ModuleCard'
import { ProgressRing } from './ProgressRing'
import { Button } from '@/components/ui/button'
import type { PathWithProgress } from '@/types/learn'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BookMarked, Zap, Brain,
}

interface PathOverviewProps {
  path: PathWithProgress
}

export function PathOverview({ path }: PathOverviewProps) {
  const Icon = ICON_MAP[path.icon] ?? BookMarked

  // Find the first incomplete module for "Continue" CTA
  const nextModule = path.modules.find((m) => m.completedCount < m.totalCount)
  const firstLesson = nextModule?.lessons[0]

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/learn"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Learning Hub
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-800 flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{path.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">{path.description}</p>
        </div>
        <div className="shrink-0">
          <ProgressRing percent={path.progressPercent} size={56} strokeWidth={5} />
        </div>
      </div>

      {/* Progress summary */}
      <div className="flex items-center gap-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{path.completedLessons}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Completed</p>
        </div>
        <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{path.totalLessons - path.completedLessons}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Remaining</p>
        </div>
        <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{path.modules.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Modules</p>
        </div>
        {nextModule && firstLesson && (
          <div className="ml-auto">
            <Link href={`/learn/${path.slug}/${nextModule.slug}/${firstLesson.slug}`}>
              <Button className="bg-blue-800 hover:bg-blue-900 text-white text-sm">
                {path.completedLessons > 0 ? 'Continue' : 'Start'}
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Module list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Modules
        </h2>
        {path.modules.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            pathSlug={path.slug}
          />
        ))}
      </div>
    </div>
  )
}
