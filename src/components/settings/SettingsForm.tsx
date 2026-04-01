'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { Plus, X, LogOut, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Image from 'next/image'
import { cn } from '@/lib/utils'

type TargetRole = 'GENERAL_PM' | 'AI_PM' | 'TECHNICAL_PM' | 'GROWTH_PM'
type ExperienceLevel = 'NEW_GRAD' | 'JUNIOR' | 'MID' | 'SENIOR' | 'DIRECTOR_PLUS'
type CompanyTier = 'FAANG' | 'BIG_TECH' | 'MID_STAGE' | 'STARTUP' | 'ENTERPRISE' | 'OTHER'

const ROLES: { value: TargetRole; label: string }[] = [
  { value: 'GENERAL_PM', label: 'General PM' },
  { value: 'AI_PM', label: 'AI / ML PM' },
  { value: 'TECHNICAL_PM', label: 'Technical PM' },
  { value: 'GROWTH_PM', label: 'Growth PM' },
]

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: 'NEW_GRAD', label: 'New Grad (0–1 yr)' },
  { value: 'JUNIOR', label: 'Junior PM (1–3 yrs)' },
  { value: 'MID', label: 'Mid-level (3–6 yrs)' },
  { value: 'SENIOR', label: 'Senior (6+ yrs)' },
  { value: 'DIRECTOR_PLUS', label: 'Director+' },
]

const WEAK_AREAS = [
  { value: 'PRODUCT_SENSE', label: 'Product Sense' },
  { value: 'EXECUTION', label: 'Execution' },
  { value: 'STRATEGY', label: 'Strategy' },
  { value: 'BEHAVIORAL', label: 'Behavioral' },
  { value: 'ESTIMATION', label: 'Estimation' },
  { value: 'METRICS', label: 'Metrics' },
  { value: 'TECHNICAL_AI', label: 'AI / Technical' },
  { value: 'PRODUCT_DESIGN', label: 'Product Design' },
]

const TIERS: { value: CompanyTier; label: string }[] = [
  { value: 'FAANG', label: 'FAANG' },
  { value: 'BIG_TECH', label: 'Big Tech' },
  { value: 'MID_STAGE', label: 'Mid-Stage' },
  { value: 'STARTUP', label: 'Startup' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
  { value: 'OTHER', label: 'Other' },
]

interface SettingsFormProps {
  user: {
    name: string | null
    email: string | null
    image: string | null
    targetRole: TargetRole
    experienceLevel: ExperienceLevel
    interviewTimeline: string | null
    weakAreas: string[]
  }
  companies: { id: string; name: string; tier: CompanyTier }[]
}

export function SettingsForm({ user, companies: initialCompanies }: SettingsFormProps) {
  const [saving, setSaving] = useState(false)
  const [companies, setCompanies] = useState(initialCompanies)
  const [newCompany, setNewCompany] = useState({ name: '', tier: 'MID_STAGE' as CompanyTier })
  const [addingCompany, setAddingCompany] = useState(false)
  const [form, setForm] = useState({
    targetRole: user.targetRole,
    experienceLevel: user.experienceLevel,
    interviewTimeline: user.interviewTimeline ? user.interviewTimeline.slice(0, 10) : '',
    weakAreas: user.weakAreas,
  })

  const toggleWeakArea = (area: string) => {
    setForm(f => ({
      ...f,
      weakAreas: f.weakAreas.includes(area)
        ? f.weakAreas.filter(a => a !== area)
        : [...f.weakAreas, area],
    }))
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const addCompany = async () => {
    if (!newCompany.name.trim()) return
    setAddingCompany(true)
    try {
      const res = await fetch('/api/settings/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCompany),
      })
      const data = await res.json()
      setCompanies(prev => [data, ...prev])
      setNewCompany({ name: '', tier: 'MID_STAGE' })
      toast.success('Company added')
    } catch {
      toast.error('Failed to add company')
    } finally {
      setAddingCompany(false)
    }
  }

  const removeCompany = async (id: string) => {
    try {
      await fetch(`/api/settings/companies?id=${id}`, { method: 'DELETE' })
      setCompanies(prev => prev.filter(c => c.id !== id))
    } catch {
      toast.error('Failed to remove company')
    }
  }

  return (
    <div className="space-y-8">
      {/* Profile */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-slate-900 dark:text-white">Profile</h2>
        <div className="flex items-center gap-4">
          {user.image && (
            <Image src={user.image} alt={user.name ?? ''} width={56} height={56} className="rounded-full" />
          )}
          <div>
            <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
            <p className="text-slate-500 text-sm">{user.email}</p>
          </div>
        </div>
      </section>

      {/* Interview Preferences */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
        <h2 className="font-semibold text-slate-900 dark:text-white">Interview Preferences</h2>

        <div className="space-y-2">
          <label className="text-sm text-slate-600 dark:text-slate-400">Target Role</label>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map(r => (
              <button key={r.value} onClick={() => setForm(f => ({ ...f, targetRole: r.value }))}
                className={cn('text-sm py-2.5 px-4 rounded-xl border font-medium transition-all', form.targetRole === r.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300')}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-600 dark:text-slate-400">Experience Level</label>
          <div className="space-y-2">
            {EXPERIENCE_LEVELS.map(e => (
              <button key={e.value} onClick={() => setForm(f => ({ ...f, experienceLevel: e.value }))}
                className={cn('w-full text-sm py-2.5 px-4 rounded-xl border font-medium transition-all text-left', form.experienceLevel === e.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300')}>
                {e.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-600 dark:text-slate-400">Interview Date (optional)</label>
          <Input type="date" value={form.interviewTimeline} onChange={e => setForm(f => ({ ...f, interviewTimeline: e.target.value }))} className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" min={new Date().toISOString().split('T')[0]} />
        </div>
      </section>

      {/* Focus Areas */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-slate-900 dark:text-white">Weak Areas to Focus On</h2>
        <div className="grid grid-cols-2 gap-2">
          {WEAK_AREAS.map(a => {
            const selected = form.weakAreas.includes(a.value)
            return (
              <button key={a.value} onClick={() => toggleWeakArea(a.value)}
                className={cn('text-sm py-2.5 px-4 rounded-xl border font-medium transition-all text-left', selected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300')}>
                {selected ? '✓ ' : ''}{a.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* Target Companies */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-slate-900 dark:text-white">Target Companies</h2>
        <div className="flex gap-2">
          <Input value={newCompany.name} onChange={e => setNewCompany(n => ({ ...n, name: e.target.value }))} placeholder="Company name..." onKeyDown={e => e.key === 'Enter' && addCompany()} className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 flex-1" />
          <select value={newCompany.tier} onChange={e => setNewCompany(n => ({ ...n, tier: e.target.value as CompanyTier }))} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-xl px-3">
            {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <Button onClick={addCompany} disabled={addingCompany || !newCompany.name.trim()} size="sm" className="bg-blue-700 hover:bg-blue-600 gap-1">
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        {companies.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {companies.map(c => (
              <div key={c.id} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm px-3 py-1.5 rounded-full">
                <span>{c.name}</span>
                <span className="text-xs text-slate-400">({c.tier.replace('_', ' ')})</span>
                <button onClick={() => removeCompany(c.id)} className="text-slate-400 hover:text-red-500 ml-1">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={save} disabled={saving} className="bg-blue-700 hover:bg-blue-600 gap-2 flex-1">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
        <Button onClick={() => signOut({ callbackUrl: '/signin' })} variant="ghost" className="border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 gap-2">
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </div>
    </div>
  )
}
