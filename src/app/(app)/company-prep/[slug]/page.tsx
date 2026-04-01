import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CompanyInsightSection } from '@/components/company/CompanyInsightSection'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function CompanyDeepDivePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/signin')

  const { slug } = await params
  const companyName = decodeURIComponent(slug).replace(/-/g, ' ')

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/company-prep"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">{companyName}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          AI-generated interview research and prep guide
        </p>
      </div>

      <CompanyInsightSection companyName={companyName} slug={slug} />
    </div>
  )
}
