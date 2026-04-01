import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { callClaude, parseJSONFromAI } from '@/lib/ai'
import { SYSTEM_PROMPTS } from '@/lib/ai-prompts'
import { sanitizeInput } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id?: string }).id!

    const body = await request.json()
    const { company, round } = body

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { targetRole: true, experienceLevel: true, weakAreas: true },
    })

    const [storiesCount, recentSessions, completedLessons] = await Promise.all([
      prisma.behavioralStory.count({ where: { userId } }),
      prisma.mockSession.findMany({
        where: { userId, completedAt: { not: null } },
        orderBy: { completedAt: 'desc' },
        take: 5,
        select: { category: true, overallScore: true },
      }),
      prisma.userLessonProgress.findMany({
        where: { userId, completedAt: { not: null } },
        include: {
          lesson: { select: { title: true, keyTakeaways: true } },
        },
        orderBy: { completedAt: 'desc' },
        take: 20,
      }),
    ])

    const completedTopics = completedLessons
      .slice(0, 10)
      .map((p) => p.lesson.title)
      .join(', ')

    const profile = `
Target Role: ${user?.targetRole || 'GENERAL_PM'}
Experience Level: ${user?.experienceLevel || 'MID'}
Weak Areas: ${(user?.weakAreas || []).join(', ') || 'None identified'}
Stories in bank: ${storiesCount}
Recent mock interview performance: ${recentSessions.map((s) => `${s.category}: ${s.overallScore || 'N/A'}`).join(', ')}
${round ? `Interview Round: ${sanitizeInput(round)}` : ''}
${completedTopics ? `Completed learning topics: ${completedTopics}` : ''}
`

    const sanitizedCompany = company ? sanitizeInput(company) : undefined

    const result = await callClaude({
      systemPrompt: SYSTEM_PROMPTS.PANIC_MODE(profile, sanitizedCompany),
      userMessage: `Generate my panic mode review list${sanitizedCompany ? ` for ${sanitizedCompany}` : ''}.`,
      maxTokens: 3000,
    })

    let items: unknown[]
    try {
      items = parseJSONFromAI(result) as unknown[]
    } catch {
      items = [{ title: 'Review your key stories', type: 'story', content: result, priority: 1 }]
    }

    // Record panic mode activity
    await prisma.progressEntry.create({
      data: {
        userId,
        category: 'PRODUCT_SENSE',
        activity: 'PANIC_MODE_REVIEW',
        timeSpent: 15,
      },
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Panic mode error:', error)
    return NextResponse.json({ error: 'Failed to generate panic mode content' }, { status: 500 })
  }
}
