import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { JobsClient } from '@/components/jobs/JobsClient'

export default async function JobsPage() {
  const session = await getSession()
  if (!session?.user) redirect('/signin')
  const userId = (session.user as { id?: string }).id!

  const jobs = await prisma.savedJob.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  const serialized = jobs.map((j) => ({
    ...j,
    createdAt: j.createdAt.toISOString(),
    matchScore: j.matchScore ?? null,
    suggestedPrep: j.suggestedPrep ?? null,
  }))

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Job Tracker</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Track your applications and get AI-powered prep for each role
          </p>
        </div>
      </div>
      <JobsClient initialJobs={serialized} />
    </div>
  )
}
