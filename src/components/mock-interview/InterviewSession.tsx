'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  Send,
  Lightbulb,
  StopCircle,
  Clock,
  Loader2,
  Bot,
  User,
  MessageSquare,
  Trophy,
  TrendingUp,
  Layers,
  Eye,
  Zap,
} from 'lucide-react'

interface MockMessage {
  id: string
  role: 'INTERVIEWER' | 'CANDIDATE' | 'FEEDBACK' | 'HINT' | 'FOLLOWUP' | 'SYSTEM'
  content: string
  order: number
}

interface MockSessionData {
  id: string
  category: string
  difficulty: string
  companyContext: string | null
  timedMode: boolean
  timeLimitMinutes: number | null
  overallScore: number | null
  completedAt: string | null
}

interface ScoreResult {
  overallScore: number
  structureScore: number
  clarityScore: number
  depthScore: number
  creativityScore: number
  feedback: string
  strengths: string[]
  improvements: string[]
}

const CATEGORY_LABELS: Record<string, string> = {
  PRODUCT_SENSE: 'Product Sense',
  EXECUTION: 'Execution',
  STRATEGY: 'Strategy',
  BEHAVIORAL: 'Behavioral',
  ESTIMATION: 'Estimation',
  TECHNICAL_AI: 'Technical/AI',
  ML_SYSTEM_DESIGN: 'ML System Design',
  AI_ETHICS: 'AI Ethics',
  METRICS: 'Metrics',
  PRODUCT_DESIGN: 'Product Design',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
  MEDIUM: 'bg-amber-900/50 text-amber-300 border-amber-700',
  HARD: 'bg-orange-900/50 text-orange-300 border-orange-700',
  FAANG_LEVEL: 'bg-red-900/50 text-red-300 border-red-700',
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-red-400'
}

function scoreBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function parseFeedbackJSON(content: string): {
  scores?: { structure: number; clarity: number; depth: number; creativity: number }
  strengths?: string[]
  improvements?: string[]
  strongAnswerExample?: string
  frameworksToConsider?: string[]
} | null {
  try {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) return JSON.parse(jsonMatch[1].trim())
    const objMatch = content.match(/\{[\s\S]*\}/)
    if (objMatch) return JSON.parse(objMatch[0])
  } catch {
    // ignore
  }
  return null
}

export function InterviewSession({
  sessionData,
  initialMessages,
}: {
  sessionData: MockSessionData
  initialMessages: MockMessage[]
}) {
  const [messages, setMessages] = useState<MockMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [isGettingHint, setIsGettingHint] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [isCompleted, setIsCompleted] = useState(!!sessionData.completedAt)

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  useEffect(() => {
    if (!isCompleted) {
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isCompleted])

  const timeLimit = sessionData.timedMode && sessionData.timeLimitMinutes
    ? sessionData.timeLimitMinutes * 60
    : null

  const timeRemaining = timeLimit ? Math.max(0, timeLimit - elapsedSeconds) : null

  // Auto-end when time runs out
  useEffect(() => {
    if (timeRemaining === 0 && !isCompleted && !isEnding) {
      handleEndInterview()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining])

  const handleSend = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isSending || isCompleted) return

    setIsSending(true)
    setInput('')

    // Optimistically add candidate message
    const candidateMsg: MockMessage = {
      id: `temp-${Date.now()}`,
      role: 'CANDIDATE',
      content: trimmed,
      order: messages.length,
    }
    setMessages((prev) => [...prev, candidateMsg])

    try {
      const response = await fetch(`/api/ai/mock/${sessionData.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      })

      if (!response.ok) throw new Error('Failed to send message')
      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      setStreamingText('')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: [DONE]')) {
            // Stream complete — commit message
            const isJsonFeedback =
              accumulated.includes('"scores"') && accumulated.includes('"strengths"')
            const newMsg: MockMessage = {
              id: `ai-${Date.now()}`,
              role: isJsonFeedback ? 'FEEDBACK' : 'INTERVIEWER',
              content: accumulated,
              order: messages.length + 1,
            }
            setMessages((prev) => [...prev, newMsg])
            setStreamingText('')
            accumulated = ''
          } else if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6))
              if (parsed.text) {
                accumulated += parsed.text
                setStreamingText(accumulated)
              }
            } catch {
              // ignore
            }
          }
        }
      }
    } catch (err) {
      console.error(err)
      setMessages((prev) => prev.filter((m) => m.id !== candidateMsg.id))
      setInput(trimmed)
    } finally {
      setIsSending(false)
      setStreamingText('')
      textareaRef.current?.focus()
    }
  }, [input, isSending, isCompleted, messages.length, sessionData.id])

  const handleGetHint = useCallback(async () => {
    if (isGettingHint || isCompleted) return
    setIsGettingHint(true)

    const lastInterviewerMsg = [...messages].reverse().find((m) => m.role === 'INTERVIEWER')
    if (!lastInterviewerMsg) {
      setIsGettingHint(false)
      return
    }

    try {
      const response = await fetch('/api/ai/mock/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionData.id,
          question: lastInterviewerMsg.content,
          category: sessionData.category,
        }),
      })

      if (!response.ok) throw new Error('Failed to get hint')
      const data = await response.json() as { hint: string }

      const hintMsg: MockMessage = {
        id: `hint-${Date.now()}`,
        role: 'HINT',
        content: data.hint,
        order: messages.length,
      }
      setMessages((prev) => [...prev, hintMsg])
    } catch (err) {
      console.error(err)
    } finally {
      setIsGettingHint(false)
    }
  }, [isGettingHint, isCompleted, messages, sessionData.id, sessionData.category])

  const handleEndInterview = useCallback(async () => {
    if (isEnding || isCompleted) return
    setIsEnding(true)
    if (timerRef.current) clearInterval(timerRef.current)

    try {
      const response = await fetch(`/api/ai/mock/${sessionData.id}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error('Failed to end interview')
      const data = await response.json() as ScoreResult
      setScoreResult(data)
      setIsCompleted(true)
      setShowScoreModal(true)
    } catch (err) {
      console.error(err)
    } finally {
      setIsEnding(false)
    }
  }, [isEnding, isCompleted, sessionData.id])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  const categoryLabel = CATEGORY_LABELS[sessionData.category] ?? sessionData.category
  const difficultyClass = DIFFICULTY_COLORS[sessionData.difficulty] ?? 'bg-slate-800 text-slate-300 border-slate-600'

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-blue-300 border-blue-700 bg-blue-900/40">
            {categoryLabel}
          </Badge>
          <Badge variant="outline" className={difficultyClass}>
            {sessionData.difficulty.replace(/_/g, ' ')}
          </Badge>
          {sessionData.companyContext && (
            <span className="text-sm text-slate-400">{sessionData.companyContext}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          {sessionData.timedMode && (
            <div
              className={`flex items-center gap-1.5 text-sm font-mono font-medium px-2.5 py-1 rounded-md ${
                timeRemaining !== null && timeRemaining < 120
                  ? 'bg-red-900/50 text-red-300'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {timeRemaining !== null ? formatTime(timeRemaining) : formatTime(elapsedSeconds)}
            </div>
          )}
          {!sessionData.timedMode && (
            <div className="flex items-center gap-1.5 text-sm font-mono text-slate-500 px-2.5 py-1 rounded-md bg-slate-800/50">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(elapsedSeconds)}
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleEndInterview}
            disabled={isEnding || isCompleted || messages.length < 2}
            className="border-red-700 text-red-400 hover:bg-red-900/40 hover:text-red-300 bg-transparent"
          >
            {isEnding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : (
              <StopCircle className="w-3.5 h-3.5 mr-1.5" />
            )}
            End Interview
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Streaming indicator */}
        {streamingText && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-4 h-4 text-blue-200" />
            </div>
            <div className="max-w-2xl bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{streamingText}</p>
              <span className="inline-block w-1 h-4 bg-blue-400 animate-pulse ml-0.5" />
            </div>
          </div>
        )}

        {/* Typing indicator when waiting */}
        {isSending && !streamingText && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-blue-200" />
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-slate-800 bg-slate-900 px-4 py-3">
        {isCompleted ? (
          <div className="flex items-center justify-center py-2">
            <p className="text-slate-400 text-sm">
              Interview complete.{' '}
              {scoreResult && (
                <button
                  onClick={() => setShowScoreModal(true)}
                  className="text-blue-400 underline underline-offset-2 hover:text-blue-300"
                >
                  View scores
                </button>
              )}
            </p>
          </div>
        ) : (
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer… (Cmd+Enter to send)"
              className="flex-1 min-h-[72px] max-h-48 resize-none bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-600 focus:ring-blue-600/20"
              disabled={isSending}
            />
            <div className="flex flex-col gap-2 pb-0.5">
              <Button
                size="icon"
                onClick={handleGetHint}
                disabled={isGettingHint || isSending}
                title="Get a hint"
                className="bg-amber-800/60 hover:bg-amber-700 text-amber-200 border border-amber-700"
              >
                {isGettingHint ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lightbulb className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="icon"
                onClick={handleSend}
                disabled={isSending || !input.trim()}
                className="bg-blue-700 hover:bg-blue-600 text-white"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}
        <p className="text-xs text-slate-600 mt-1.5 text-right">
          Cmd+Enter to send &middot; Lightbulb for a hint
        </p>
      </div>

      {/* Score Modal */}
      <ScoreModal
        open={showScoreModal}
        onClose={() => setShowScoreModal(false)}
        result={scoreResult}
        category={categoryLabel}
      />
    </div>
  )
}

function MessageBubble({ message }: { message: MockMessage }) {
  if (message.role === 'HINT') {
    return (
      <div className="flex justify-center">
        <div className="max-w-xl bg-amber-950/60 border border-amber-800/60 rounded-xl px-4 py-3 flex gap-2.5 items-start">
          <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-amber-200 text-sm leading-relaxed">{message.content}</p>
        </div>
      </div>
    )
  }

  if (message.role === 'FEEDBACK') {
    const parsed = parseFeedbackJSON(message.content)
    if (parsed?.scores) {
      return (
        <div className="flex justify-center">
          <div className="max-w-2xl w-full bg-slate-800/80 border border-slate-700 rounded-2xl px-5 py-4 space-y-3">
            <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              Round Feedback
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Structure', value: parsed.scores.structure },
                { label: 'Clarity', value: parsed.scores.clarity },
                { label: 'Depth', value: parsed.scores.depth },
                { label: 'Creativity', value: parsed.scores.creativity },
              ].map(({ label, value }) => (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{label}</span>
                    <span className={scoreColor(value)}>{value}</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${scoreBarColor(value)}`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {parsed.strengths && parsed.strengths.length > 0 && (
              <div>
                <p className="text-xs font-medium text-emerald-400 mb-1">Strengths</p>
                <ul className="space-y-0.5">
                  {parsed.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-slate-300 flex gap-1.5">
                      <span className="text-emerald-500 mt-0.5">+</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {parsed.improvements && parsed.improvements.length > 0 && (
              <div>
                <p className="text-xs font-medium text-amber-400 mb-1">Areas to improve</p>
                <ul className="space-y-0.5">
                  {parsed.improvements.map((s, i) => (
                    <li key={i} className="text-xs text-slate-300 flex gap-1.5">
                      <span className="text-amber-500 mt-0.5">~</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {parsed.strongAnswerExample && (
              <div className="bg-slate-900/60 rounded-lg px-3 py-2">
                <p className="text-xs font-medium text-blue-400 mb-1">Strong answer example</p>
                <p className="text-xs text-slate-400 leading-relaxed">{parsed.strongAnswerExample}</p>
              </div>
            )}
          </div>
        </div>
      )
    }

    // Plain text feedback fallback
    return (
      <div className="flex justify-center">
        <div className="max-w-2xl bg-slate-800/80 border border-slate-700 rounded-2xl px-5 py-4">
          <p className="text-sm text-slate-300 leading-relaxed">{message.content}</p>
        </div>
      </div>
    )
  }

  if (message.role === 'CANDIDATE') {
    return (
      <div className="flex gap-3 justify-end">
        <div className="max-w-2xl bg-blue-800 rounded-2xl rounded-tr-sm px-4 py-3">
          <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-4 h-4 text-slate-300" />
        </div>
      </div>
    )
  }

  // INTERVIEWER / FOLLOWUP / SYSTEM
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="w-4 h-4 text-blue-200" />
      </div>
      <div className="max-w-2xl bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3">
        <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  )
}

function ScoreModal({
  open,
  onClose,
  result,
  category,
}: {
  open: boolean
  onClose: () => void
  result: ScoreResult | null
  category: string
}) {
  if (!result) return null

  const scoreItems = [
    { label: 'Structure', value: result.structureScore, icon: Layers },
    { label: 'Clarity', value: result.clarityScore, icon: Eye },
    { label: 'Depth', value: result.depthScore, icon: TrendingUp },
    { label: 'Creativity', value: result.creativityScore, icon: Zap },
  ]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-lg w-full p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-900/60 to-slate-900 px-6 pt-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Interview Complete</h2>
              <p className="text-slate-400 text-sm">{category}</p>
            </div>
          </div>
          <div className="text-center py-2">
            <p className="text-slate-400 text-sm mb-1">Overall Score</p>
            <p className={`text-5xl font-bold ${scoreColor(result.overallScore)}`}>
              {Math.round(result.overallScore)}
            </p>
            <p className="text-slate-500 text-xs mt-1">out of 100</p>
          </div>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* Score breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Score Breakdown</h3>
            {scoreItems.map(({ label, value, icon: Icon }) => (
              <div key={label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Icon className="w-3.5 h-3.5 text-slate-500" />
                    {label}
                  </div>
                  <span className={`font-semibold ${scoreColor(value)}`}>{Math.round(value)}</span>
                </div>
                <Progress
                  value={value}
                  className="h-2 bg-slate-800"
                />
              </div>
            ))}
          </div>

          {/* Feedback */}
          {result.feedback && (
            <div className="bg-slate-800/60 rounded-xl px-4 py-3">
              <p className="text-xs font-medium text-slate-400 mb-1.5">Overall Feedback</p>
              <p className="text-sm text-slate-300 leading-relaxed">{result.feedback}</p>
            </div>
          )}

          {/* Strengths + Improvements */}
          <div className="grid grid-cols-2 gap-3">
            {result.strengths.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-emerald-400 mb-2">Strengths</p>
                <ul className="space-y-1.5">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-slate-300 flex gap-1.5 leading-snug">
                      <span className="text-emerald-500 shrink-0 mt-0.5">+</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.improvements.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-amber-400 mb-2">To Improve</p>
                <ul className="space-y-1.5">
                  {result.improvements.map((s, i) => (
                    <li key={i} className="text-xs text-slate-300 flex gap-1.5 leading-snug">
                      <span className="text-amber-500 shrink-0 mt-0.5">~</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 bg-transparent"
              onClick={() => window.location.href = '/mock-interview'}
            >
              New Interview
            </Button>
            <Button
              className="flex-1 bg-blue-700 hover:bg-blue-600 text-white"
              onClick={() => window.location.href = '/mock-interview/history'}
            >
              View History
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
