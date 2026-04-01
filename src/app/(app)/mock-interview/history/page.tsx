import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ClipboardList, ChevronRight } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  PRODUCT_SENSE: 'Product Sense',
  EXECUTION: 'Execution',
  STRATEGY: 'Strategy',
  BEHAVIORAL: 'Behavioral',
  ESTIMATION: 'Estimation',
  TECHNICAL_AI: 'Technical/AI',
  ML_SYSTEM_DESIGN: 'ML System Design',
  AI_ETHICS: 'AI Ethics',
  METRICS: 'Metrics',
  PRODUCT_DESIGN: 'Product Design',
}

const DIFFICULTY_STYLES: Record<string, string> = {
  EASY: 'bg-emerald-900/40 text-emerald-300 border-emerald-700',
  MEDIUM: 'bg-amber-900/40 text-amber-300 border-amber-700',
  HARD: 'bg-orange-900/40 text-orange-300 border-orange-700',
  FAANG_LEVEL: 'bg-red-900/40 text-red-300 border-red-700',
}

function scoreColor(score: number | null): string {
  if (score === null) return 'text-slate-500'
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-red-400'
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function getDuration(createdAt: Date, completedAt: Date | null): string {
  if (!completedAt) return 'In progress'
  const minutes = Math.round((completedAt.getTime() - createdAt.getTime()) / 60000)
  if (minutes < 1) return '< 1 min'
  return `${minutes} min`
}

export default async function MockInterviewHistoryPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/signin')

  const userId = (session.user as { id?: string }).id!

  const sessions = await prisma.mockSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      category: true,
      difficulty: true,
      companyContext: true,
      overallScore: true,
      createdAt: true,
      completedAt: true,
      timedMode: true,
      timeLimitMinutes: true,
    },
  })

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/mock-interview">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Interview History</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} total
          </p>
        </div>
      </div>

      {/* Empty state */}
      {sessions.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
            <ClipboardList className="w-7 h-7 text-slate-500" />
          </div>
          <h2 className="text-white font-semibold text-lg mb-2">No sessions yet</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-xs">
            Complete your first mock interview to start tracking your progress.
          </p>
          <Link href="/mock-interview">
            <Button className="bg-blue-700 hover:bg-blue-600 text-white">
              Start an Interview
            </Button>
          </Link>
        </div>
      )}

      {/* Sessions list */}
      {sessions.length > 0 && (
        <div className="space-y-3">
          {sessions.map((s) => {
            const categoryLabel = CATEGORY_LABELS[s.category] ?? s.category
            const difficultyStyle = DIFFICULTY_STYLES[s.difficulty] ?? 'bg-slate-800 text-slate-300 border-slate-600'
            const isCompleted = !!s.completedAt

            return (
              <Link
                key={s.id}
                href={`/mock-interview/session/${s.id}`}
                className="block group"
              >
                <div className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 flex items-center gap-4 hover:border-slate-700 hover:bg-slate-800/60 transition-all">
                  {/* Score circle */}
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    {isCompleted && s.overallScore !== null ? (
                      <span className={`text-lg font-bold ${scoreColor(s.overallScore)}`}>
                        {Math.round(s.overallScore)}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium text-center leading-tight">
                        {isCompleted ? 'N/A' : 'Live'}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-white font-medium text-sm">{categoryLabel}</span>
                      <Badge variant="outline" className={`text-xs ${difficultyStyle}`}>
                        {s.difficulty.replace(/_/g, ' ')}
                      </Badge>
                      {s.companyContext && (
                        <Badge variant="outline" className="text-xs border-slate-700 text-slate-400 bg-slate-800/50">
                          {s.companyContext}
                        </Badge>
                      )}
                      {!isCompleted && (
                        <Badge variant="outline" className="text-xs border-blue-700 text-blue-400 bg-blue-900/30">
                          In progress
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{formatDate(s.createdAt)}</span>
                      <span>&middot;</span>
                      <span>{getDuration(s.createdAt, s.completedAt)}</span>
                      {s.timedMode && (
                        <>
                          <span>&middot;</span>
                          <span>Timed{s.timeLimitMinutes ? ` (${s.timeLimitMinutes}m)` : ''}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
