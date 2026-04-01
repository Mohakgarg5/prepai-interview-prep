import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { LearningHub } from '@/components/learn/LearningHub'
import type { PathWithProgress, ModuleWithProgress, LessonWithProgress } from '@/types/learn'

export default async function LearnPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/signin')
  const userId = (session.user as { id?: string }).id!

  const [paths, enrollments, allProgress] = await Promise.all([
    prisma.learningPath.findMany({
      orderBy: { order: 'asc' },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: { lessons: { orderBy: { order: 'asc' } } },
        },
      },
    }),
    prisma.userPathEnrollment.findMany({ where: { userId } }),
    prisma.userLessonProgress.findMany({ where: { userId } }),
  ])

  const progressMap = new Map(allProgress.map((p) => [p.lessonId, p]))
  const enrollmentMap = new Map(enrollments.map((e) => [e.pathId, e]))

  const pathsWithProgress: PathWithProgress[] = paths.map((path) => {
    const enrollment = enrollmentMap.get(path.id) ?? null

    const modules: ModuleWithProgress[] = path.modules.map((mod) => {
      const lessons: LessonWithProgress[] = mod.lessons.map((lesson) => ({
        ...lesson,
        progress: progressMap.get(lesson.id) ?? null,
      }))
      const completedCount = lessons.filter((l) => l.progress?.completedAt).length
      return { ...mod, lessons, completedCount, totalCount: lessons.length }
    })

    const completedLessons = modules.reduce((sum, m) => sum + m.completedCount, 0)
    const totalLessons = modules.reduce((sum, m) => sum + m.totalCount, 0)
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

    return { ...path, modules, enrollment, completedLessons, totalLessons, progressPercent }
  })

  return <LearningHub paths={pathsWithProgress} />
}
