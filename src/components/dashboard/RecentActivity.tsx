import { formatRelativeDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface ActivityItem {
  id: string
  category: string
  activity: string
  score: number | null
  timeSpent: number
  createdAt: string
}

interface RecentActivityProps {
  activities: ActivityItem[]
}

const ACTIVITY_LABELS: Record<string, string> = {
  MOCK_INTERVIEW: 'Mock Interview',
  TEARDOWN: 'Product Teardown',
  FRAMEWORK_STUDY: 'Framework Study',
  STORY_CRAFTING: 'Story Crafting',
  COMPANY_RESEARCH: 'Company Research',
  DEBRIEF: 'Interview Debrief',
  PANIC_MODE_REVIEW: 'Panic Mode Review',
}

const CATEGORY_LABELS: Record<string, string> = {
  PRODUCT_SENSE: 'Product Sense',
  EXECUTION: 'Execution',
  STRATEGY: 'Strategy',
  BEHAVIORAL: 'Behavioral',
  ESTIMATION: 'Estimation',
  METRICS: 'Metrics',
  PRODUCT_DESIGN: 'Design',
  TECHNICAL_AI: 'Technical AI',
  ML_SYSTEM_DESIGN: 'ML Design',
  AI_ETHICS: 'AI Ethics',
}

export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500 italic py-4">
        No activity yet — complete your first mock interview to get started!
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {activities.slice(0, 5).map((activity) => (
        <div
          key={activity.id}
          className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {ACTIVITY_LABELS[activity.activity] || activity.activity}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {CATEGORY_LABELS[activity.category] || activity.category} ·{' '}
              {formatRelativeDate(new Date(activity.createdAt))} · {activity.timeSpent}m
            </p>
          </div>
          {activity.score !== null && (
            <Badge
              variant="secondary"
              className={
                activity.score >= 70
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  : activity.score >= 40
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              }
            >
              {Math.round(activity.score)}%
            </Badge>
          )}
        </div>
      ))}
    </div>
  )
}
