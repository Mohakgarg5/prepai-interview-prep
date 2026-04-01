import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { streamClaude } from '@/lib/ai'
import { SYSTEM_PROMPTS } from '@/lib/ai-prompts'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = (session.user as { id?: string }).id!
    const { sessionId } = await params

    const body = await request.json()
    const { content } = body as { content: string }

    if (!content?.trim()) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    // Verify session ownership
    const mockSession = await prisma.mockSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: { orderBy: { order: 'asc' } },
      },
    })

    if (!mockSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (mockSession.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Save candidate message
    const nextOrder = mockSession.messages.length
    await prisma.mockMessage.create({
      data: {
        sessionId,
        role: 'CANDIDATE',
        content: content.trim(),
        order: nextOrder,
      },
    })

    // Load user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { targetRole: true, experienceLevel: true },
    })

    const role = user?.targetRole?.replace(/_/g, ' ') ?? 'Product Manager'
    const experience = user?.experienceLevel?.replace(/_/g, ' ') ?? 'Mid'
    const categoryLabel = mockSession.category.replace(/_/g, ' ').toLowerCase()

    const systemPrompt = SYSTEM_PROMPTS.MOCK_INTERVIEWER({
      category: categoryLabel,
      difficulty: mockSession.difficulty,
      company: mockSession.companyContext ?? undefined,
      role,
      experience,
    })

    // Build full conversation history for Claude
    const allMessages = [
      ...mockSession.messages,
      { role: 'CANDIDATE' as const, content: content.trim(), order: nextOrder },
    ]

    const claudeMessages: Array<{ role: 'user' | 'assistant'; content: string }> = allMessages.map((msg) => ({
      role: msg.role === 'CANDIDATE' ? 'user' : 'assistant',
      content: msg.content,
    }))

    // Stream response from Claude
    const stream = await streamClaude({
      systemPrompt,
      messages: claudeMessages,
      maxTokens: 1024,
    })

    // We need to buffer the full response to save it to the DB
    // while also streaming it to the client.
    // Use a TransformStream to tee the data.
    let fullResponse = ''
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const transformStream = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true })
        // Extract text content from SSE data lines
        const lines = text.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(line.slice(6))
              if (parsed.text) fullResponse += parsed.text
            } catch {
              // ignore parse errors
            }
          }
        }
        controller.enqueue(chunk)
      },
      async flush() {
        // Save the complete AI response to DB
        const savedOrder = nextOrder + 1
        const isJsonFeedback = fullResponse.includes('"scores"') && fullResponse.includes('"strengths"')
        const messageRole = isJsonFeedback ? 'FEEDBACK' : 'INTERVIEWER'

        await prisma.mockMessage.create({
          data: {
            sessionId,
            role: messageRole,
            content: fullResponse,
            order: savedOrder,
          },
        })
      },
    })

    const piped = stream.pipeThrough(transformStream)

    return new Response(piped, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('[mock/message]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
