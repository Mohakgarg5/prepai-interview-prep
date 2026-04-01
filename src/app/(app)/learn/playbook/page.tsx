import { getSession } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, BookMarked } from 'lucide-react'
import { PlaybookRoadmap } from '@/components/learn/PlaybookRoadmap'
import type { ModuleWithProgress, LessonWithProgress } from '@/types/learn'

export default async function PlaybookPage() {
  const session = await getSession()
  if (!session?.user) redirect('/signin')
  const userId = (session.user as { id?: string }).id!

  const path = await prisma.learningPath.findUnique({
    where: { slug: 'playbook' },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } },
      },
    },
  })

  if (!path) notFound()

  await prisma.userPathEnrollment.upsert({
    where: { userId_pathId: { userId, pathId: path.id } },
    update: {},
    create: { userId, pathId: path.id },
  })

  const allProgress = await prisma.userLessonProgress.findMany({ where: { userId } })
  const progressMap = new Map(allProgress.map((p) => [p.lessonId, p]))

  const modulesWithProgress: ModuleWithProgress[] = path.modules.map((mod) => {
    const lessons: LessonWithProgress[] = mod.lessons.map((lesson) => ({
      ...lesson,
      progress: progressMap.get(lesson.id) ?? null,
    }))
    const completedCount = lessons.filter((l) => l.progress?.completedAt).length
    return { ...mod, lessons, completedCount, totalCount: lessons.length }
  })

  const totalLessons = modulesWithProgress.reduce((s, m) => s + m.totalCount, 0)
  const completedLessons = modulesWithProgress.reduce((s, m) => s + m.completedCount, 0)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Link
        href="/learn"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Learning Hub
      </Link>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-800 flex items-center justify-center shrink-0">
          <BookMarked className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{path.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{path.description}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {completedLessons} of {totalLessons} lessons complete
          </p>
        </div>
      </div>

      <PlaybookRoadmap modules={modulesWithProgress} pathSlug="playbook" />
    </div>
  )
}
