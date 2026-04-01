'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { BEHAVIORAL_THEMES } from '@/lib/constants'
import {
  ArrowLeft,
  Edit3,
  Star,
  RefreshCw,
  MessageSquare,
  Loader2,
  Building2,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { StoryForm } from './StoryForm'

interface Story {
  id: string
  title: string
  rawContent: string
  situation: string | null
  task: string | null
  action: string | null
  result: string | null
  themes: string[]
  companies: string[]
  strength: number
  updatedAt: string
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={cn('text-lg', i < value ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600')}
        >
          ★
        </span>
      ))}
      <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">{value}/5</span>
    </div>
  )
}

function StarField({ label, content }: { label: string; content: string | null }) {
  const filled = !!content
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {filled ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
        ) : (
          <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
        )}
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </h4>
      </div>
      {filled ? (
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-6">{content}</p>
      ) : (
        <p className="text-sm text-slate-400 dark:text-slate-600 italic pl-6">Not filled in yet</p>
      )}
    </div>
  )
}

const PRACTICE_QUESTIONS: Record<string, string[]> = {
  LEADERSHIP: [
    'Tell me about a time you led a team through a major challenge.',
    'Describe a situation where you had to influence others without direct authority.',
    'Give an example of when you set direction for a product despite ambiguity.',
  ],
  CONFLICT_RESOLUTION: [
    'Tell me about a conflict you had with a stakeholder and how you resolved it.',
    'Describe a time you had to navigate disagreement within your team.',
    'How have you handled pushback on a product decision you strongly believed in?',
  ],
  FAILURE_AND_LEARNING: [
    'Tell me about a product decision that didn\'t go as planned. What did you learn?',
    'Describe a time you failed to hit a goal. How did you respond?',
    'What\'s the biggest mistake you\'ve made as a PM, and how did you grow from it?',
  ],
  DATA_DRIVEN_DECISION: [
    'Tell me about a time data changed your product direction.',
    'How have you used metrics to prioritize features?',
    'Describe a situation where you had to make a decision with incomplete data.',
  ],
  AMBIGUITY: [
    'Tell me about a time you had to make a decision with very little information.',
    'How do you approach a problem when the requirements are unclear?',
    'Describe a time you set direction for a product in a brand-new space.',
  ],
  CROSS_FUNCTIONAL: [
    'Tell me about a time you worked across teams to ship a product.',
    'How have you aligned engineering, design, and business on a shared goal?',
    'Describe a cross-functional project that required you to manage competing priorities.',
  ],
  CUSTOMER_OBSESSION: [
    'Tell me about a time you deeply understood a customer pain point and built for it.',
    'How have you incorporated user feedback into your product decisions?',
    'Describe a time you had to advocate for the customer against internal pressure.',
  ],
  INNOVATION: [
    'Tell me about a time you proposed a creative solution to a hard problem.',
    'How have you driven innovation within your team or organization?',
    'Describe a product bet you took that others were skeptical about.',
  ],
  PRIORITIZATION: [
    'How do you decide what to build next when everything feels urgent?',
    'Tell me about a time you had to say no to a stakeholder request.',
    'Describe a situation where you had to ruthlessly cut scope to ship.',
  ],
  INFLUENCE_WITHOUT_AUTHORITY: [
    'Tell me about a time you got buy-in from a team you had no authority over.',
    'How have you persuaded senior leadership to support your product vision?',
    'Describe a time you drove alignment across functions without direct power.',
  ],
  TECHNICAL_DEPTH: [
    'Tell me about a time your technical understanding helped you make a better product decision.',
    'How do you work with engineers to navigate technical tradeoffs?',
    'Describe a situation where you had to learn a technical concept quickly to unblock your team.',
  ],
  STAKEHOLDER_MANAGEMENT: [
    'Tell me about a time you managed conflicting stakeholder priorities.',
    'How do you keep executive stakeholders aligned on product direction?',
    'Describe a time you had to deliver bad news to a senior stakeholder.',
  ],
}

function getQuestions(themes: string[]): string[] {
  const questions: string[] = []
  for (const theme of themes.slice(0, 3)) {
    const q = PRACTICE_QUESTIONS[theme]
    if (q) questions.push(q[Math.floor(Math.random() * q.length)])
  }
  // Fill up to 3 with generic questions if needed
  const generic = [
    'Walk me through a challenging PM situation using this story.',
    'What would you do differently if you could revisit this experience?',
    'How does this story demonstrate your core PM strengths?',
  ]
  while (questions.length < 3) {
    questions.push(generic[questions.length])
  }
  return questions.slice(0, 3)
}

export function StoryDetail({ story: initialStory }: { story: Story }) {
  const router = useRouter()
  const [story, setStory] = useState(initialStory)
  const [editing, setEditing] = useState(false)
  const [practiceOpen, setPracticeOpen] = useState(false)
  const [rerating, setRerating] = useState(false)
  const [rateResult, setRateResult] = useState<{ rating: number; reasoning: string; suggestions: string[] } | null>(null)
  const [rateOpen, setRateOpen] = useState(false)

  async function handleRerate() {
    setRerating(true)
    try {
      const content = [story.situation, story.task, story.action, story.result]
        .filter(Boolean)
        .join('\n\n')
      const res = await fetch('/api/stories/structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawContent: content || story.rawContent }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (typeof data.strengthRating === 'number') {
        const newStrength = Math.min(5, Math.max(1, data.strengthRating))
        await fetch(`/api/stories/${story.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ strength: newStrength }),
        })
        setStory((prev) => ({ ...prev, strength: newStrength }))
        setRateResult({
          rating: newStrength,
          reasoning: `AI assessed your story at ${newStrength}/5.`,
          suggestions: data.improvementTips ?? [],
        })
        setRateOpen(true)
      }
    } catch {
      // silent
    } finally {
      setRerating(false)
    }
  }

  const practiceQuestions = getQuestions(story.themes)

  if (editing) {
    return (
      <div>
        <button
          onClick={() => setEditing(false)}
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to story
        </button>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Edit Story</h2>
        <StoryForm initialData={story} />
      </div>
    )
  }

  const themeLabels = story.themes.map((t) => {
    const found = BEHAVIORAL_THEMES.find((b) => b.value === t)
    return found?.label ?? t
  })

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/stories"
        className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Story Bank
      </Link>

      {/* Header card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
            {story.title}
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(true)}
            className="shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </Button>
        </div>

        <StarRating value={story.strength} />

        {themeLabels.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {themeLabels.map((label) => (
              <Badge
                key={label}
                className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-0"
              >
                {label}
              </Badge>
            ))}
          </div>
        )}

        {story.companies.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Building2 className="w-4 h-4 shrink-0" />
            <span>{story.companies.join(', ')}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRerate}
            disabled={rerating}
          >
            {rerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {rerating ? 'Rating...' : 'Re-rate Story'}
          </Button>
          <Button
            size="sm"
            onClick={() => setPracticeOpen(true)}
            className="bg-blue-700 hover:bg-blue-600 text-white"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Practice
          </Button>
        </div>
      </div>

      {/* STAR breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        <h2 className="font-semibold text-slate-900 dark:text-white">STAR Breakdown</h2>
        <Separator className="dark:bg-slate-800" />
        <StarField label="Situation" content={story.situation} />
        <Separator className="dark:bg-slate-800" />
        <StarField label="Task" content={story.task} />
        <Separator className="dark:bg-slate-800" />
        <StarField label="Action" content={story.action} />
        <Separator className="dark:bg-slate-800" />
        <StarField label="Result" content={story.result} />
      </div>

      {/* Raw content */}
      {story.rawContent && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
          <h2 className="font-semibold text-slate-900 dark:text-white">Raw Experience</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
            {story.rawContent}
          </p>
        </div>
      )}

      {/* Practice dialog */}
      <Dialog open={practiceOpen} onOpenChange={setPracticeOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>Practice Questions</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Use your story to answer these behavioral questions:
          </p>
          <div className="space-y-3 mt-2">
            {practiceQuestions.map((q, i) => (
              <div
                key={i}
                className="flex gap-3 bg-slate-50 dark:bg-slate-800 rounded-lg p-4"
              >
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                  Q{i + 1}
                </span>
                <p className="text-sm text-slate-700 dark:text-slate-300">{q}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Tip: Use the STAR structure you crafted above when answering.
          </p>
        </DialogContent>
      </Dialog>

      {/* Rate result dialog */}
      <Dialog open={rateOpen} onOpenChange={setRateOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>Story Rating Updated</DialogTitle>
          </DialogHeader>
          {rateResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={cn('text-xl', i < rateResult.rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600')}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">{rateResult.rating}/5</span>
              </div>
              {rateResult.suggestions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Suggestions:</p>
                  <ul className="space-y-1">
                    {rateResult.suggestions.map((s, i) => (
                      <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                        <span className="text-amber-500 shrink-0">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
