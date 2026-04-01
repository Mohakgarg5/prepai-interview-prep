'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { BEHAVIORAL_THEMES } from '@/lib/constants'
import { Sparkles, Save, Star, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StoryFormProps {
  initialData?: {
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
  }
}

function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const rating = i + 1
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(rating)}
            className={cn(
              'text-2xl transition-colors focus:outline-none',
              rating <= value ? 'text-amber-400 hover:text-amber-500' : 'text-slate-300 dark:text-slate-600 hover:text-amber-300'
            )}
          >
            ★
          </button>
        )
      })}
      <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">{value}/5</span>
    </div>
  )
}

export function StoryForm({ initialData }: StoryFormProps) {
  const router = useRouter()
  const isEdit = !!initialData?.id

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [rawContent, setRawContent] = useState(initialData?.rawContent ?? '')
  const [situation, setSituation] = useState(initialData?.situation ?? '')
  const [task, setTask] = useState(initialData?.task ?? '')
  const [action, setAction] = useState(initialData?.action ?? '')
  const [result, setResult] = useState(initialData?.result ?? '')
  const [themes, setThemes] = useState<string[]>(initialData?.themes ?? [])
  const [companies, setCompanies] = useState(initialData?.companies?.join(', ') ?? '')
  const [strength, setStrength] = useState(initialData?.strength ?? 3)
  const [improvementTips, setImprovementTips] = useState<string[]>([])
  const [showTips, setShowTips] = useState(false)

  const [structuring, setStructuring] = useState(false)
  const [saving, setSaving] = useState(false)
  const [starFieldsVisible, setStarFieldsVisible] = useState(
    !!(initialData?.situation || initialData?.task || initialData?.action || initialData?.result)
  )
  const [error, setError] = useState('')

  async function handleStructure() {
    if (!rawContent.trim()) {
      setError('Please paste your story first.')
      return
    }
    setError('')
    setStructuring(true)
    try {
      const res = await fetch('/api/stories/structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawContent }),
      })
      if (!res.ok) throw new Error('Failed to structure')
      const data = await res.json()
      setSituation(data.situation ?? '')
      setTask(data.task ?? '')
      setAction(data.action ?? '')
      setResult(data.result ?? '')
      if (data.suggestedThemes?.length) {
        setThemes((prev) => Array.from(new Set([...prev, ...data.suggestedThemes])))
      }
      if (typeof data.strengthRating === 'number') {
        setStrength(Math.min(5, Math.max(1, data.strengthRating)))
      }
      if (data.improvementTips?.length) {
        setImprovementTips(data.improvementTips)
      }
      setStarFieldsVisible(true)
    } catch {
      setError('AI structuring failed. Please try again.')
    } finally {
      setStructuring(false)
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    if (!rawContent.trim()) {
      setError('Raw content is required.')
      return
    }
    setError('')
    setSaving(true)
    try {
      const payload = {
        title,
        rawContent,
        situation: situation || null,
        task: task || null,
        action: action || null,
        result: result || null,
        themes,
        companies,
        strength,
      }
      const url = isEdit ? `/api/stories/${initialData.id}` : '/api/stories'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Save failed')
      router.push('/stories')
      router.refresh()
    } catch {
      setError('Failed to save story. Please try again.')
      setSaving(false)
    }
  }

  function toggleTheme(value: string) {
    setThemes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    )
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Story Title</Label>
        <Input
          id="title"
          placeholder="e.g. Led cross-functional redesign of checkout flow"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-white dark:bg-slate-900"
        />
      </div>

      {/* Raw content */}
      <div className="space-y-2">
        <Label htmlFor="rawContent">Your Experience</Label>
        <Textarea
          id="rawContent"
          placeholder="Paste your raw experience or story here. Don't worry about structure — just describe what happened, what you did, and what the outcome was."
          value={rawContent}
          onChange={(e) => setRawContent(e.target.value)}
          rows={8}
          className="bg-white dark:bg-slate-900 resize-none"
        />
      </div>

      {/* Structure button */}
      <Button
        type="button"
        onClick={handleStructure}
        disabled={structuring || !rawContent.trim()}
        className="w-full bg-purple-700 hover:bg-purple-600 text-white"
        size="lg"
      >
        {structuring ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Structuring with AI...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Structure with AI
          </>
        )}
      </Button>

      {/* STAR fields */}
      {starFieldsVisible && (
        <div className="space-y-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">STAR Structure</h3>
            {improvementTips.length > 0 && (
              <button
                type="button"
                onClick={() => setShowTips((v) => !v)}
                className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline"
              >
                {showTips ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showTips ? 'Hide tips' : `${improvementTips.length} improvement tips`}
              </button>
            )}
          </div>

          {showTips && improvementTips.length > 0 && (
            <ul className="space-y-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              {improvementTips.map((tip, i) => (
                <li key={i} className="text-xs text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                  <span className="shrink-0 mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          )}

          {[
            { label: 'Situation', value: situation, onChange: setSituation, placeholder: 'Set the scene — context, team size, constraints, timeline.' },
            { label: 'Task', value: task, onChange: setTask, placeholder: 'What was your specific responsibility or challenge?' },
            { label: 'Action', value: action, onChange: setAction, placeholder: 'What steps did YOU take? Be specific about decisions and tradeoffs.' },
            { label: 'Result', value: result, onChange: setResult, placeholder: 'What was the outcome? Quantify where possible.' },
          ].map(({ label, value, onChange, placeholder }) => (
            <div key={label} className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                {label}
              </Label>
              <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="bg-white dark:bg-slate-900 resize-none text-sm"
              />
            </div>
          ))}
        </div>
      )}

      {/* Themes */}
      <div className="space-y-2">
        <Label>Themes</Label>
        <div className="flex flex-wrap gap-2">
          {BEHAVIORAL_THEMES.map((theme) => {
            const selected = themes.includes(theme.value)
            return (
              <button
                key={theme.value}
                type="button"
                onClick={() => toggleTheme(theme.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  selected
                    ? 'bg-blue-700 border-blue-700 text-white'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-600'
                )}
              >
                {theme.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Strength */}
      <div className="space-y-2">
        <Label>Story Strength</Label>
        <StarSelector value={strength} onChange={setStrength} />
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Rate how strong and interview-ready this story is
        </p>
      </div>

      {/* Companies */}
      <div className="space-y-2">
        <Label htmlFor="companies">Target Companies (optional)</Label>
        <Input
          id="companies"
          placeholder="Google, Meta, Stripe (comma-separated)"
          value={companies}
          onChange={(e) => setCompanies(e.target.value)}
          className="bg-white dark:bg-slate-900"
        />
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Which companies would you use this story for?
        </p>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Save */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/stories')}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving || !title.trim() || !rawContent.trim()}
          size="lg"
          className="flex-1"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isEdit ? 'Update Story' : 'Save Story'}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
