import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { LessonView } from '@/components/learn/LessonView'
import { callClaude } from '@/lib/ai'
import { SYSTEM_PROMPTS } from '@/lib/ai-prompts'
import { retrieveChunksForLesson, buildTutorContext } from '@/lib/tutor'
import type { LessonWithProgress } from '@/types/learn'

interface Props {
  params: Promise<{ track: string; module: string; lesson: string }>
}

async function generateAndCacheContent(lessonId: string, lesson: {
  title: string
  keyTakeaways: string[]
  practiceQuestions: string[]
  interviewTip: string | null
  sourceRefs: string[]
}): Promise<string> {
  const chunks = await retrieveChunksForLesson(lesson.title, lesson.sourceRefs).catch(() => [])
  const retrievedChunks = buildTutorContext(chunks)

  const content = await callClaude({
    systemPrompt: SYSTEM_PROMPTS.LESSON_GENERATOR({
      lessonTitle: lesson.title,
      keyTakeaways: lesson.keyTakeaways,
      practiceQuestions: lesson.practiceQuestions,
      interviewTip: lesson.interviewTip,
      sourceRefs: lesson.sourceRefs,
      retrievedChunks,
    }),
    userMessage: `Generate the lesson content for: "${lesson.title}"`,
    maxTokens: 2048,
  })

  await prisma.learningLesson.update({
    where: { id: lessonId },
    data: { content },
  })

  return content
}

export default async function LessonPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/signin')
  const userId = (session.user as { id?: string }).id!

  const { track, module: moduleSlug, lesson: lessonSlug } = await params

  const path = await prisma.learningPath.findUnique({ where: { slug: track } })
  if (!path) notFound()

  const mod = await prisma.learningModule.findUnique({
    where: { pathId_slug: { pathId: path.id, slug: moduleSlug } },
    include: { lessons: { orderBy: { order: 'asc' } } },
  })
  if (!mod) notFound()

  const lessonIndex = mod.lessons.findIndex((l) => l.slug === lessonSlug)
  if (lessonIndex === -1) notFound()

  let lesson = mod.lessons[lessonIndex]

  if (!lesson.content || lesson.content.length < 50) {
    const generated = await generateAndCacheContent(lesson.id, {
      title: lesson.title,
      keyTakeaways: lesson.keyTakeaways,
      practiceQuestions: lesson.practiceQuestions,
      interviewTip: lesson.interviewTip,
      sourceRefs: lesson.sourceRefs,
    }).catch(() => '')

    if (generated) {
      lesson = { ...lesson, content: generated }
    }
  }

  const progress = await prisma.userLessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId: lesson.id } },
  })

  const lessonWithProgress: LessonWithProgress = { ...lesson, progress: progress ?? null }

  const prevLesson = lessonIndex > 0 ? mod.lessons[lessonIndex - 1] : null
  const nextLesson = lessonIndex < mod.lessons.length - 1 ? mod.lessons[lessonIndex + 1] : null

  return (
    <LessonView
      lesson={lessonWithProgress}
      pathSlug={track}
      moduleSlug={moduleSlug}
      prevLesson={prevLesson ? { slug: prevLesson.slug, title: prevLesson.title } : null}
      nextLesson={nextLesson ? { slug: nextLesson.slug, title: nextLesson.title } : null}
    />
  )
}
