import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { callClaude, parseJSONFromAI } from '@/lib/ai'
import { SYSTEM_PROMPTS } from '@/lib/ai-prompts'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id?: string }).id!

    const { productName, mode, challengePrompt, response } = await req.json()
    if (!productName || !mode || !challengePrompt || !response) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const userMessage = `Product: ${productName}
Mode: ${mode}

Challenge:
${challengePrompt}

Candidate's response:
${response}`

    const aiResponse = await callClaude({
      systemPrompt: SYSTEM_PROMPTS.TEARDOWN_EVALUATOR,
      userMessage,
      maxTokens: 2048,
    })

    const parsed = parseJSONFromAI(aiResponse) as {
      scores: { structure: number; insight: number; feasibility: number; creativity: number }
      strengths: string[]
      improvements: string[]
      sampleAnswer: string
    }

    const avgScore =
      (parsed.scores.structure +
        parsed.scores.insight +
        parsed.scores.feasibility +
        parsed.scores.creativity) /
      4

    const feedbackJson = JSON.stringify({
      strengths: parsed.strengths,
      improvements: parsed.improvements,
      sampleAnswer: parsed.sampleAnswer,
    })

    // Save attempt and progress entry in parallel
    const [attempt] = await Promise.all([
      prisma.teardownAttempt.create({
        data: {
          userId,
          productName,
          mode,
          prompt: challengePrompt,
          response,
          feedback: feedbackJson,
          score: avgScore,
        },
      }),
      prisma.progressEntry.create({
        data: {
          userId,
          category: 'PRODUCT_SENSE',
          activity: 'TEARDOWN',
          score: avgScore,
          timeSpent: 15,
          metadata: { productName, mode },
        },
      }),
    ])

    return NextResponse.json({
      attemptId: attempt.id,
      scores: parsed.scores,
      strengths: parsed.strengths,
      improvements: parsed.improvements,
      sampleAnswer: parsed.sampleAnswer,
      avgScore,
    })
  } catch (error) {
    console.error('Teardown submit error:', error)
    return NextResponse.json({ error: 'Failed to evaluate teardown' }, { status: 500 })
  }
}
