'use client'

import { X, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TutorChat } from './TutorChat'

interface InlineTutorProps {
  lessonId: string
  lessonTitle: string
  onClose: () => void
}

export function InlineTutor({ lessonId, lessonTitle, onClose }: InlineTutorProps) {
  const suggestedQuestions = [
    `Explain the core concept of "${lessonTitle}" in simple terms`,
    'How would this topic come up in a PM interview?',
    'Give me a real-world example of this in action',
    'What are common mistakes candidates make on this topic?',
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-800 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">AI Tutor</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{lessonTitle}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <TutorChat
          lessonId={lessonId}
          suggestedQuestions={suggestedQuestions}
          className="h-full"
        />
      </div>
    </div>
  )
}
