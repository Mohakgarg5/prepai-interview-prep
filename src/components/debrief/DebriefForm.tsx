'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export function DebriefForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [questions, setQuestions] = useState<string[]>([''])
  const [form, setForm] = useState({
    companyName: '',
    roleName: '',
    interviewDate: '',
    interviewRound: '',
    interviewerName: '',
    overallFeeling: 3,
    whatWentWell: '',
    whatWentPoorly: '',
    surprises: '',
  })

  const addQuestion = () => setQuestions(q => [...q, ''])
  const removeQuestion = (i: number) => setQuestions(q => q.filter((_, idx) => idx !== i))
  const updateQuestion = (i: number, val: string) => setQuestions(q => q.map((v, idx) => idx === i ? val : v))

  const handleSubmit = async () => {
    if (!form.companyName || !form.roleName || !form.interviewDate) {
      return toast.error('Company, role, and interview date are required')
    }
    setSaving(true)
    try {
      const res = await fetch('/api/debrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          questionsAsked: questions.filter(q => q.trim()),
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      toast.success('Debrief saved and analyzed!')
      router.push(`/debrief/${data.id}`)
    } catch {
      toast.error('Failed to save debrief')
      setSaving(false)
    }
  }

  const feelingOptions = [
    { value: 1, emoji: '😰', label: 'Rough' },
    { value: 2, emoji: '😟', label: 'Not great' },
    { value: 3, emoji: '😐', label: 'Okay' },
    { value: 4, emoji: '🙂', label: 'Good' },
    { value: 5, emoji: '😄', label: 'Great!' },
  ]

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Basic info */}
      <div className="space-y-4">
        <h2 className="font-semibold text-slate-900 dark:text-white">Interview Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm text-slate-600 dark:text-slate-400">Company *</label>
            <Input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} placeholder="Google, Meta, Stripe..." className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-slate-600 dark:text-slate-400">Role *</label>
            <Input value={form.roleName} onChange={e => setForm(f => ({ ...f, roleName: e.target.value }))} placeholder="Senior PM, PM II..." className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-slate-600 dark:text-slate-400">Date *</label>
            <Input type="date" value={form.interviewDate} onChange={e => setForm(f => ({ ...f, interviewDate: e.target.value }))} className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-slate-600 dark:text-slate-400">Round</label>
            <Input value={form.interviewRound} onChange={e => setForm(f => ({ ...f, interviewRound: e.target.value }))} placeholder="Phone screen, Onsite #2..." className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700" />
          </div>
        </div>
      </div>

      {/* Overall feeling */}
      <div className="space-y-3">
        <h2 className="font-semibold text-slate-900 dark:text-white">How did it feel?</h2>
        <div className="flex gap-3">
          {feelingOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setForm(f => ({ ...f, overallFeeling: opt.value }))}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all flex-1 ${
                form.overallFeeling === opt.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <span className="text-xs text-slate-500">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Questions asked */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-white">Questions Asked</h2>
          <Button onClick={addQuestion} variant="ghost" size="sm" className="gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white">
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
        </div>
        {questions.map((q, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={q}
              onChange={e => updateQuestion(i, e.target.value)}
              placeholder={`Question ${i + 1}...`}
              className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
            />
            {questions.length > 1 && (
              <button onClick={() => removeQuestion(i)} className="text-slate-400 hover:text-red-500 px-2">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Reflection */}
      <div className="space-y-4">
        <h2 className="font-semibold text-slate-900 dark:text-white">Reflection</h2>
        <div className="space-y-1.5">
          <label className="text-sm text-slate-600 dark:text-slate-400">What went well?</label>
          <Textarea value={form.whatWentWell} onChange={e => setForm(f => ({ ...f, whatWentWell: e.target.value }))} rows={3} placeholder="Strong product sense answer, good storytelling..." className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 resize-none" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm text-slate-600 dark:text-slate-400">What could have gone better?</label>
          <Textarea value={form.whatWentPoorly} onChange={e => setForm(f => ({ ...f, whatWentPoorly: e.target.value }))} rows={3} placeholder="Struggled with metrics question, ran long on story..." className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 resize-none" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm text-slate-600 dark:text-slate-400">Any surprises?</label>
          <Textarea value={form.surprises} onChange={e => setForm(f => ({ ...f, surprises: e.target.value }))} rows={2} placeholder="Unexpected technical depth, unusual format..." className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 resize-none" />
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={saving} className="w-full bg-blue-700 hover:bg-blue-600 h-11">
        {saving ? (
          <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Analyzing with AI...</span>
        ) : (
          'Save & Analyze with AI'
        )}
      </Button>
    </div>
  )
}
