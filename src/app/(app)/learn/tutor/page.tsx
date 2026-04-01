import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TutorChat } from '@/components/learn/TutorChat'
import { Bot, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function TutorPage() {
  const session = await getSession()
  if (!session?.user) redirect('/signin')

  const suggestedQuestions = [
    'What is the North Star Metric and how do I find one in an interview?',
    'Walk me through a RICE prioritization example',
    'Explain RAG vs fine-tuning for an AI product role interview',
    'How do I answer "why are metrics down 20%?" in an execution interview?',
    'What should I know about A/B testing for PM interviews?',
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <Link
          href="/learn"
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 dark:text-white">AI Tutor</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ask anything about PM concepts, frameworks, or interview prep
          </p>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden max-w-2xl w-full mx-auto">
        <TutorChat suggestedQuestions={suggestedQuestions} className="h-full" />
      </div>
    </div>
  )
}
