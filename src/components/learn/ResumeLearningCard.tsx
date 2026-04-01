'use client'

import Link from 'next/link'
import { BookMarked, ChevronRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ResumeLearningCardProps {
  pathTitle: string
  pathSlug: string
  moduleTitle: string
  lessonTitle: string
  lessonSlug: string
  moduleSlug: string
  completedLessons: number
  totalLessons: number
}

export function ResumeLearningCard({
  pathTitle,
  pathSlug,
  moduleTitle,
  lessonTitle,
  lessonSlug,
  moduleSlug,
  completedLessons,
  totalLessons,
}: ResumeLearningCardProps) {
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Resume Learning</h3>
        </div>
        <Link href="/learn" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
          All paths
        </Link>
      </div>
      <div>
        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
          {pathTitle}
        </p>
        <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5 truncate">
          {lessonTitle}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          {moduleTitle}
        </p>
      </div>
      <div>
        <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mb-1.5">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            {completedLessons}/{totalLessons} lessons
          </span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
      <Link href={`/learn/${pathSlug}/${moduleSlug}/${lessonSlug}`}>
        <Button className="w-full bg-blue-800 hover:bg-blue-900 text-white text-sm gap-1.5">
          Continue Lesson
          <ChevronRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  )
}
