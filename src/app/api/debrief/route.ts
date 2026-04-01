import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { callClaude, parseJSONFromAI } from '@/lib/ai'
import { SYSTEM_PROMPTS } from '@/lib/ai-prompts'

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id?: string }).id!

    const debriefs = await prisma.debrief.findMany({
      where: { userId },
      orderBy: { interviewDate: 'desc' },
    })

    return NextResponse.json({ debriefs })
  } catch (error) {
    console.error('Debrief fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch debriefs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id?: string }).id!

    const body = await req.json()
    const {
      companyName,
      roleName,
      interviewDate,
      interviewRound,
      interviewerName,
      questionsAsked,
      overallFeeling,
      whatWentWell,
      whatWentPoorly,
      surprises,
    } = body

    if (!companyName || !roleName || !interviewDate || !questionsAsked || !overallFeeling) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const debriefContext = `
Company: ${companyName}
Role: ${roleName}
Interview Date: ${interviewDate}
Round: ${interviewRound || 'Unknown'}
Interviewer: ${interviewerName || 'Unknown'}
Overall Feeling: ${overallFeeling}/5

Questions Asked:
${Array.isArray(questionsAsked) ? questionsAsked.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n') : JSON.stringify(questionsAsked)}

What Went Well:
${whatWentWell || 'Not specified'}

What Went Poorly:
${whatWentPoorly || 'Not specified'}

Surprises:
${surprises || 'None mentioned'}
`.trim()

    const raw = await callClaude({
      systemPrompt: SYSTEM_PROMPTS.DEBRIEF_ANALYZER,
      userMessage: debriefContext,
      maxTokens: 4096,
    })

    const analysis = parseJSONFromAI(raw) as {
      areasToImprove?: string[]
      recommendedPrepActivities?: string[]
      patterns?: string[]
      perQuestionFeedback?: unknown[]
      overallInsights?: string
      nextRoundFocus?: string[]
    }

    const areasToImprove: string[] = analysis.areasToImprove || analysis.recommendedPrepActivities || []

    const debrief = await prisma.debrief.create({
      data: {
        userId,
        companyName: companyName.trim(),
        roleName: roleName.trim(),
        interviewDate: new Date(interviewDate),
        interviewRound: interviewRound || null,
        interviewerName: interviewerName || null,
        questionsAsked,
        overallFeeling: Math.min(5, Math.max(1, Number(overallFeeling))),
        whatWentWell: whatWentWell || null,
        whatWentPoorly: whatWentPoorly || null,
        surprises: surprises || null,
        aiAnalysis: raw,
        areasToImprove,
        followUpPlan: analysis.nextRoundFocus ? analysis.nextRoundFocus.join('; ') : null,
      },
    })

    await prisma.progressEntry.create({
      data: {
        userId,
        category: 'BEHAVIORAL',
        activity: 'DEBRIEF',
        timeSpent: 10,
        metadata: { debriefId: debrief.id, companyName, roleName },
      },
    })

    return NextResponse.json({ debrief, analysis }, { status: 201 })
  } catch (error) {
    console.error('Debrief create error:', error)
    return NextResponse.json({ error: 'Failed to create debrief' }, { status: 500 })
  }
}
