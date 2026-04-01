import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SettingsForm } from '@/components/settings/SettingsForm'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/signin')
  const userId = (session.user as { id?: string }).id!

  const [user, companies] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, image: true, targetRole: true, experienceLevel: true, interviewTimeline: true, weakAreas: true },
    }),
    prisma.targetCompany.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
  ])

  if (!user) redirect('/signin')

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your profile and interview preferences</p>
      </div>
      <SettingsForm
        user={{ ...user, interviewTimeline: user.interviewTimeline?.toISOString() ?? null }}
        companies={companies}
      />
    </div>
  )
}
