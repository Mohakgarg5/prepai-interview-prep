import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { streamClaude } from '@/lib/ai'
import { SYSTEM_PROMPTS } from '@/lib/ai-prompts'
import { retrieveChunks, buildTutorContext, buildTutorMessages } from '@/lib/tutor'
import type { TutorMessage } from '@/types/learn'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { messages, lessonId } = body as {
      messages: TutorMessage[]
      lessonId?: string
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages is required' }, { status: 400 })
    }

    const latestUserMessage = messages.filter((m) => m.role === 'user').pop()
    if (!latestUserMessage) {
      return NextResponse.json({ error: 'No user message found' }, { status: 400 })
    }

    // Load lesson context if provided
    let lessonTitle: string | undefined
    let lessonContent: string | undefined
    let pathTitle: string | undefined

    if (lessonId) {
      const lesson = await prisma.learningLesson.findUnique({
        where: { id: lessonId },
        select: {
          title: true,
          content: true,
          module: { select: { path: { select: { title: true } } } },
        },
      })
      if (lesson) {
        lessonTitle = lesson.title
        lessonContent = lesson.content || undefined
        pathTitle = lesson.module.path.title
      }
    }

    // Retrieve relevant chunks from pgvector
    const chunks = await retrieveChunks(latestUserMessage.content).catch(() => [])

    // Build RAG context
    const context = buildTutorContext(chunks, lessonContent)

    // Build messages for Claude
    const history = messages.slice(0, -1) // all except the last user message
    const claudeMessages = buildTutorMessages(history, context, latestUserMessage.content)

    const systemPrompt = SYSTEM_PROMPTS.TUTOR({ lessonTitle, lessonContent, pathTitle })

    const stream = await streamClaude({
      systemPrompt,
      messages: claudeMessages,
      maxTokens: 2048,
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Tutor API error:', error)
    return NextResponse.json({ error: 'Failed to get tutor response' }, { status: 500 })
  }
}
