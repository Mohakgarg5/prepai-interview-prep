import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { CheckCircle2, Circle, Clock, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  params: Promise<{ track: string; module: string }>
}

export default async function ModulePage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/signin')
  const userId = (session.user as { id?: string }).id!

  const { track, module: moduleSlug } = await params

  const path = await prisma.learningPath.findUnique({ where: { slug: track } })
  if (!path) notFound()

  const mod = await prisma.learningModule.findUnique({
    where: { pathId_slug: { pathId: path.id, slug: moduleSlug } },
    include: { lessons: { orderBy: { order: 'asc' } } },
  })
  if (!mod) notFound()

  const lessonIds = mod.lessons.map((l) => l.id)
  const progressRecords = await prisma.userLessonProgress.findMany({
    where: { userId, lessonId: { in: lessonIds } },
  })
  const progressMap = new Map(progressRecords.map((p) => [p.lessonId, p]))

  const lessonsWithStatus = mod.lessons.map((lesson) => ({
    ...lesson,
    isComplete: !!progressMap.get(lesson.id)?.completedAt,
  }))

  const completedCount = lessonsWithStatus.filter((l) => l.isComplete).length
  const nextLesson = lessonsWithStatus.find((l) => !l.isComplete)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/learn" className="hover:text-slate-900 dark:hover:text-white transition-colors">Learn</Link>
        <span>/</span>
        <Link href={`/learn/${track}`} className="hover:text-slate-900 dark:hover:text-white transition-colors capitalize">
          {track.replace(/-/g, ' ')}
        </Link>
      </div>

      {/* Header */}
      <div>
        {mod.weekNumber && (
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
            Week {mod.weekNumber}
          </p>
        )}
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {mod.title.replace(/^Week \d+ — /, '')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">{mod.description}</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {mod.estimatedMinutes} min
          </span>
          <span>{completedCount}/{mod.lessons.length} lessons complete</span>
        </div>
      </div>

      {completedCount > 0 && (
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.round((completedCount / mod.lessons.length) * 100)}%` }}
          />
        </div>
      )}

      {nextLesson && (
        <Link href={`/learn/${track}/${moduleSlug}/${nextLesson.slug}`}>
          <Button className="w-full sm:w-auto bg-blue-800 hover:bg-blue-900 text-white">
            {completedCount > 0 ? 'Continue' : 'Start'}: {nextLesson.title}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      )}

      {/* Lesson list */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Lessons
        </h2>
        {lessonsWithStatus.map((lesson, i) => (
          <Link
            key={lesson.id}
            href={`/learn/${track}/${moduleSlug}/${lesson.slug}`}
            className={cn(
              'flex items-center gap-4 p-4 rounded-xl border transition-all group',
              lesson.isComplete
                ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-300'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm'
            )}
          >
            <div className="shrink-0">
              {lesson.isComplete ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                <span className="text-slate-400 dark:text-slate-500 mr-2 text-xs">{i + 1}.</span>
                {lesson.title}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {lesson.estimatedMinutes} min
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
