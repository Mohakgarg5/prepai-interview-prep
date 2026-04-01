'use client'

import { Flame } from 'lucide-react'

interface StreakCounterProps {
  streak: number
  longestStreak?: number
}

export function StreakCounter({ streak, longestStreak }: StreakCounterProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2">
        <Flame className={`w-8 h-8 ${streak > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
        <span className="text-4xl font-black text-slate-900 dark:text-white">{streak}</span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Day Streak</p>
      {longestStreak && longestStreak > 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          Best: {longestStreak} days
        </p>
      )}
    </div>
  )
}
