'use client'

import { useState } from 'react'
import { Briefcase, Plus, ExternalLink, Trash2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type JobStatus = 'SAVED' | 'APPLIED' | 'PHONE_SCREEN' | 'INTERVIEWING' | 'OFFER' | 'REJECTED' | 'WITHDRAWN'

interface Job {
  id: string
  title: string
  company: string
  location: string | null
  url: string | null
  jdContent: string | null
  keyRequirements: string[]
  matchScore: number | null
  status: JobStatus
  createdAt: string
}

const STATUS_CONFIG: Record<JobStatus, { label: string; color: string }> = {
  SAVED: { label: 'Saved', color: 'bg-slate-700 text-slate-300' },
  APPLIED: { label: 'Applied', color: 'bg-blue-900 text-blue-300' },
  PHONE_SCREEN: { label: 'Phone Screen', color: 'bg-purple-900 text-purple-300' },
  INTERVIEWING: { label: 'Interviewing', color: 'bg-amber-900 text-amber-300' },
  OFFER: { label: 'Offer', color: 'bg-emerald-900 text-emerald-300' },
  REJECTED: { label: 'Rejected', color: 'bg-red-900 text-red-300' },
  WITHDRAWN: { label: 'Withdrawn', color: 'bg-slate-800 text-slate-500' },
}

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as JobStatus[]

export function JobsClient({ initialJobs }: { initialJobs: Job[] }) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [filter, setFilter] = useState<JobStatus | 'ALL'>('ALL')
  const [showForm, setShowForm] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', company: '', location: '', url: '', jdContent: '', status: 'SAVED' as JobStatus,
    keyRequirements: [] as string[],
  })

  const filteredJobs = filter === 'ALL' ? jobs : jobs.filter(j => j.status === filter)

  const analyzeJD = async () => {
    if (!form.jdContent.trim()) return toast.error('Paste a job description first')
    setAnalyzing(true)
    try {
      const res = await fetch('/api/jobs/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jdContent: form.jdContent }),
      })
      const data = await res.json()
      setForm(f => ({ ...f, keyRequirements: data.keyRequirements ?? [] }))
      toast.success('JD analyzed!')
    } catch {
      toast.error('Failed to analyze JD')
    } finally {
      setAnalyzing(false)
    }
  }

  const saveJob = async () => {
    if (!form.title || !form.company) return toast.error('Title and company are required')
    setSaving(true)
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      setJobs(prev => [{ ...data, createdAt: data.createdAt }, ...prev])
      setShowForm(false)
      setForm({ title: '', company: '', location: '', url: '', jdContent: '', status: 'SAVED', keyRequirements: [] })
      toast.success('Job saved!')
    } catch {
      toast.error('Failed to save job')
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (id: string, status: JobStatus) => {
    try {
      await fetch(`/api/jobs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j))
    } catch {
      toast.error('Failed to update status')
    }
  }

  const deleteJob = async (id: string) => {
    try {
      await fetch(`/api/jobs/${id}`, { method: 'DELETE' })
      setJobs(prev => prev.filter(j => j.id !== id))
      toast.success('Job removed')
    } catch {
      toast.error('Failed to delete job')
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter + Add */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('ALL')}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', filter === 'ALL' ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white')}
          >
            All ({jobs.length})
          </button>
          {ALL_STATUSES.map(s => {
            const count = jobs.filter(j => j.status === s).length
            if (count === 0) return null
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', filter === s ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white')}
              >
                {STATUS_CONFIG[s].label} ({count})
              </button>
            )
          })}
        </div>
        <Button onClick={() => setShowForm(true)} className="ml-auto bg-blue-700 hover:bg-blue-600 gap-2">
          <Plus className="w-4 h-4" /> Add Job
        </Button>
      </div>

      {/* Add Job Form */}
      {showForm && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-white">Add New Job</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="Job title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
            <Input placeholder="Company *" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
            <Input placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
            <Input placeholder="Job URL" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <Textarea
            placeholder="Paste job description here for AI analysis..."
            value={form.jdContent}
            onChange={e => setForm(f => ({ ...f, jdContent: e.target.value }))}
            rows={4}
            className="bg-slate-800 border-slate-700 text-white resize-none"
          />
          {form.keyRequirements.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.keyRequirements.map((r, i) => <Badge key={i} className="bg-blue-900 text-blue-300 text-xs">{r}</Badge>)}
            </div>
          )}
          <div className="flex gap-3">
            <Button onClick={analyzeJD} disabled={analyzing} variant="ghost" className="border border-slate-700 text-slate-300 hover:text-white">
              {analyzing ? 'Analyzing...' : 'Analyze JD with AI'}
            </Button>
            <Button onClick={saveJob} disabled={saving} className="bg-blue-700 hover:bg-blue-600">
              {saving ? 'Saving...' : 'Save Job'}
            </Button>
            <Button onClick={() => setShowForm(false)} variant="ghost" className="text-slate-400">Cancel</Button>
          </div>
        </div>
      )}

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No jobs yet</p>
          <p className="text-sm mt-1">Add jobs to track your applications</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map(job => (
            <div key={job.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 group">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-white truncate">{job.title}</h3>
                  <p className="text-slate-400 text-sm">{job.company}</p>
                  {job.location && <p className="text-slate-500 text-xs mt-0.5">{job.location}</p>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {job.url && (
                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-white">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button onClick={() => deleteJob(job.id)} className="p-1.5 text-slate-400 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={cn('text-xs px-2 py-1 rounded-full font-medium', STATUS_CONFIG[job.status].color)}>
                  {STATUS_CONFIG[job.status].label}
                </span>
                {job.matchScore && (
                  <span className="text-xs text-slate-400">{job.matchScore}% match</span>
                )}
              </div>

              {job.keyRequirements.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {job.keyRequirements.slice(0, 3).map((r, i) => (
                    <span key={i} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{r}</span>
                  ))}
                  {job.keyRequirements.length > 3 && (
                    <span className="text-xs text-slate-500">+{job.keyRequirements.length - 3}</span>
                  )}
                </div>
              )}

              {/* Status updater */}
              <div className="relative group/status">
                <select
                  value={job.status}
                  onChange={e => updateStatus(job.id, e.target.value as JobStatus)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 appearance-none cursor-pointer"
                >
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
