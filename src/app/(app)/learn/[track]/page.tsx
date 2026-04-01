import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PathOverview } from '@/components/learn/PathOverview'
import type { PathWithProgress, ModuleWithProgress, LessonWithProgress } from '@/types/learn'

interface Props {
  params: Promise<{ track: string }>
}

export default async function TrackPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/signin')
  const userId = (session.user as { id?: string }).id!

  const { track } = await params

  const path = await prisma.learningPath.findUnique({
    where: { slug: track },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } },
      },
      enrollments: { where: { userId } },
    },
  })

  if (!path) notFound()

  const allProgress = await prisma.userLessonProgress.findMany({ where: { userId } })
  const progressMap = new Map(allProgress.map((p) => [p.lessonId, p]))

  const modules: ModuleWithProgress[] = path.modules.map((mod) => {
    const lessons: LessonWithProgress[] = mod.lessons.map((lesson) => ({
      ...lesson,
      progress: progressMap.get(lesson.id) ?? null,
    }))
    const completedCount = lessons.filter((l) => l.progress?.completedAt).length
    return { ...mod, lessons, completedCount, totalCount: lessons.length }
  })

  const completedLessons = modules.reduce((s, m) => s + m.completedCount, 0)
  const totalLessons = modules.reduce((s, m) => s + m.totalCount, 0)
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  const enrollment = path.enrollments[0] ?? null

  const pathWithProgress: PathWithProgress = {
    ...path,
    modules,
    enrollment,
    completedLessons,
    totalLessons,
    progressPercent,
  }

  return <PathOverview path={pathWithProgress} />
}
