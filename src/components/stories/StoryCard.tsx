'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BEHAVIORAL_THEMES } from '@/lib/constants'
import { Trash2, Building2, CheckCircle2, Circle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface StoryCardProps {
  story: {
    id: string
    title: string
    themes: string[]
    strength: number
    companies: string[]
    situation: string | null
    task: string | null
    action: string | null
    result: string | null
    updatedAt: string
  }
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'text-sm',
            i < value ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'
          )}
        >
          ★
        </span>
      ))}
    </div>
  )
}

function StarCompletion({ situation, task, action, result }: {
  situation: string | null
  task: string | null
  action: string | null
  result: string | null
}) {
  const fields = [
    { label: 'S', filled: !!situation },
    { label: 'T', filled: !!task },
    { label: 'A', filled: !!action },
    { label: 'R', filled: !!result },
  ]
  const complete = fields.filter((f) => f.filled).length
  return (
    <div className="flex items-center gap-1.5">
      {fields.map((f) =>
        f.filled ? (
          <div key={f.label} className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{f.label}</span>
          </div>
        ) : (
          <div key={f.label} className="flex items-center gap-0.5 text-slate-300 dark:text-slate-600">
            <Circle className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{f.label}</span>
          </div>
        )
      )}
      <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">{complete}/4</span>
    </div>
  )
}

export function StoryCard({ story }: StoryCardProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Delete "${story.title}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await fetch(`/api/stories/${story.id}`, { method: 'DELETE' })
      router.refresh()
    } catch {
      setDeleting(false)
    }
  }

  const themeLabels = story.themes.slice(0, 3).map((t) => {
    const found = BEHAVIORAL_THEMES.find((b) => b.value === t)
    return found?.label ?? t
  })
  const extraThemes = story.themes.length - 3

  return (
    <Link href={`/stories/${story.id}`} className="block group">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all duration-150 h-full flex flex-col gap-3">
        {/* Title + delete */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
            {story.title}
          </h3>
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Delete story"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* STAR completion */}
        <StarCompletion
          situation={story.situation}
          task={story.task}
          action={story.action}
          result={story.result}
        />

        {/* Themes */}
        {themeLabels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {themeLabels.map((label) => (
              <Badge key={label} variant="secondary" className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-0">
                {label}
              </Badge>
            ))}
            {extraThemes > 0 && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 border-0">
                +{extraThemes}
              </Badge>
            )}
          </div>
        )}

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <StarRating value={story.strength} />
          {story.companies.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <Building2 className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{story.companies.slice(0, 2).join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
