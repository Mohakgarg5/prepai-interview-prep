'use client'

import ReactMarkdown from 'react-markdown'
import { Lightbulb, CheckCircle2, MessageSquare } from 'lucide-react'

interface LessonContentProps {
  content: string
  keyTakeaways: string[]
  interviewTip: string | null
}

export function LessonContent({ content, keyTakeaways, interviewTip }: LessonContentProps) {
  return (
    <div className="space-y-6">
      {/* Main content — MDX rendered via react-markdown + prose */}
      <div className="prose prose-slate dark:prose-invert prose-sm max-w-none
        prose-headings:font-semibold prose-headings:text-slate-900 dark:prose-headings:text-white
        prose-p:text-slate-700 dark:prose-p:text-slate-300
        prose-strong:text-slate-900 dark:prose-strong:text-white
        prose-li:text-slate-700 dark:prose-li:text-slate-300
        prose-code:text-blue-700 dark:prose-code:text-blue-300 prose-code:bg-blue-50 dark:prose-code:bg-blue-950/30 prose-code:px-1 prose-code:rounded">
        {content ? (
          <ReactMarkdown>{content}</ReactMarkdown>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <p className="text-slate-400 dark:text-slate-500 text-sm italic">
              Content is being generated — check back in a moment or use the AI Tutor to learn this topic now.
            </p>
          </div>
        )}
      </div>

      {/* Key Takeaways */}
      {keyTakeaways.length > 0 && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Key Takeaways</h3>
          </div>
          <ul className="space-y-2">
            {keyTakeaways.map((takeaway, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-emerald-800 dark:text-emerald-200">
                <span className="text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5">•</span>
                {takeaway}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Interview Tip */}
      {interviewTip && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Interview Tip</h3>
          </div>
          <p className="text-sm text-amber-800 dark:text-amber-200">{interviewTip}</p>
        </div>
      )}

      {/* Practice Questions preview */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-4">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Practice Questions</h3>
        </div>
        <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
          Test yourself on this lesson — scroll down to the quiz.
        </p>
      </div>
    </div>
  )
}
