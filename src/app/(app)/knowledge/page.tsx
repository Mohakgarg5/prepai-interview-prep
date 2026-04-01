import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { FRAMEWORKS_DATA } from '@/lib/constants'
import { KnowledgeSearch } from '@/components/shared/KnowledgeSearch'
import { KnowledgeGrid } from '@/components/shared/KnowledgeGrid'
import {
  BarChart2,
  Target,
  TrendingUp,
  MessageSquare,
  Brain,
  BookOpen,
} from 'lucide-react'
import { Suspense } from 'react'

const CATEGORY_CONFIG = {
  prioritization: {
    label: 'Prioritization',
    icon: BarChart2,
    color: 'text-blue-400',
    bg: 'bg-blue-900/30',
    border: 'border-blue-800/50',
    dot: 'bg-blue-500',
  },
  metrics: {
    label: 'Metrics',
    icon: TrendingUp,
    color: 'text-emerald-400',
    bg: 'bg-emerald-900/30',
    border: 'border-emerald-800/50',
    dot: 'bg-emerald-500',
  },
  strategy: {
    label: 'Product Strategy',
    icon: Target,
    color: 'text-violet-400',
    bg: 'bg-violet-900/30',
    border: 'border-violet-800/50',
    dot: 'bg-violet-500',
  },
  communication: {
    label: 'Communication',
    icon: MessageSquare,
    color: 'text-amber-400',
    bg: 'bg-amber-900/30',
    border: 'border-amber-800/50',
    dot: 'bg-amber-500',
  },
  aipm: {
    label: 'AI-PM Concepts',
    icon: Brain,
    color: 'text-pink-400',
    bg: 'bg-pink-900/30',
    border: 'border-pink-800/50',
    dot: 'bg-pink-500',
  },
} as const

type CategoryKey = keyof typeof CATEGORY_CONFIG

const ALL_FRAMEWORKS = Object.entries(FRAMEWORKS_DATA).flatMap(([cat, items]) =>
  items.map((item) => ({ ...item, categoryKey: cat as CategoryKey }))
)

const TOTAL_COUNT = ALL_FRAMEWORKS.length

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string }>
}) {
  const session = await getSession()
  if (!session?.user) redirect('/signin')

  const { q, cat } = await searchParams
  const query = q?.toLowerCase().trim() ?? ''
  const activeCategory = (cat as CategoryKey) ?? null

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-5 w-5 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Core PM frameworks, concepts, and mental models — {TOTAL_COUNT} total
          </p>
        </div>
        <Suspense>
          <KnowledgeSearch className="w-full sm:w-72" />
        </Suspense>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        <Suspense>
          <KnowledgeGrid
            frameworks={ALL_FRAMEWORKS}
            categoryConfig={CATEGORY_CONFIG}
            query={query}
            activeCategory={activeCategory}
          />
        </Suspense>
      </div>
    </div>
  )
}
