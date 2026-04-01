import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { callClaude, parseJSONFromAI } from '@/lib/ai'
import { SYSTEM_PROMPTS } from '@/lib/ai-prompts'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { rawContent } = await req.json()
    if (!rawContent) {
      return NextResponse.json({ error: 'rawContent is required' }, { status: 400 })
    }

    const aiResponse = await callClaude({
      systemPrompt: SYSTEM_PROMPTS.STORY_STRUCTURER,
      userMessage: rawContent,
      maxTokens: 2048,
    })

    const parsed = parseJSONFromAI(aiResponse) as {
      situation: string
      task: string
      action: string
      result: string
      suggestedThemes: string[]
      strengthRating: number
      improvementTips: string[]
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Story structure error:', error)
    return NextResponse.json({ error: 'Failed to structure story' }, { status: 500 })
  }
}
