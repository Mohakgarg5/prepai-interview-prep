import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { callClaude, parseJSONFromAI } from '@/lib/ai'
import { SYSTEM_PROMPTS } from '@/lib/ai-prompts'

// In-memory cache: companyName (lowercase) → research data
const researchCache = new Map<string, { data: unknown; cachedAt: number }>()
const CACHE_TTL_MS = 1000 * 60 * 60 // 1 hour

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { slug } = await params
    // slug is the company name URL-encoded
    const companyName = decodeURIComponent(slug).replace(/-/g, ' ')
    const cacheKey = companyName.toLowerCase()

    const cached = researchCache.get(cacheKey)
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return NextResponse.json({ research: cached.data, cached: true })
    }

    const raw = await callClaude({
      systemPrompt: SYSTEM_PROMPTS.COMPANY_RESEARCHER(companyName),
      userMessage: `Research ${companyName}'s PM interview process and return the structured JSON.`,
      maxTokens: 4096,
    })

    const research = parseJSONFromAI(raw)
    researchCache.set(cacheKey, { data: research, cachedAt: Date.now() })

    return NextResponse.json({ research, cached: false })
  } catch (error) {
    console.error('Company research error:', error)
    return NextResponse.json({ error: 'Failed to research company' }, { status: 500 })
  }
}
