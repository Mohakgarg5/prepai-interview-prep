import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TeardownArena } from '@/components/teardown/TeardownArena'

export default async function TeardownPage() {
  const session = await getSession()
  if (!session?.user) redirect('/signin')
  const userId = (session.user as { id?: string }).id!

  const recentAttempts = await prisma.teardownAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const serialized = recentAttempts.map(a => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    score: a.score ?? null,
    feedback: a.feedback ?? null,
  }))

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Teardown Arena</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Practice product thinking with AI-generated challenges and instant feedback
        </p>
      </div>
      <TeardownArena recentAttempts={serialized} />
    </div>
  )
}
