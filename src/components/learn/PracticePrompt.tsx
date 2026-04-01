'use client'

import Link from 'next/link'
import { MessageSquare, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PracticePromptProps {
  lessonTitle: string
}

function getInterviewCategory(lessonTitle: string): string {
  const title = lessonTitle.toLowerCase()
  if (title.includes('metric') || title.includes('aarrr') || title.includes('north star')) return 'METRICS'
  if (title.includes('strategy') || title.includes('market') || title.includes('competitive')) return 'STRATEGY'
  if (title.includes('execut') || title.includes('roadmap') || title.includes('priorit')) return 'EXECUTION'
  if (title.includes('behavioral') || title.includes('star') || title.includes('leadership')) return 'BEHAVIORAL'
  if (title.includes('ai') || title.includes('llm') || title.includes('ml') || title.includes('rag')) return 'TECHNICAL_AI'
  if (title.includes('design') || title.includes('ux') || title.includes('user')) return 'PRODUCT_DESIGN'
  return 'PRODUCT_SENSE'
}

export function PracticePrompt({ lessonTitle }: PracticePromptProps) {
  const category = getInterviewCategory(lessonTitle)
  const categoryLabel = category.replace(/_/g, ' ').toLowerCase()

  return (
    <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shrink-0">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
            Ready to practice in a real interview?
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Start a mock interview focused on <span className="font-medium">{categoryLabel}</span> —
            the category that matches what you just learned.
          </p>
        </div>
        <Link
          href={`/mock-interview?category=${category}`}
          className="shrink-0"
        >
          <Button size="sm" className="bg-blue-800 hover:bg-blue-900 text-white gap-1.5 whitespace-nowrap">
            Practice Now
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
