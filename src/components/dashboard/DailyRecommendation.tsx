'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, AlertCircle, Target } from 'lucide-react'
import { daysUntil } from '@/lib/utils'

interface DailyRecommendationProps {
  user: {
    name: string | null
    weakAreas: string[]
    interviewTimeline: Date | null
    targetRole: string
  }
  readinessScore: number
}

const CATEGORY_TO_ROUTE: Record<string, string> = {
  'Product Sense': '/mock-interview?category=PRODUCT_SENSE',
  'Metrics': '/mock-interview?category=METRICS',
  'Estimation': '/mock-interview?category=ESTIMATION',
  'Behavioral': '/stories',
  'Strategy': '/mock-interview?category=STRATEGY',
  'Execution': '/mock-interview?category=EXECUTION',
  'Technical/AI': '/mock-interview?category=TECHNICAL_AI',
}

export function DailyRecommendation({ user, readinessScore }: DailyRecommendationProps) {
  const daysLeft = user.interviewTimeline ? daysUntil(user.interviewTimeline) : null
  const firstWeak = user.weakAreas[0]
  const actionRoute = firstWeak ? (CATEGORY_TO_ROUTE[firstWeak] || '/mock-interview') : '/mock-interview'

  const isPanicTime = daysLeft !== null && daysLeft <= 2 && daysLeft >= 0

  if (isPanicTime) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="font-bold text-amber-900 dark:text-amber-200 text-lg">
              Interview in {daysLeft === 0 ? 'today!' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''}!`}
            </h3>
            <p className="text-amber-800 dark:text-amber-300 text-sm mt-1">
              Time to activate Panic Mode. Get your personalized last-minute review.
            </p>
            <Button
              asChild
              className="mt-4 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Link href="/panic-mode">
                Activate Panic Mode
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-blue-800 to-blue-900 rounded-xl p-6 text-white">
      <div className="flex items-start gap-3">
        <Target className="w-6 h-6 text-blue-200 mt-0.5 shrink-0" />
        <div className="flex-1">
          <h3 className="font-bold text-lg">
            Good {getTimeOfDay()}, {user.name?.split(' ')[0] || 'there'}!
          </h3>
          <p className="text-blue-200 text-sm mt-1">
            {daysLeft !== null && daysLeft > 2
              ? `Interview in ${daysLeft} days. `
              : ''}
            {firstWeak
              ? `Focus on: ${firstWeak} — it's your highest-leverage area right now.`
              : readinessScore < 50
              ? 'Start with a Product Sense mock interview to build your foundation.'
              : 'Great progress! Try a challenging mock interview today.'}
          </p>
          <Button
            asChild
            variant="secondary"
            className="mt-4 bg-white/20 hover:bg-white/30 text-white border-0"
          >
            <Link href={actionRoute}>
              {firstWeak ? `Practice ${firstWeak}` : 'Start Mock Interview'}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
