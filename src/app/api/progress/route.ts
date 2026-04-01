import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { computeReadinessCertification } from '@/lib/learn-readiness'

const INTERVIEW_CATEGORIES_COUNT = 10

function calculateReadinessScore(data: {
  mockSessionScores: number[]
  categoriesPracticed: string[]
  totalCategories: number
  storiesCount: number
  totalBehavioralThemes: number
  recentActivityDays: number[]
  companyPrepCount: number
  targetCompanyCount: number
}): number {
  let score = 0
  const categoryCoverage = data.totalCategories > 0
    ? (data.categoriesPracticed.length / data.totalCategories) * 100
    : 0
  score += categoryCoverage * 0.30
  if (data.mockSessionScores.length > 0) {
    const avgScore = data.mockSessionScores.slice(-10).reduce((a, b) => a + b, 0) / Math.min(data.mockSessionScores.length, 10)
    score += avgScore * 0.30
  }
  const storyCompleteness = data.totalBehavioralThemes > 0
    ? Math.min((data.storiesCount / data.totalBehavioralThemes) * 100, 100)
    : 0
  score += storyCompleteness * 0.20
  const recentDays = data.recentActivityDays.filter((d) => d <= 7).length
  const recencyScore = Math.min((recentDays / 7) * 100, 100)
  score += recencyScore * 0.10
  const companyPrepScore = data.targetCompanyCount > 0
    ? (data.companyPrepCount / data.targetCompanyCount) * 100
    : 50
  score += companyPrepScore * 0.10
  return Math.round(Math.min(score, 100))
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id?: string }).id!

    const [user, progressEntries, mockSessions, stories, streakData, targetCompanies, activeEnrollment, lessonProgressAll] =
      await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { weakAreas: true } }),
        prisma.progressEntry.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 100,
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
          where: { userId },
          orderBy: { startedAt: 'desc' },
          include: {
            path: {
              select: {
                title: true,
                modules: {
                  include: { lessons: { select: { id: true, sourceRefs: true, title: true } } },
                },
              },
            },
          },
        }),
        prisma.userLessonProgress.findMany({
          where: { userId },
          include: { lesson: { select: { title: true, sourceRefs: true } } },
        }),
      ])

    const mockScoreData = mockSessions.map((s: { category: string; overallScore: number | null }) => ({
      category: s.category,
      overallScore: s.overallScore,
    }))
    const totalPathLessons = activeEnrollment
      ? activeEnrollment.path.modules.reduce((sum: number, m: { lessons: unknown[] }) => sum + m.lessons.length, 0)
      : 0
    const certification = activeEnrollment
      ? computeReadinessCertification(lessonProgressAll, mockScoreData, totalPathLessons)
      : null

    const categoriesPracticed = [
      ...new Set(mockSessions.map((s) => s.category)),
    ]
    const mockSessionScores = mockSessions
      .filter((s) => s.overallScore !== null)
      .map((s) => s.overallScore!)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentActivity = progressEntries.filter(
      (e) => new Date(e.createdAt) > thirtyDaysAgo
    )
    const recentActivityDays = recentActivity.map((e) => {
      const d = new Date(e.createdAt)
      return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
    })

    const readinessScore = calculateReadinessScore({
      mockSessionScores,
      categoriesPracticed,
      totalCategories: INTERVIEW_CATEGORIES_COUNT,
      storiesCount: stories,
      totalBehavioralThemes: 12,
      recentActivityDays,
      companyPrepCount: targetCompanies > 0 ? 1 : 0,
      targetCompanyCount: Math.max(targetCompanies, 1),
    })

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
        ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
        : 0,
      practiceCount: data.count,
    }))

    const weeklyActivity = Array(7).fill(0)
    for (const entry of progressEntries) {
      const daysAgo = Math.floor(
        (Date.now() - new Date(entry.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysAgo < 7) weeklyActivity[6 - daysAgo]++
    }

    return NextResponse.json({
      readinessScore,
      categoryScores,
      recentActivity: progressEntries.slice(0, 10).map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
      })),
      streak: streakData
        ? {
          currentStreak: streakData.currentStreak,
          longestStreak: streakData.longestStreak,
          totalActiveDays: streakData.totalActiveDays,
        }
        : null,
      totalSessions: mockSessions.length,
      weeklyActivity,
      certification,
      activeEnrollmentPathTitle: activeEnrollment?.path.title ?? null,
    })
  } catch (error) {
    console.error('Progress fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
  }
}
