import { getSession } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, TrendingUp } from 'lucide-react'

export default async function DebriefDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session?.user) redirect('/signin')
  const userId = (session.user as { id?: string }).id!

  const debrief = await prisma.debrief.findFirst({ where: { id, userId } })
  if (!debrief) notFound()

  const feelingEmoji = ['', '😰', '😟', '😐', '🙂', '😄'][debrief.overallFeeling] ?? '😐'
  const questions = (debrief.questionsAsked as string[]) ?? []

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/debrief" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{debrief.companyName}</h1>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600 dark:text-slate-300">{debrief.roleName}</span>
            {debrief.interviewRound && (
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">{debrief.interviewRound}</span>
            )}
          </div>
          <p className="text-slate-500 text-sm">{new Date(debrief.interviewDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div className="text-4xl">{feelingEmoji}</div>
      </div>

      {/* Questions */}
      {questions.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-slate-900 dark:text-white">Questions Asked</h2>
          <ul className="space-y-2">
            {questions.map((q, i) => (
              <li key={i} className="flex gap-3 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 rounded-lg px-4 py-3 text-sm">
                <span className="text-slate-400 shrink-0 font-mono">{i + 1}.</span>
                {q}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Reflection */}
      <div className="grid md:grid-cols-2 gap-6">
        {debrief.whatWentWell && (
          <section className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5 space-y-2">
            <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">✓ What Went Well</h3>
            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{debrief.whatWentWell}</p>
          </section>
        )}
        {debrief.whatWentPoorly && (
          <section className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5 space-y-2">
            <h3 className="font-semibold text-red-700 dark:text-red-300 text-sm">✗ Areas to Improve</h3>
            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{debrief.whatWentPoorly}</p>
          </section>
        )}
      </div>

      {/* AI Analysis */}
      {debrief.aiAnalysis && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-slate-900 dark:text-white">AI Analysis</h2>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">{debrief.aiAnalysis}</p>
          </div>
        </section>
      )}

      {/* Areas to Improve */}
      {debrief.areasToImprove.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-slate-900 dark:text-white">Focus Areas</h2>
          <div className="flex flex-wrap gap-2">
            {debrief.areasToImprove.map((area, i) => (
              <span key={i} className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-3 py-1.5 rounded-lg text-sm font-medium">{area}</span>
            ))}
          </div>
        </section>
      )}

      {debrief.followUpPlan && (
        <section className="space-y-3">
          <h2 className="font-semibold text-slate-900 dark:text-white">Follow-up Plan</h2>
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5">
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{debrief.followUpPlan}</p>
          </div>
        </section>
      )}
    </div>
  )
}
