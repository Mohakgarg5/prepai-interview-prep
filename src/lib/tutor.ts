import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import type { KnowledgeChunk, TutorMessage } from '@/types/learn'

const EMBEDDING_MODEL = 'text-embedding-3-small'
const TOP_K = 5

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')
  return new OpenAI({ apiKey })
}

export async function embedText(text: string): Promise<number[]> {
  const client = getOpenAIClient()
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000), // stay within token limit
  })
  return response.data[0].embedding
}

export async function retrieveChunks(query: string, sourceFilter?: string): Promise<KnowledgeChunk[]> {
  const embedding = await embedText(query)
  const embeddingStr = `[${embedding.join(',')}]`

  let results: KnowledgeChunk[]

  if (sourceFilter) {
    results = await prisma.$queryRaw<KnowledgeChunk[]>`
      SELECT id, source, "chapterRef", content
      FROM "KnowledgeChunk"
      WHERE source = ${sourceFilter}
      ORDER BY embedding <=> ${embeddingStr}::vector
      LIMIT ${TOP_K}
    `
  } else {
    results = await prisma.$queryRaw<KnowledgeChunk[]>`
      SELECT id, source, "chapterRef", content
      FROM "KnowledgeChunk"
      ORDER BY embedding <=> ${embeddingStr}::vector
      LIMIT ${TOP_K}
    `
  }

  return results
}

export async function retrieveChunksForLesson(
  lessonTitle: string,
  sourceRefs: string[]
): Promise<KnowledgeChunk[]> {
  const embedding = await embedText(lessonTitle)
  const embeddingStr = `[${embedding.join(',')}]`

  // Retrieve more chunks for lesson generation — top 10
  const results = await prisma.$queryRaw<KnowledgeChunk[]>`
    SELECT id, source, "chapterRef", content
    FROM "KnowledgeChunk"
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT 10
  `
  return results
}

export function buildTutorContext(
  chunks: KnowledgeChunk[],
  lessonContent?: string
): string {
  const parts: string[] = []

  if (lessonContent) {
    parts.push(`CURRENT LESSON:\n${lessonContent.slice(0, 1500)}`)
  }

  if (chunks.length > 0) {
    parts.push(
      'RETRIEVED SOURCE MATERIAL:\n' +
        chunks
          .map((c, i) => `[${i + 1}] (${c.source} / ${c.chapterRef})\n${c.content}`)
          .join('\n\n')
    )
  }

  return parts.join('\n\n---\n\n')
}

export function buildTutorMessages(
  conversationHistory: TutorMessage[],
  context: string,
  newUserMessage: string
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []

  // Prepend the first user message with context injection
  const contextualFirstMessage =
    conversationHistory.length === 0
      ? `${context ? `<context>\n${context}\n</context>\n\n` : ''}${newUserMessage}`
      : newUserMessage

  // Add history
  for (const msg of conversationHistory) {
    messages.push({ role: msg.role, content: msg.content })
  }

  messages.push({ role: 'user', content: contextualFirstMessage })

  return messages
}
