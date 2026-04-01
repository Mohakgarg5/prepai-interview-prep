'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface LessonQuizProps {
  lessonTitle: string
  practiceQuestions: string[]
  isComplete: boolean
  onComplete: (score?: number) => void
}

export function LessonQuiz({
  lessonTitle,
  practiceQuestions,
  isComplete,
  onComplete,
}: LessonQuizProps) {
  const [expanded, setExpanded] = useState(false)
  const [answers, setAnswers] = useState<string[]>(practiceQuestions.map(() => ''))
  const [submitted, setSubmitted] = useState(false)

  if (practiceQuestions.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {isComplete ? 'Lesson completed' : 'Mark this lesson as complete'}
          </span>
        </div>
        {!isComplete && (
          <Button
            size="sm"
            onClick={() => onComplete()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Mark Complete
          </Button>
        )}
        {isComplete && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Done
          </span>
        )}
      </div>
    )
  }

  const handleSubmit = () => {
    setSubmitted(true)
    onComplete()
  }

  const answeredCount = answers.filter((a) => a.trim().length > 20).length
  const canSubmit = answeredCount === practiceQuestions.length

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-sm font-medium text-slate-900 dark:text-white">
            Practice Questions ({practiceQuestions.length})
          </span>
          {isComplete && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Done
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="p-4 space-y-5">
          {practiceQuestions.map((question, i) => (
            <div key={i} className="space-y-2">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                <span className="text-slate-400 dark:text-slate-500 mr-2">{i + 1}.</span>
                {question}
              </p>
              <Textarea
                value={answers[i]}
                onChange={(e) => {
                  const updated = [...answers]
                  updated[i] = e.target.value
                  setAnswers(updated)
                }}
                placeholder="Write your answer here... Aim for 2-4 sentences with a clear structure."
                className="min-h-[90px] resize-none text-sm"
                disabled={submitted || isComplete}
              />
            </div>
          ))}

          <p className="text-xs text-slate-400 dark:text-slate-500 italic">
            These are open-ended — there is no single right answer. Use them as interview practice.
            Write as you would speak in an interview.
          </p>

          {!isComplete && !submitted && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {answeredCount}/{practiceQuestions.length} answered
              </span>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={cn(
                  'text-white',
                  canSubmit
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                )}
                size="sm"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Submit & Complete Lesson
              </Button>
            </div>
          )}

          {(isComplete || submitted) && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              Lesson complete! Great work.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
