import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id?: string }).id!

    const body = await request.json()
    const { lessonId, quizScore, timeSpentMs } = body as {
      lessonId: string
      quizScore?: number
      timeSpentMs?: number
    }

    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId is required' }, { status: 400 })
    }

    // Verify lesson exists
    const lesson = await prisma.learningLesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        module: {
          select: {
            path: { select: { slug: true } },
          },
        },
      },
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Upsert progress record
    const progress = await prisma.userLessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: {
        completedAt: new Date(),
        ...(quizScore !== undefined && { quizScore }),
        ...(timeSpentMs !== undefined && { timeSpentMs }),
      },
      create: {
        userId,
        lessonId,
        completedAt: new Date(),
        quizScore: quizScore ?? null,
        timeSpentMs: timeSpentMs ?? 0,
      },
    })

    // Create a ProgressEntry so this shows up in analytics/streaks
    await prisma.progressEntry.create({
      data: {
        userId,
        category: 'PRODUCT_SENSE', // default — lessons don't map 1:1 to interview categories
        activity: 'LESSON_COMPLETE',
        score: quizScore ?? null,
        timeSpent: Math.round((timeSpentMs ?? 0) / 1000 / 60), // ms → minutes
        metadata: {
          lessonId,
          pathSlug: lesson.module.path.slug,
        },
      },
    })

    return NextResponse.json({ success: true, progress })
  } catch (error) {
    console.error('Progress API error:', error)
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id?: string }).id!

    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get('lessonId')

    if (lessonId) {
      const progress = await prisma.userLessonProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId } },
      })
      return NextResponse.json(progress)
    }

    // Return all progress for the user
    const allProgress = await prisma.userLessonProgress.findMany({
      where: { userId },
      select: {
        lessonId: true,
        completedAt: true,
        quizScore: true,
        timeSpentMs: true,
      },
    })

    return NextResponse.json(allProgress)
  } catch (error) {
    console.error('Progress GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
  }
}
