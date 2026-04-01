import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { InterviewSession } from '@/components/mock-interview/InterviewSession'

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session?.user) redirect('/signin')

  const userId = (session.user as { id?: string }).id!
  const { id } = await params

  const mockSession = await prisma.mockSession.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { order: 'asc' } },
    },
  })

  if (!mockSession || mockSession.userId !== userId) redirect('/mock-interview')

  const sessionData = {
    id: mockSession.id,
    category: mockSession.category,
    difficulty: mockSession.difficulty,
    companyContext: mockSession.companyContext,
    timedMode: mockSession.timedMode,
    timeLimitMinutes: mockSession.timeLimitMinutes,
    overallScore: mockSession.overallScore,
    completedAt: mockSession.completedAt?.toISOString() ?? null,
  }

  const initialMessages = mockSession.messages.map((m) => ({
    id: m.id,
    role: m.role as 'INTERVIEWER' | 'CANDIDATE' | 'FEEDBACK' | 'HINT' | 'FOLLOWUP' | 'SYSTEM',
    content: m.content,
    order: m.order,
  }))

  return (
    <div className="h-full flex flex-col">
      <InterviewSession sessionData={sessionData} initialMessages={initialMessages} />
    </div>
  )
}
