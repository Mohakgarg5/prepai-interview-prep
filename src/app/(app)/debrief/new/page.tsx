import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { DebriefForm } from '@/components/debrief/DebriefForm'

export default async function NewDebriefPage() {
  const session = await getSession()
  if (!session?.user) redirect('/signin')

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/debrief" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">New Interview Debrief</h1>
          <p className="text-slate-500 text-sm mt-0.5">Record your experience and get AI-powered analysis</p>
        </div>
      </div>
      <DebriefForm />
    </div>
  )
}
