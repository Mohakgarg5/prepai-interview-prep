/**
 * Batch ingest all PM course modules from DRRC Documents
 * Run: npx tsx scripts/ingest-course-modules.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import pdf from 'pdf-parse'
import OpenAI from 'openai'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const CHUNK_SIZE = 500
const CHUNK_OVERLAP = 50
const CHARS_PER_TOKEN = 4
const BATCH_SIZE = 20
const EMBEDDING_MODEL = 'text-embedding-3-small'

const BASE = '/Users/mohakgarg/Desktop/DRRC Documents/Product Management Course Material /'

const FILES: { source: string; file: string }[] = [
  // Lecture slides
  { source: 'pm-module-1',  file: BASE + 'Module 1 /M1 - Intro to Product Management Class.pptx (1) (1).pdf' },
  { source: 'pm-module-2',  file: BASE + 'Module 2/M2 - Intro to Product Management Class - Everything MRD _ Customers.pptx (2) (1).pdf' },
  { source: 'pm-module-3',  file: BASE + 'Module 3/M3- Discovery Lecture.pptx (3) (1).pdf' },
  { source: 'pm-module-4',  file: BASE + 'Module 4/M4 -Amazon & Apple & Design Lecture.pptx (2) (1).pdf' },
  { source: 'pm-module-5',  file: BASE + 'Module 5 /M5 - AI & Structure, People, and Process in Product Management (1) (1).pdf' },
  { source: 'pm-module-6',  file: BASE + 'Module 6/M6 - Intro to Product Management Class - Execution (everything PRD).pptx (2) (1).pdf' },
  { source: 'pm-module-7',  file: BASE + 'Module 7/M7 - Perfecting the Product.pptx (2) (1).pdf' },
  { source: 'pm-module-8',  file: BASE + 'Module 8/M8 - Data Planning and Product Platforms ML.pptx (1).pdf' },
  { source: 'pm-module-9',  file: BASE + 'Module 9/M9 - Intro to Product Management Class - Final Presentation (1) (1).pdf' },
  { source: 'pm-module-10', file: BASE + 'Module 10 /M10 - Intro to Product Management Class - Final Presentations_ (1).pdf' },
  // Class handouts
  { source: 'pm-class-2', file: BASE + 'Module 2/Class 2 - Assessing Product Opportunities.pdf' },
  { source: 'pm-class-3', file: BASE + 'Module 3/Class 3 - Discovery and Requirements Definition.pdf' },
  { source: 'pm-class-4', file: BASE + 'Module 4/Class 4 - Design & Usability.pdf' },
  { source: 'pm-class-5', file: BASE + 'Module 5 /Class 5 - AI Changing Product Management,.pdf' },
  { source: 'pm-class-6', file: BASE + 'Module 6/Class 6 - Taking Products to Market.pdf' },
  { source: 'pm-class-7', file: BASE + 'Module 7/Class 7 - Managing Whole Offers and Partner Ecosystemssignment.pdf' },
  { source: 'pm-class-8', file: BASE + 'Module 8/Class 8 - Product Management in Startup Firms & Ongoing Product Management.pdf' },
  { source: 'pm-class-9', file: BASE + 'Module 9/Class 9 - Advanced Product Strategies.pdf' },
  // Key readings
  { source: 'pm-reading-good-bad-pm',  file: BASE + 'Module 2/Reading 2 Good Product Manager Bad Product Manager .pdf' },
  { source: 'pm-reading-what-pms-do',  file: BASE + 'Module 2/Reading What_Do_Product_Managers_Do (1).pdf' },
  { source: 'pm-reading-job-fit',      file: BASE + 'Module 2/Reading 4 Finding the Right Job for Your Product (1).pdf' },
  { source: 'pm-reading-how-to-prd',   file: BASE + 'Module 3/How to Write a good PRD.pdf' },
  { source: 'pm-reading-mvp',          file: BASE + 'Module 3/Minimum Viable Product (1).pdf' },
  { source: 'pm-reading-lean-canvas',  file: BASE + 'Module 4/An Introduction to Lean Canvas \u2013 Steve Mullen \u2013 Medium.pdf' },
  { source: 'pm-reading-scrum',        file: BASE + 'Module 5 /The Scrum Primer.pdf' },
  { source: 'pm-reading-platform',     file: BASE + 'Module 7/The Platform Stack (1).pdf' },
  { source: 'pm-reading-paradox',      file: BASE + 'Module 8/The Paradox of Scaling.pdf' },
  { source: 'pm-reading-proliferation',file: BASE + 'Module 8/The Problem with Product Proliferation.pdf' },
  { source: 'pm-reading-guide-future', file: BASE + 'Module 9/Guiding_Your_Product_Future.pdf' },
]

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

function chunkText(text: string, chunkChars: number, overlapChars: number): string[] {
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(start + chunkChars, text.length)
    let chunk = text.slice(start, end)
    if (end < text.length) {
      const lastPeriod = chunk.lastIndexOf('. ')
      if (lastPeriod > chunkChars * 0.6) chunk = chunk.slice(0, lastPeriod + 1)
    }
    if (chunk.trim().length > 100) chunks.push(chunk.trim())
    const advance = chunk.length - overlapChars
    start += Math.max(advance, Math.floor(chunkChars / 2))
  }
  return chunks
}

async function embedBatch(texts: string[], openai: OpenAI): Promise<number[][]> {
  const response = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: texts })
  return response.data.map(d => d.embedding)
}

async function ingestOne(source: string, filePath: string, prisma: PrismaClient, openai: OpenAI) {
  if (!fs.existsSync(filePath)) {
    console.log(`  SKIP (not found): ${path.basename(filePath)}`)
    return 0
  }

  const buffer = fs.readFileSync(filePath)
  const data = await pdf(buffer)
  const text = data.text.replace(/\x00/g, '')
  const chunkChars = CHUNK_SIZE * CHARS_PER_TOKEN
  const overlapChars = CHUNK_OVERLAP * CHARS_PER_TOKEN
  const chunks = chunkText(text, chunkChars, overlapChars)

  if (chunks.length === 0) {
    console.log(`  SKIP (no text extracted): ${path.basename(filePath)}`)
    return 0
  }

  await prisma.$executeRaw`DELETE FROM "KnowledgeChunk" WHERE source = ${source}`

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE)
    const embeddings = await embedBatch(batch, openai)
    for (let j = 0; j < batch.length; j++) {
      const embeddingStr = `[${embeddings[j].join(',')}]`
      await prisma.$executeRaw`
        INSERT INTO "KnowledgeChunk" (id, source, "chapterRef", content, embedding, "createdAt")
        VALUES (gen_random_uuid()::text, ${source}, ${source}, ${batch[j]}, ${embeddingStr}::vector, NOW())
      `
    }
    if (i + BATCH_SIZE < chunks.length) await new Promise(r => setTimeout(r, 150))
  }
  return chunks.length
}

async function main() {
  const prisma = createPrisma()
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

  let total = 0
  for (const { source, file } of FILES) {
    process.stdout.write(`[${source}] `)
    try {
      const n = await ingestOne(source, file, prisma as unknown as import('@prisma/client').PrismaClient, openai)
      if (n > 0) { console.log(`${n} chunks`); total += n }
    } catch (e: unknown) {
      console.log(`ERROR: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  console.log(`\nTotal new chunks ingested: ${total}`)
  const counts = await prisma.$queryRaw<{ source: string; count: bigint }[]>`
    SELECT source, COUNT(*) as count FROM "KnowledgeChunk" GROUP BY source ORDER BY count DESC
  `
  console.log('\nFull knowledge base:')
  let grand = 0n
  for (const r of counts) { console.log(`  ${r.source}: ${r.count}`); grand += r.count }
  console.log(`  TOTAL: ${grand}`)

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
