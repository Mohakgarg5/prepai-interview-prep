import { getSession } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { StoryDetail } from '@/components/stories/StoryDetail'

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session?.user) redirect('/signin')
  const userId = (session.user as { id?: string }).id!

  const { id } = await params

  const story = await prisma.behavioralStory.findFirst({
    where: { id, userId },
  })

  if (!story) notFound()

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <StoryDetail
        story={{
          id: story.id,
          title: story.title,
          rawContent: story.rawContent,
          situation: story.situation,
          task: story.task,
          action: story.action,
          result: story.result,
          themes: story.themes as string[],
          companies: story.companies,
          strength: story.strength,
          updatedAt: story.updatedAt.toISOString(),
        }}
      />
    </div>
  )
}
