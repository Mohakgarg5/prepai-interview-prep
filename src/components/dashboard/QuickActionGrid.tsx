import Link from 'next/link'
import { MessageSquare, Package, BookOpen, Layers, Building2, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickActionGridProps {
  interviewWithinHours?: number | null
}

const actions = [
  {
    href: '/mock-interview',
    label: 'Mock Interview',
    description: 'Practice with AI',
    icon: MessageSquare,
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    border: 'border-blue-200 dark:border-blue-900',
  },
  {
    href: '/teardown',
    label: 'Product Teardown',
    description: 'Analyze products',
    icon: Package,
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-950/50',
    border: 'border-purple-200 dark:border-purple-900',
  },
  {
    href: '/knowledge',
    label: 'Frameworks',
    description: 'Study PM frameworks',
    icon: Layers,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    border: 'border-emerald-200 dark:border-emerald-900',
  },
  {
    href: '/stories',
    label: 'Story Bank',
    description: 'Build your STAR stories',
    icon: BookOpen,
    color: 'text-teal-600',
    bg: 'bg-teal-50 dark:bg-teal-950/50',
    border: 'border-teal-200 dark:border-teal-900',
  },
  {
    href: '/company-prep',
    label: 'Company Prep',
    description: 'Deep dive research',
    icon: Building2,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 dark:bg-indigo-950/50',
    border: 'border-indigo-200 dark:border-indigo-900',
  },
  {
    href: '/panic-mode',
    label: 'Panic Mode',
    description: 'Last-minute review',
    icon: Zap,
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    border: 'border-amber-200 dark:border-amber-900',
    highlight: true,
  },
]

export function QuickActionGrid({ interviewWithinHours }: QuickActionGridProps) {
  const isPanicTime = interviewWithinHours !== null && interviewWithinHours !== undefined && interviewWithinHours <= 48

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {actions.map((action) => {
        const Icon = action.icon
        const isPanic = action.href === '/panic-mode' && isPanicTime

        return (
          <Link
            key={action.href}
            href={action.href}
            className={cn(
              'rounded-xl border p-4 hover:shadow-md transition-all duration-150 group',
              isPanic
                ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 shadow-amber-100 dark:shadow-amber-900/20 shadow-md'
                : `${action.bg} ${action.border}`
            )}
          >
            <Icon
              className={cn(
                'w-6 h-6 mb-3 group-hover:scale-110 transition-transform',
                action.color
              )}
            />
            <p className="font-semibold text-sm text-slate-900 dark:text-white">{action.label}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{action.description}</p>
            {isPanic && (
              <span className="mt-2 inline-block text-xs font-bold text-amber-700 dark:text-amber-300">
                Interview soon!
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
