import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DIAGNOSTIC_QUESTIONS } from '@/lib/learn-data'
import type { DiagnosticResult, LearnSkillArea } from '@/types/learn'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { answers } = body as {
      answers: Array<{ questionId: string; selectedIndex: number }>
    }

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'answers array is required' }, { status: 400 })
    }

    // Score by skill area
    const areaCorrect: Record<LearnSkillArea, number> = {
      strategy: 0,
      execution: 0,
      metrics: 0,
      behavioral: 0,
      'ai-pm': 0,
    }
    const areaTotal: Record<LearnSkillArea, number> = {
      strategy: 0,
      execution: 0,
      metrics: 0,
      behavioral: 0,
      'ai-pm': 0,
    }

    for (const answer of answers) {
      const question = DIAGNOSTIC_QUESTIONS.find((q) => q.id === answer.questionId)
      if (!question) continue

      const area = question.skillArea as LearnSkillArea
      areaTotal[area] = (areaTotal[area] || 0) + 1

      if (answer.selectedIndex === question.correctIndex) {
        areaCorrect[area] = (areaCorrect[area] || 0) + 1
      }
    }

    // Compute scores (0–100)
    const scores: Record<LearnSkillArea, number> = {
      strategy: 0,
      execution: 0,
      metrics: 0,
      behavioral: 0,
      'ai-pm': 0,
    }
    const areas: LearnSkillArea[] = ['strategy', 'execution', 'metrics', 'behavioral', 'ai-pm']

    for (const area of areas) {
      const total = areaTotal[area] || 1
      scores[area] = Math.round((areaCorrect[area] / total) * 100)
    }

    // Find 2–3 weakest areas
    const sortedAreas = areas
      .filter((a) => areaTotal[a] > 0)
      .sort((a, b) => scores[a] - scores[b])

    const weakAreas = sortedAreas.slice(0, 2) as LearnSkillArea[]

    // Recommend a path based on weaknesses
    let recommendedPath = 'fast-track'
    if (weakAreas.includes('ai-pm')) {
      recommendedPath = 'ai-pm'
    } else if (scores.strategy < 50 && scores.execution < 50 && scores.metrics < 50) {
      recommendedPath = 'playbook' // very broad weakness → start from scratch
    }

    const result: DiagnosticResult = {
      weakAreas,
      scores,
      recommendedPath,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Diagnostic API error:', error)
    return NextResponse.json({ error: 'Failed to score diagnostic' }, { status: 500 })
  }
}
