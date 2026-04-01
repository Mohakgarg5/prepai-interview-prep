import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, ClipboardList } from 'lucide-react'

export default async function DebriefPage() {
  const session = await getSession()
  if (!session?.user) redirect('/signin')
  const userId = (session.user as { id?: string }).id!

  const debriefs = await prisma.debrief.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  const feelingEmoji = (f: number) => ['', '😰', '😟', '😐', '🙂', '😄'][f] ?? '😐'

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Interview Debrief</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Reflect on your interviews and get AI-powered improvement insights
          </p>
        </div>
        <Link href="/debrief/new">
          <Button className="bg-blue-700 hover:bg-blue-600 gap-2">
            <Plus className="w-4 h-4" /> New Debrief
          </Button>
        </Link>
      </div>

      {debriefs.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No debriefs yet</p>
          <p className="text-sm mt-2">After an interview, add a debrief to get AI analysis and improvement tips.</p>
          <Link href="/debrief/new" className="mt-4 inline-block">
            <Button className="bg-blue-700 hover:bg-blue-600 mt-4">Add Your First Debrief</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {debriefs.map((d) => (
            <Link key={d.id} href={`/debrief/${d.id}`}>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-blue-500 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">{d.companyName}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600 dark:text-slate-300 text-sm">{d.roleName}</span>
                      {d.interviewRound && (
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">{d.interviewRound}</span>
                      )}
                    </div>
                    <p className="text-slate-500 text-sm mt-1">
                      {new Date(d.interviewDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    {d.areasToImprove.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {d.areasToImprove.slice(0, 3).map((area, i) => (
                          <span key={i} className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded">
                            {area}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-3xl shrink-0">{feelingEmoji(d.overallFeeling)}</div>
                </div>
                {d.aiAnalysis && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-400 line-clamp-2">{d.aiAnalysis.slice(0, 150)}...</p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
