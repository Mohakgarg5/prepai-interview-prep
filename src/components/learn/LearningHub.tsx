'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, GraduationCap } from 'lucide-react'
import { PathCard } from './PathCard'
import type { PathWithProgress } from '@/types/learn'

interface LearningHubProps {
  paths: PathWithProgress[]
}

export function LearningHub({ paths }: LearningHubProps) {
  const [enrollingSlug, setEnrollingSlug] = useState<string | null>(null)
  const router = useRouter()

  const handleEnroll = async (pathSlug: string) => {
    setEnrollingSlug(pathSlug)
    try {
      const res = await fetch('/api/learn/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathSlug }),
      })
      if (!res.ok) throw new Error('Enroll failed')
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setEnrollingSlug(null)
    }
  }

  const enrolledPaths = paths.filter((p) => p.enrollment)
  const availablePaths = paths.filter((p) => !p.enrollment)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-800 flex items-center justify-center shrink-0">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Learning Hub</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Structured PM curriculum — from zero to interview-ready. Pick a path and start learning.
          </p>
        </div>
      </div>

      {/* Enrolled paths */}
      {enrolledPaths.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Your Paths
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {enrolledPaths.map((path) => (
              <PathCard
                key={path.id}
                path={path}
                onEnroll={handleEnroll}
                enrolling={enrollingSlug === path.slug}
              />
            ))}
          </div>
        </section>
      )}

      {/* Available paths */}
      {availablePaths.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {enrolledPaths.length > 0 ? 'More Paths' : 'Choose a Path'}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {availablePaths.map((path) => (
              <PathCard
                key={path.id}
                path={path}
                onEnroll={handleEnroll}
                enrolling={enrollingSlug === path.slug}
              />
            ))}
          </div>
        </section>
      )}

      {paths.length === 0 && (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No learning paths available yet. Run the seed script to populate content.</p>
          <code className="text-xs mt-2 block">npx tsx scripts/generate-lesson-content.ts --seed-only</code>
        </div>
      )}
    </div>
  )
}
