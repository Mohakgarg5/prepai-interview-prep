import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { FRAMEWORKS_DATA } from '@/lib/constants'
import { KnowledgeSearch } from '@/components/shared/KnowledgeSearch'
import { KnowledgeGrid } from '@/components/shared/KnowledgeGrid'
import { BookOpen } from 'lucide-react'
import { Suspense } from 'react'

export type CategoryKey = 'prioritization' | 'metrics' | 'strategy' | 'communication' | 'aipm'

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

      <Suspense>
        <KnowledgeGrid
          frameworks={ALL_FRAMEWORKS}
          query={query}
          activeCategory={activeCategory}
        />
      </Suspense>
    </div>
  )
}
