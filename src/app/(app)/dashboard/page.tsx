import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { calculateReadinessScore, daysUntil } from '@/lib/utils'
import { INTERVIEW_CATEGORIES } from '@/lib/constants'
import { ReadinessGauge } from '@/components/dashboard/ReadinessGauge'
import { StreakCounter } from '@/components/dashboard/StreakCounter'
import { QuickActionGrid } from '@/components/dashboard/QuickActionGrid'
import { ProgressSnapshot } from '@/components/dashboard/ProgressSnapshot'
import { DailyRecommendation } from '@/components/dashboard/DailyRecommendation'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'
import { ResumeLearningCard } from '@/components/learn/ResumeLearningCard'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/signin')

  const userId = (session.user as { id?: string }).id!

  const [user, progressEntries, mockSessions, stories, streakData, targetCompanies, activeEnrollment] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          targetRole: true,
          experienceLevel: true,
          interviewTimeline: true,
          weakAreas: true,
        },
      }),
      prisma.progressEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.mockSession.findMany({
        where: { userId, completedAt: { not: null } },
        select: { overallScore: true, category: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.behavioralStory.count({ where: { userId } }),
      prisma.streakData.findUnique({ where: { userId } }),
      prisma.targetCompany.count({ where: { userId } }),
      prisma.userPathEnrollment.findFirst({
        where: { userId, completedAt: null },
        orderBy: { startedAt: 'desc' },
        include: {
          path: {
            select: {
              slug: true,
              title: true,
              modules: {
                orderBy: { order: 'asc' },
                include: { lessons: { orderBy: { order: 'asc' }, select: { id: true, slug: true, title: true } } },
              },
            },
          },
        },
      }),
    ])

  // Calculate readiness score
  const categoriesPracticed = [...new Set(mockSessions.map((s: { category: string }) => s.category))]
  const mockSessionScores = (mockSessions as Array<{ overallScore: number | null; category: string; createdAt: Date }>)
    .filter((s) => s.overallScore !== null)
    .map((s) => s.overallScore!)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentActivity = progressEntries.filter(
    (e) => new Date(e.createdAt) > thirtyDaysAgo
  )
  const recentActivityDays = recentActivity.map((e) =>
    Math.floor((Date.now() - new Date(e.createdAt).getTime()) / (1000 * 60 * 60 * 24))
  )

  const readinessScore = calculateReadinessScore({
    mockSessionScores,
    categoriesPracticed,
    totalCategories: INTERVIEW_CATEGORIES.length,
    storiesCount: stories,
    totalBehavioralThemes: 12,
    recentActivityDays,
    companyPrepCount: targetCompanies > 0 ? 1 : 0,
    targetCompanyCount: Math.max(targetCompanies, 1),
    weakAreas: user?.weakAreas || [],
  })

  // Category scores for chart
  const categoryMap = new Map<string, { scores: number[]; count: number }>()
  for (const entry of progressEntries) {
    if (!categoryMap.has(entry.category)) {
      categoryMap.set(entry.category, { scores: [], count: 0 })
    }
    const d = categoryMap.get(entry.category)!
    d.count++
    if (entry.score !== null) d.scores.push(entry.score)
  }
  const categoryScores = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    avgScore: data.scores.length > 0
      ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
      : 0,
    practiceCount: data.count,
  }))

  const daysLeft = user?.interviewTimeline ? daysUntil(user.interviewTimeline) : null

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {user?.targetRole?.replace(/_/g, ' ')} Prep
          </p>
        </div>
        {daysLeft !== null && daysLeft >= 0 && (
          <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {daysLeft === 0 ? 'Interview today!' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} until interview`}
            </span>
          </Badge>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex items-center justify-center">
          <ReadinessGauge score={readinessScore} />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex items-center justify-center">
          <StreakCounter
            streak={streakData?.currentStreak || 0}
            longestStreak={streakData?.longestStreak || 0}
          />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Quick Stats</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 dark:text-slate-400">Mock Interviews</span>
              <span className="font-semibold text-slate-900 dark:text-white">{mockSessions.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 dark:text-slate-400">Stories</span>
              <span className="font-semibold text-slate-900 dark:text-white">{stories}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 dark:text-slate-400">Total Activities</span>
              <span className="font-semibold text-slate-900 dark:text-white">{progressEntries.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily recommendation */}
      {user && (
        <DailyRecommendation
          user={{
            name: user.name,
            weakAreas: user.weakAreas,
            interviewTimeline: user.interviewTimeline,
            targetRole: user.targetRole,
          }}
          readinessScore={readinessScore}
        />
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
        <QuickActionGrid
          interviewWithinHours={daysLeft !== null ? daysLeft * 24 : null}
        />
      </div>

      {/* Resume Learning */}
      {(() => {
        if (!activeEnrollment) return null
        const path = activeEnrollment.path
        const completedLessonIds = progressEntries
          .filter((e) => e.activity === 'LESSON_COMPLETE')
          .map((e) => (e.metadata as Record<string, string> | null)?.lessonId)
          .filter(Boolean) as string[]
        const completedSet = new Set(completedLessonIds)
        let nextLesson: { slug: string; title: string } | null = null
        let nextModule: { slug: string; title: string } | null = null
        let completedCount = 0
        let totalCount = 0
        for (const mod of path.modules) {
          for (const lesson of mod.lessons) {
            totalCount++
            if (completedSet.has(lesson.id)) {
              completedCount++
            } else if (!nextLesson) {
              nextLesson = lesson
              nextModule = mod
            }
          }
        }
        if (!nextLesson || !nextModule) return null
        return (
          <ResumeLearningCard
            pathTitle={path.title}
            pathSlug={path.slug}
            moduleTitle={nextModule.title}
            lessonTitle={nextLesson.title}
            lessonSlug={nextLesson.slug}
            moduleSlug={nextModule.slug}
            completedLessons={completedCount}
            totalLessons={totalCount}
          />
        )
      })()}

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress snapshot */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Category Progress
          </h2>
          {categoryScores.length > 0 ? (
            <ProgressSnapshot data={categoryScores} />
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center">
                Complete your first mock interview to see category progress
              </p>
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <RecentActivity
            activities={progressEntries.slice(0, 5).map((e) => ({
              ...e,
              createdAt: e.createdAt.toISOString(),
            }))}
          />
        </div>
      </div>
    </div>
  )
}
