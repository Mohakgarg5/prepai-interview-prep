import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { callClaude, parseJSONFromAI } from '@/lib/ai'
import { SYSTEM_PROMPTS } from '@/lib/ai-prompts'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { productName, mode } = await req.json()
    if (!productName || !mode) {
      return NextResponse.json({ error: 'productName and mode are required' }, { status: 400 })
    }

    const aiResponse = await callClaude({
      systemPrompt: SYSTEM_PROMPTS.TEARDOWN_GENERATOR(productName, mode),
      userMessage: `Generate a ${mode} challenge for ${productName}`,
      maxTokens: 1024,
    })

    const parsed = parseJSONFromAI(aiResponse) as {
      prompt: string
      hints: string[]
      evaluationCriteria: string[]
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Teardown generate error:', error)
    return NextResponse.json({ error: 'Failed to generate challenge' }, { status: 500 })
  }
}
