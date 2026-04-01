import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { callClaude } from '@/lib/ai'
import { SYSTEM_PROMPTS } from '@/lib/ai-prompts'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as { id?: string }).id!

    const body = await request.json()
    const { category, difficulty, companyContext, jobContext, timedMode, timeLimitMinutes } = body as {
      category: string
      difficulty: string
      companyContext?: string
      jobContext?: string
      timedMode: boolean
      timeLimitMinutes?: number
    }

    if (!category || !difficulty) {
      return NextResponse.json({ error: 'category and difficulty are required' }, { status: 400 })
    }

    // Load user profile for context
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { targetRole: true, experienceLevel: true },
    })

    const role = user?.targetRole?.replace(/_/g, ' ') ?? 'Product Manager'
    const experience = user?.experienceLevel?.replace(/_/g, ' ') ?? 'Mid'
    const categoryLabel = category.replace(/_/g, ' ').toLowerCase()

    const systemPrompt = SYSTEM_PROMPTS.MOCK_INTERVIEWER({
      category: categoryLabel,
      difficulty,
      company: companyContext,
      role,
      experience,
    })

    // Generate the opening question
    const openingPrompt = `Start the interview with one focused ${categoryLabel} interview question${companyContext ? ` tailored for ${companyContext}` : ''}. Do not include any preamble — just ask the question directly and naturally, as a real interviewer would.`

    const openingQuestion = await callClaude({
      systemPrompt,
      userMessage: openingPrompt,
      maxTokens: 512,
    })

    // Create session and first message in a transaction
    const mockSession = await prisma.mockSession.create({
      data: {
        userId,
        category: category as never,
        difficulty: difficulty as never,
        companyContext: companyContext ?? null,
        jobContext: jobContext ?? null,
        timedMode: timedMode ?? false,
        timeLimitMinutes: timeLimitMinutes ?? null,
        messages: {
          create: {
            role: 'INTERVIEWER',
            content: openingQuestion,
            order: 0,
          },
        },
      },
    })

    // Record progress entry
    await prisma.progressEntry.create({
      data: {
        userId,
        category: category as never,
        activity: 'MOCK_INTERVIEW',
        timeSpent: 0,
        metadata: { sessionId: mockSession.id, action: 'started' },
      },
    })

    return NextResponse.json({ sessionId: mockSession.id })
  } catch (error) {
    console.error('[mock/start]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
