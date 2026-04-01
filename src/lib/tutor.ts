import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import type { KnowledgeChunk, TutorMessage } from '@/types/learn'

const EMBEDDING_MODEL = 'text-embedding-3-small'
const TOP_K = 5
const TOP_K_DIVERSE = 20  // fetch more, then pick diverse subset
const MAX_PER_SOURCE = 2  // max chunks from same source to avoid one book dominating

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

  if (sourceFilter) {
    return prisma.$queryRaw<KnowledgeChunk[]>`
      SELECT id, source, "chapterRef", content
      FROM "KnowledgeChunk"
      WHERE source = ${sourceFilter}
      ORDER BY embedding <=> ${embeddingStr}::vector
      LIMIT ${TOP_K}
    `
  }

  // Fetch a larger pool ranked by similarity, then enforce source diversity
  const pool = await prisma.$queryRaw<KnowledgeChunk[]>`
    SELECT id, source, "chapterRef", content
    FROM "KnowledgeChunk"
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT ${TOP_K_DIVERSE}
  `

  // Pick top chunks while capping contribution per source
  const sourceCounts: Record<string, number> = {}
  const diverse: KnowledgeChunk[] = []
  for (const chunk of pool) {
    const count = sourceCounts[chunk.source] ?? 0
    if (count < MAX_PER_SOURCE) {
      diverse.push(chunk)
      sourceCounts[chunk.source] = count + 1
    }
    if (diverse.length >= TOP_K) break
  }
  return diverse
}

export async function retrieveChunksForLesson(
  lessonTitle: string,
  sourceRefs: string[]
): Promise<KnowledgeChunk[]> {
  const embedding = await embedText(lessonTitle)
  const embeddingStr = `[${embedding.join(',')}]`

  // Retrieve chunks for lesson generation — diverse pool from all sources
  const pool = await prisma.$queryRaw<KnowledgeChunk[]>`
    SELECT id, source, "chapterRef", content
    FROM "KnowledgeChunk"
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT 30
  `
  // Cap at 2 per source for diversity, keep top 15
  const sourceCounts: Record<string, number> = {}
  const results: KnowledgeChunk[] = []
  for (const chunk of pool) {
    const count = sourceCounts[chunk.source] ?? 0
    if (count < 2) { results.push(chunk); sourceCounts[chunk.source] = count + 1 }
    if (results.length >= 15) break
  }
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
