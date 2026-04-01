/**
 * PDF Ingestion Script
 * Usage: npx tsx scripts/ingest-content.ts --source product-book --file pdfs/product-book.pdf
 *        npx tsx scripts/ingest-content.ts --source kellogg --file pdfs/kellogg-course.pdf
 *        npx tsx scripts/ingest-content.ts --source frameworks
 */

import * as fs from 'fs'
import * as path from 'path'
import pdf from 'pdf-parse'
import OpenAI from 'openai'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const CHUNK_SIZE = 500      // tokens (~2000 chars)
const CHUNK_OVERLAP = 50    // token overlap (~200 chars)
const CHARS_PER_TOKEN = 4   // rough approximation
const BATCH_SIZE = 20       // embeddings per OpenAI API call
const EMBEDDING_MODEL = 'text-embedding-3-small'

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')
  return new OpenAI({ apiKey })
}

function chunkText(text: string, chunkChars: number, overlapChars: number): string[] {
  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + chunkChars, text.length)
    let chunk = text.slice(start, end)

    // Try to break at a sentence boundary
    if (end < text.length) {
      const lastPeriod = chunk.lastIndexOf('. ')
      if (lastPeriod > chunkChars * 0.6) {
        chunk = chunk.slice(0, lastPeriod + 1)
      }
    }

    if (chunk.trim().length > 100) { // skip tiny chunks
      chunks.push(chunk.trim())
    }

    const advance = chunk.length - overlapChars
    start += Math.max(advance, Math.floor(chunkChars / 2)) // always advance
  }

  return chunks
}

function detectChapterRef(chunkIndex: number, totalChunks: number, source: string): string {
  // Assign chapter refs by position — rough heuristic
  if (source === 'product-book') {
    const chapterSize = Math.floor(totalChunks / 9)
    const chapter = Math.min(Math.floor(chunkIndex / Math.max(chapterSize, 1)) + 1, 9)
    return `ch${chapter}`
  }
  if (source === 'kellogg') {
    const moduleSize = Math.floor(totalChunks / 10)
    const module = Math.min(Math.floor(chunkIndex / Math.max(moduleSize, 1)) + 1, 10)
    return `module-${module}`
  }
  return 'general'
}

async function embedBatch(texts: string[], openai: OpenAI): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  })
  return response.data.map((d) => d.embedding)
}

async function ingestFrameworks(prisma: PrismaClient, openai: OpenAI) {
  // Import frameworks from knowledge-data.ts as chunks
  const { FRAMEWORKS } = await import('../src/lib/knowledge-data')

  console.log(`Ingesting ${FRAMEWORKS.length} frameworks...`)

  for (let i = 0; i < FRAMEWORKS.length; i += BATCH_SIZE) {
    const batch = FRAMEWORKS.slice(i, i + BATCH_SIZE)
    const texts = batch.map(
      (f: { name: string; description: string; whenToUse?: string; steps?: string[] }) =>
        `Framework: ${f.name}\n\nDescription: ${f.description}\n\nWhen to use: ${f.whenToUse || 'General PM use'}\n\nSteps: ${(f.steps || []).join('; ')}`
    )
    const embeddings = await embedBatch(texts, openai)

    for (let j = 0; j < batch.length; j++) {
      const framework = batch[j]
      const embeddingStr = `[${embeddings[j].join(',')}]`

      // Delete existing chunk for this framework if re-running
      await prisma.$executeRaw`
        DELETE FROM "KnowledgeChunk"
        WHERE source = 'frameworks' AND "chapterRef" = ${framework.name}
      `

      await prisma.$executeRaw`
        INSERT INTO "KnowledgeChunk" (id, source, "chapterRef", content, embedding, "createdAt")
        VALUES (
          gen_random_uuid()::text,
          'frameworks',
          ${framework.name},
          ${texts[j]},
          ${embeddingStr}::vector,
          NOW()
        )
      `
    }

    console.log(`  Embedded frameworks ${i + 1}–${Math.min(i + BATCH_SIZE, FRAMEWORKS.length)}`)
  }
}

async function ingestPDF(source: string, filePath: string, prisma: PrismaClient, openai: OpenAI) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`PDF not found: ${filePath}`)
  }

  const buffer = fs.readFileSync(filePath)
  const data = await pdf(buffer)
  const text = data.text.replace(/\x00/g, '')

  const chunkChars = CHUNK_SIZE * CHARS_PER_TOKEN
  const overlapChars = CHUNK_OVERLAP * CHARS_PER_TOKEN
  const chunks = chunkText(text, chunkChars, overlapChars)

  console.log(`Parsed ${chunks.length} chunks from ${path.basename(filePath)}`)

  // Delete existing chunks for this source if re-running
  await prisma.$executeRaw`DELETE FROM "KnowledgeChunk" WHERE source = ${source}`
  console.log(`  Cleared existing chunks for source: ${source}`)

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE)
    const embeddings = await embedBatch(batch, openai)

    for (let j = 0; j < batch.length; j++) {
      const chunkIndex = i + j
      const chapterRef = detectChapterRef(chunkIndex, chunks.length, source)
      const embeddingStr = `[${embeddings[j].join(',')}]`

      await prisma.$executeRaw`
        INSERT INTO "KnowledgeChunk" (id, source, "chapterRef", content, embedding, "createdAt")
        VALUES (
          gen_random_uuid()::text,
          ${source},
          ${chapterRef},
          ${batch[j]},
          ${embeddingStr}::vector,
          NOW()
        )
      `
    }

    const pct = Math.round(((i + BATCH_SIZE) / chunks.length) * 100)
    console.log(`  Progress: ${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length} chunks (${pct}%)`)

    // Rate limit: small delay between batches
    if (i + BATCH_SIZE < chunks.length) {
      await new Promise((r) => setTimeout(r, 200))
    }
  }
}

async function main() {
  const args = process.argv.slice(2)
  const sourceIdx = args.indexOf('--source')
  const fileIdx = args.indexOf('--file')

  const source = sourceIdx !== -1 ? args[sourceIdx + 1] : null
  const filePath = fileIdx !== -1 ? args[fileIdx + 1] : null

  if (!source) {
    console.error('Usage: npx tsx scripts/ingest-content.ts --source <product-book|kellogg|frameworks> [--file <path>]')
    process.exit(1)
  }

  const prisma = createPrisma()
  const openai = getOpenAI()

  try {
    if (source === 'frameworks') {
      await ingestFrameworks(prisma as unknown as import('@prisma/client').PrismaClient, openai)
    } else {
      if (!filePath) {
        console.error(`--file is required for source: ${source}`)
        process.exit(1)
      }
      await ingestPDF(source, filePath, prisma as unknown as import('@prisma/client').PrismaClient, openai)
    }

    const count = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "KnowledgeChunk" WHERE source = ${source}
    `
    console.log(`\nDone. Total chunks for "${source}": ${count[0].count}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
