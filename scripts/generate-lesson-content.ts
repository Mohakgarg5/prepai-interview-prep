/**
 * Lesson Content Generation Script
 * Seeds the DB with path/module/lesson structure from learn-data.ts, then generates AI lesson content.
 *
 * Usage:
 *   npx tsx scripts/generate-lesson-content.ts              # seed structure + generate all
 *   npx tsx scripts/generate-lesson-content.ts --seed-only  # only seed structure
 *   npx tsx scripts/generate-lesson-content.ts --path playbook  # generate one path
 *   npx tsx scripts/generate-lesson-content.ts --regenerate    # regenerate all (overwrite existing)
 */

import Anthropic from '@anthropic-ai/sdk'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { LEARN_PATHS } from '../src/lib/learn-data'
import { SYSTEM_PROMPTS } from '../src/lib/ai-prompts'

const MODEL = 'claude-sonnet-4-20250514'

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

function getAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
  return new Anthropic({ apiKey })
}

async function retrieveChunksForLesson(
  prisma: PrismaClient,
  lessonTitle: string
): Promise<string> {
  // Dynamic import to avoid circular reference at top level
  const OpenAI = (await import('openai')).default
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

  const embResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: lessonTitle.slice(0, 8000),
  })
  const embeddingStr = `[${embResponse.data[0].embedding.join(',')}]`

  const results = await prisma.$queryRaw<Array<{ content: string; source: string; chapterRef: string }>>`
    SELECT content, source, "chapterRef"
    FROM "KnowledgeChunk"
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT 10
  `

  if (results.length === 0) return ''

  return results
    .map((r, i) => `[${i + 1}] (${r.source} / ${r.chapterRef})\n${r.content}`)
    .join('\n\n')
}

async function generateLessonContent(
  anthropic: Anthropic,
  lessonTitle: string,
  keyTakeaways: string[],
  practiceQuestions: string[],
  interviewTip: string | null,
  sourceRefs: string[],
  retrievedChunks: string
): Promise<string> {
  const systemPrompt = SYSTEM_PROMPTS.LESSON_GENERATOR({
    lessonTitle,
    keyTakeaways,
    practiceQuestions,
    interviewTip,
    sourceRefs,
    retrievedChunks,
  })

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Generate the lesson content for: "${lessonTitle}"`,
      },
    ],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  return textBlock ? textBlock.text : ''
}

async function seedStructure(prisma: PrismaClient) {
  console.log('\n--- Seeding curriculum structure ---')

  for (const pathData of LEARN_PATHS) {
    // Upsert path
    const path = await prisma.learningPath.upsert({
      where: { slug: pathData.slug },
      update: {
        title: pathData.title,
        description: pathData.description,
        icon: pathData.icon,
        order: pathData.order,
      },
      create: {
        slug: pathData.slug,
        title: pathData.title,
        description: pathData.description,
        icon: pathData.icon,
        order: pathData.order,
      },
    })
    console.log(`  Path: ${path.slug}`)

    for (const moduleData of pathData.modules) {
      // Upsert module
      const module = await prisma.learningModule.upsert({
        where: { pathId_slug: { pathId: path.id, slug: moduleData.slug } },
        update: {
          title: moduleData.title,
          description: moduleData.description,
          weekNumber: moduleData.weekNumber,
          estimatedMinutes: moduleData.estimatedMinutes,
          order: moduleData.order,
        },
        create: {
          pathId: path.id,
          slug: moduleData.slug,
          title: moduleData.title,
          description: moduleData.description,
          weekNumber: moduleData.weekNumber,
          estimatedMinutes: moduleData.estimatedMinutes,
          order: moduleData.order,
        },
      })

      for (const lessonData of moduleData.lessons) {
        // Upsert lesson (without content — generated separately)
        await prisma.learningLesson.upsert({
          where: { moduleId_slug: { moduleId: module.id, slug: lessonData.slug } },
          update: {
            title: lessonData.title,
            keyTakeaways: lessonData.keyTakeaways,
            practiceQuestions: lessonData.practiceQuestions,
            interviewTip: lessonData.interviewTip,
            sourceRefs: lessonData.sourceRefs,
            estimatedMinutes: lessonData.estimatedMinutes,
            order: lessonData.order,
          },
          create: {
            moduleId: module.id,
            slug: lessonData.slug,
            title: lessonData.title,
            content: '',
            keyTakeaways: lessonData.keyTakeaways,
            practiceQuestions: lessonData.practiceQuestions,
            interviewTip: lessonData.interviewTip,
            sourceRefs: lessonData.sourceRefs,
            estimatedMinutes: lessonData.estimatedMinutes,
            order: lessonData.order,
          },
        })
      }

      console.log(`    Module: ${module.slug} (${moduleData.lessons.length} lessons)`)
    }
  }

  console.log('Structure seeding complete.')
}

async function generateContent(
  prisma: PrismaClient,
  anthropic: Anthropic,
  pathSlugFilter: string | null,
  regenerate: boolean
) {
  console.log('\n--- Generating lesson content ---')

  const hasChunks = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM "KnowledgeChunk"
  `
  const chunkCount = Number(hasChunks[0].count)

  if (chunkCount === 0) {
    console.warn(
      'WARNING: No knowledge chunks found in DB. Run ingest-content.ts first for best results.\n' +
        "Continuing with Claude's training knowledge only..."
    )
  } else {
    console.log(`Found ${chunkCount} knowledge chunks for RAG retrieval.`)
  }

  const whereClause = pathSlugFilter
    ? { path: { slug: pathSlugFilter } }
    : {}

  const modules = await prisma.learningModule.findMany({
    where: whereClause,
    include: {
      lessons: true,
      path: { select: { slug: true } },
    },
    orderBy: [{ path: { order: 'asc' } }, { order: 'asc' }],
  })

  let totalGenerated = 0
  let totalSkipped = 0

  for (const module of modules) {
    for (const lesson of module.lessons) {
      // Skip if already has content and --regenerate not set
      if (lesson.content && lesson.content.length > 100 && !regenerate) {
        totalSkipped++
        continue
      }

      // Skip diagnostic placeholder lesson
      if (lesson.slug === 'take-diagnostic') {
        totalSkipped++
        continue
      }

      console.log(`  Generating: [${module.path.slug}] ${lesson.title}`)

      try {
        const retrievedChunks = chunkCount > 0
          ? await retrieveChunksForLesson(prisma, lesson.title)
          : ''

        const content = await generateLessonContent(
          anthropic,
          lesson.title,
          lesson.keyTakeaways,
          lesson.practiceQuestions,
          lesson.interviewTip,
          lesson.sourceRefs,
          retrievedChunks
        )

        await prisma.learningLesson.update({
          where: { id: lesson.id },
          data: { content },
        })

        totalGenerated++
        console.log(`    Done (${content.length} chars)`)

        // Rate limit: avoid hitting API limits
        await new Promise((r) => setTimeout(r, 500))
      } catch (err) {
        console.error(`    ERROR generating ${lesson.slug}:`, err)
      }
    }
  }

  console.log(`\nGeneration complete. Generated: ${totalGenerated}, Skipped: ${totalSkipped}`)
}

async function main() {
  const args = process.argv.slice(2)
  const seedOnly = args.includes('--seed-only')
  const regenerate = args.includes('--regenerate')
  const pathIdx = args.indexOf('--path')
  const pathFilter = pathIdx !== -1 ? args[pathIdx + 1] : null

  const prisma = createPrisma()
  const anthropic = getAnthropic()

  try {
    await seedStructure(prisma)

    if (!seedOnly) {
      await generateContent(prisma, anthropic, pathFilter, regenerate)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
