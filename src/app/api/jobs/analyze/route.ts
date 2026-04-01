import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { callClaude, parseJSONFromAI } from '@/lib/ai'
import { SYSTEM_PROMPTS } from '@/lib/ai-prompts'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { jdContent, userProfile } = body

    if (!jdContent) {
      return NextResponse.json({ error: 'Job description content is required' }, { status: 400 })
    }

    const profile = userProfile || 'Experienced PM candidate with product sense, execution, and cross-functional leadership skills'

    const raw = await callClaude({
      systemPrompt: SYSTEM_PROMPTS.JD_ANALYZER(profile),
      userMessage: `Analyze this job description:\n\n${jdContent}`,
      maxTokens: 4096,
    })

    const analysis = parseJSONFromAI(raw) as {
      keyRequirements?: string[]
      matchScore?: number
      prepPlan?: unknown
      mustHaveSkills?: string[]
      niceToHaveSkills?: string[]
      seniorityLevel?: string
      teamArea?: string
      matchBreakdown?: unknown
    }

    return NextResponse.json({
      keyRequirements: analysis.keyRequirements || [],
      matchScore: analysis.matchScore || null,
      suggestedPrep: {
        prepPlan: analysis.prepPlan,
        mustHaveSkills: analysis.mustHaveSkills,
        niceToHaveSkills: analysis.niceToHaveSkills,
        seniorityLevel: analysis.seniorityLevel,
        teamArea: analysis.teamArea,
        matchBreakdown: analysis.matchBreakdown,
      },
    })
  } catch (error) {
    console.error('JD analyze error:', error)
    return NextResponse.json({ error: 'Failed to analyze job description' }, { status: 500 })
  }
}
