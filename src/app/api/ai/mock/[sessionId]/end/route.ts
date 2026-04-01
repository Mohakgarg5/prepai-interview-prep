import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { callClaude, parseJSONFromAI } from '@/lib/ai'
import { SYSTEM_PROMPTS } from '@/lib/ai-prompts'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as { id?: string }).id!
    const { sessionId } = await params

    // Fetch session with messages
    const mockSession = await prisma.mockSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { order: 'asc' } } },
    })

    if (!mockSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (mockSession.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // If already scored, return existing scores
    if (mockSession.overallScore !== null) {
      // Find the last FEEDBACK message for strengths/improvements
      const feedbackMsg = mockSession.messages.findLast((m) => m.role === 'FEEDBACK')
      let strengths: string[] = []
      let improvements: string[] = []
      if (feedbackMsg) {
        try {
          const parsed = parseJSONFromAI(feedbackMsg.content) as {
            strengths?: string[]
            improvements?: string[]
          }
          strengths = parsed.strengths ?? []
          improvements = parsed.improvements ?? []
        } catch {
          // ignore
        }
      }

      return NextResponse.json({
        overallScore: mockSession.overallScore,
        structureScore: mockSession.structureScore,
        clarityScore: mockSession.clarityScore,
        depthScore: mockSession.depthScore,
        creativityScore: mockSession.creativityScore,
        feedback: mockSession.feedback,
        strengths,
        improvements,
      })
    }

    // Build conversation transcript for scoring
    const transcript = mockSession.messages
      .filter((m) => m.role === 'INTERVIEWER' || m.role === 'CANDIDATE')
      .map((m) => `${m.role === 'INTERVIEWER' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
      .join('\n\n')

    const categoryLabel = mockSession.category.replace(/_/g, ' ').toLowerCase()

    const scoringPrompt = `You are evaluating a PM mock interview transcript for a ${categoryLabel} interview at ${mockSession.difficulty} difficulty${mockSession.companyContext ? ` for ${mockSession.companyContext}` : ''}.

TRANSCRIPT:
${transcript}

Score the candidate's overall performance and provide detailed feedback.

Return ONLY valid JSON with this exact structure:
{
  "overallScore": <0-100 number>,
  "structureScore": <0-100 number>,
  "clarityScore": <0-100 number>,
  "depthScore": <0-100 number>,
  "creativityScore": <0-100 number>,
  "feedback": "<2-3 sentences of overall assessment>",
  "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "improvements": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"]
}`

    const scoringResponse = await callClaude({
      systemPrompt: SYSTEM_PROMPTS.MOCK_INTERVIEWER({
        category: categoryLabel,
        difficulty: mockSession.difficulty,
        company: mockSession.companyContext ?? undefined,
        role: 'Product Manager',
        experience: 'Mid',
      }),
      userMessage: scoringPrompt,
      maxTokens: 1024,
    })

    let scores: {
      overallScore: number
      structureScore: number
      clarityScore: number
      depthScore: number
      creativityScore: number
      feedback: string
      strengths: string[]
      improvements: string[]
    }

    try {
      scores = parseJSONFromAI(scoringResponse) as typeof scores
    } catch {
      // Fallback scores if parsing fails
      scores = {
        overallScore: 70,
        structureScore: 70,
        clarityScore: 70,
        depthScore: 70,
        creativityScore: 70,
        feedback: 'Interview completed. Detailed scoring unavailable.',
        strengths: ['Completed the interview'],
        improvements: ['Continue practicing'],
      }
    }

    // Persist scores and mark session complete
    await prisma.mockSession.update({
      where: { id: sessionId },
      data: {
        completedAt: new Date(),
        overallScore: scores.overallScore,
        structureScore: scores.structureScore,
        clarityScore: scores.clarityScore,
        depthScore: scores.depthScore,
        creativityScore: scores.creativityScore,
        feedback: scores.feedback,
      },
    })

    // Update progress entry score
    await prisma.progressEntry.updateMany({
      where: {
        userId,
        metadata: { path: ['sessionId'], equals: sessionId },
      },
      data: {
        score: scores.overallScore,
        timeSpent: Math.round(
          (Date.now() - mockSession.createdAt.getTime()) / 60000
        ),
      },
    })

    return NextResponse.json(scores)
  } catch (error) {
    console.error('[mock/end]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
