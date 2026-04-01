import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Building2, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AddCompanyForm } from '@/components/company/AddCompanyForm'

const TIER_COLORS: Record<string, string> = {
  FAANG: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  BIG_TECH: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  MID_STAGE: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  STARTUP: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  ENTERPRISE: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  OTHER: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
}

function toSlug(name: string) {
  return encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))
}

export default async function CompanyPrepPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/signin')
  const userId = (session.user as { id?: string }).id!

  const companies = await prisma.targetCompany.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Company Prep</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Research target companies and get AI-generated interview insights
        </p>
      </div>

      {/* Add company form */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Add a Target Company</h2>
        <AddCompanyForm />
      </div>

      {/* Company list */}
      {companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            No target companies yet. Add one above to get started.
          </p>
        </div>
      ) : (
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
            Your Target Companies ({companies.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {companies.map((company) => (
              <div
                key={company.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">{company.name}</h3>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${TIER_COLORS[company.tier] || TIER_COLORS.OTHER}`}>
                    {company.tier.replace(/_/g, ' ')}
                  </span>
                </div>
                {company.notes && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{company.notes}</p>
                )}
                <Link
                  href={`/company-prep/${toSlug(company.name)}`}
                  className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                  Deep Dive
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
