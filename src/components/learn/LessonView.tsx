'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle2, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LessonContent } from './LessonContent'
import { LessonQuiz } from './LessonQuiz'
import { PracticePrompt } from './PracticePrompt'
import { InlineTutor } from './InlineTutor'
import { cn } from '@/lib/utils'
import type { LessonWithProgress } from '@/types/learn'

interface LessonViewProps {
  lesson: LessonWithProgress
  pathSlug: string
  moduleSlug: string
  prevLesson: { slug: string; title: string } | null
  nextLesson: { slug: string; title: string } | null
}

export function LessonView({
  lesson,
  pathSlug,
  moduleSlug,
  prevLesson,
  nextLesson,
}: LessonViewProps) {
  const [isComplete, setIsComplete] = useState(!!lesson.progress?.completedAt)
  const [tutorOpen, setTutorOpen] = useState(false)
  const startTimeRef = useRef<number>(Date.now())

  const markComplete = async (quizScore?: number) => {
    const timeSpentMs = Date.now() - startTimeRef.current

    await fetch('/api/learn/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: lesson.id, quizScore, timeSpentMs }),
    })
    setIsComplete(true)
  }

  return (
    <div className="flex h-full">
      {/* Main content area */}
      <div className={cn('flex-1 overflow-y-auto transition-all duration-300', tutorOpen ? 'lg:mr-80' : '')}>
        <div className="p-6 max-w-3xl mx-auto space-y-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Link href="/learn" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Learn
            </Link>
            <span>/</span>
            <Link href={`/learn/${pathSlug}`} className="hover:text-slate-900 dark:hover:text-white transition-colors capitalize">
              {pathSlug.replace(/-/g, ' ')}
            </Link>
            <span>/</span>
            <Link href={`/learn/${pathSlug}/${moduleSlug}`} className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Module
            </Link>
          </div>

          {/* Lesson header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {isComplete && (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Completed
                  </span>
                )}
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {lesson.estimatedMinutes} min read
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{lesson.title}</h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTutorOpen(!tutorOpen)}
              className={cn(
                'shrink-0 gap-1.5',
                tutorOpen && 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
              )}
            >
              <Bot className="w-4 h-4" />
              AI Tutor
            </Button>
          </div>

          {/* Lesson content */}
          <LessonContent
            content={lesson.content}
            keyTakeaways={lesson.keyTakeaways}
            interviewTip={lesson.interviewTip}
          />

          {/* Quiz */}
          <LessonQuiz
            lessonTitle={lesson.title}
            practiceQuestions={lesson.practiceQuestions}
            isComplete={isComplete}
            onComplete={markComplete}
          />

          {/* Practice CTA */}
          <PracticePrompt lessonTitle={lesson.title} />

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            {prevLesson ? (
              <Link href={`/learn/${pathSlug}/${moduleSlug}/${prevLesson.slug}`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ArrowLeft className="w-4 h-4" />
                  {prevLesson.title}
                </Button>
              </Link>
            ) : (
              <div />
            )}
            {nextLesson ? (
              <Link href={`/learn/${pathSlug}/${moduleSlug}/${nextLesson.slug}`}>
                <Button size="sm" className="bg-blue-800 hover:bg-blue-900 text-white gap-1.5">
                  {nextLesson.title}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Link href={`/learn/${pathSlug}/${moduleSlug}`}>
                <Button size="sm" variant="outline" className="gap-1.5">
                  Back to Module
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Inline tutor sidebar */}
      {tutorOpen && (
        <div className="hidden lg:flex fixed right-0 top-0 bottom-0 w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-40 flex-col">
          <InlineTutor
            lessonId={lesson.id}
            lessonTitle={lesson.title}
            onClose={() => setTutorOpen(false)}
          />
        </div>
      )}
    </div>
  )
}
