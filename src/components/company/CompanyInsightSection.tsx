'use client'

import { useState, useEffect } from 'react'
import { Loader2, AlertCircle, CheckCircle, ChevronRight, Lightbulb, BookOpen, MessageSquare, Star, HelpCircle } from 'lucide-react'

type CompanyResearch = {
  interviewProcess?: { rounds?: string; format?: string; duration?: string }
  commonQuestions?: { productSense?: string[]; behavioral?: string[]; metrics?: string[] }
  companyValues?: string[]
  recentNews?: { title?: string; summary?: string; relevance?: string }[]
  interviewTips?: { dos?: string[]; donts?: string[] }
  cultureOverview?: string
  sampleQuestions?: { easy?: string[]; hard?: string[] }
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'process', label: 'Interview Process', icon: ChevronRight },
  { id: 'questions', label: 'Common Questions', icon: MessageSquare },
  { id: 'tips', label: 'Tips', icon: Lightbulb },
  { id: 'samples', label: 'Sample Questions', icon: HelpCircle },
]

function SkeletonBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
      ))}
    </div>
  )
}

function QuestionList({ questions, label }: { questions?: string[]; label: string }) {
  if (!questions?.length) return null
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</h4>
      <ul className="space-y-1.5">
        {questions.map((q, i) => (
          <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
            <span className="text-blue-500 shrink-0 mt-0.5">•</span>
            <span>{q}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function CompanyInsightSection({ companyName, slug }: { companyName: string; slug: string }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [research, setResearch] = useState<CompanyResearch | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchResearch() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/company-prep/${slug}`)
        if (!res.ok) throw new Error('Failed to fetch research')
        const data = await res.json()
        setResearch(data.research as CompanyResearch)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }
    fetchResearch()
  }, [slug])

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="p-6">
        {loading && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              Researching {companyName} with AI...
            </div>
            <SkeletonBlock lines={4} />
            <SkeletonBlock lines={3} />
            <SkeletonBlock lines={5} />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-500">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {!loading && !error && research && (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {research.cultureOverview && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Culture Overview</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{research.cultureOverview}</p>
                  </div>
                )}
                {research.companyValues && research.companyValues.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Company Values</h3>
                    <div className="flex flex-wrap gap-2">
                      {research.companyValues.map((v, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                          <Star className="w-2.5 h-2.5" />
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {research.recentNews && research.recentNews.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Recent News</h3>
                    <div className="space-y-3">
                      {research.recentNews.map((item, i) => (
                        <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.title}</p>
                          {item.summary && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.summary}</p>}
                          {item.relevance && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {item.relevance}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'process' && (
              <div className="space-y-5">
                {research.interviewProcess && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {research.interviewProcess.rounds && (
                      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Rounds</p>
                        <p className="text-sm text-slate-800 dark:text-slate-200">{research.interviewProcess.rounds}</p>
                      </div>
                    )}
                    {research.interviewProcess.format && (
                      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Format</p>
                        <p className="text-sm text-slate-800 dark:text-slate-200">{research.interviewProcess.format}</p>
                      </div>
                    )}
                    {research.interviewProcess.duration && (
                      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Duration</p>
                        <p className="text-sm text-slate-800 dark:text-slate-200">{research.interviewProcess.duration}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'questions' && (
              <div className="space-y-6">
                <QuestionList questions={research.commonQuestions?.productSense} label="Product Sense" />
                <QuestionList questions={research.commonQuestions?.behavioral} label="Behavioral" />
                <QuestionList questions={research.commonQuestions?.metrics} label="Metrics" />
              </div>
            )}

            {activeTab === 'tips' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {research.interviewTips?.dos && research.interviewTips.dos.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3">Do&apos;s</h3>
                    <ul className="space-y-2">
                      {research.interviewTips.dos.map((tip, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {research.interviewTips?.donts && research.interviewTips.donts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3">Don&apos;ts</h3>
                    <ul className="space-y-2">
                      {research.interviewTips.donts.map((tip, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'samples' && (
              <div className="space-y-6">
                <QuestionList questions={research.sampleQuestions?.easy} label="Easier Questions" />
                <QuestionList questions={research.sampleQuestions?.hard} label="Harder Questions" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
