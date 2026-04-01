import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, differenceInDays } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'MMM d, yyyy')
}

export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const days = differenceInDays(now, d)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return format(d, 'MMM d')
}

export function daysUntil(date: Date | string | null | undefined): number {
  if (!date) return -1
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  return differenceInDays(d, now)
}

export interface ReadinessData {
  mockSessionScores: number[]
  categoriesPracticed: string[]
  totalCategories: number
  storiesCount: number
  totalBehavioralThemes: number
  recentActivityDays: number[]
  companyPrepCount: number
  targetCompanyCount: number
  weakAreas: string[]
}

export function calculateReadinessScore(data: ReadinessData): number {
  let score = 0

  // Category coverage (30%)
  const categoryCoverage = data.totalCategories > 0
    ? (data.categoriesPracticed.length / data.totalCategories) * 100
    : 0
  score += categoryCoverage * 0.30

  // Average mock interview scores (30%)
  if (data.mockSessionScores.length > 0) {
    const avgScore = data.mockSessionScores.slice(-10).reduce((a, b) => a + b, 0) / Math.min(data.mockSessionScores.length, 10)
    score += avgScore * 0.30
  }

  // Story bank completeness (20%)
  const storyCompleteness = data.totalBehavioralThemes > 0
    ? Math.min((data.storiesCount / data.totalBehavioralThemes) * 100, 100)
    : 0
  score += storyCompleteness * 0.20

  // Recency / streaks (10%)
  const recentDays = data.recentActivityDays.filter(d => d <= 7).length
  const recencyScore = Math.min((recentDays / 7) * 100, 100)
  score += recencyScore * 0.10

  // Company prep completion (10%)
  const companyPrepScore = data.targetCompanyCount > 0
    ? (data.companyPrepCount / data.targetCompanyCount) * 100
    : 50
  score += companyPrepScore * 0.10

  return Math.round(Math.min(score, 100))
}

export function getReadinessColor(score: number): string {
  if (score < 40) return 'text-red-500'
  if (score < 70) return 'text-amber-500'
  return 'text-emerald-500'
}

export function getReadinessLabel(score: number): string {
  if (score < 40) return 'Just Starting'
  if (score < 70) return 'Getting Ready'
  return 'Interview Ready'
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, (c) => c === '<' ? '&lt;' : '&gt;')
    .trim()
    .slice(0, 10000)
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}
