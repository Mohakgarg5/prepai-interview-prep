'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Layers,
  Package,
  Building2,
  Briefcase,
  Zap,
  ClipboardList,
  TrendingUp,
  Settings,
  GraduationCap,
  History,
  BookMarked,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/mock-interview', label: 'Mock Interview', icon: MessageSquare, badge: 'FLAGSHIP' },
  { href: '/mock-interview/history', label: 'Interview History', icon: History },
  { href: '/learn', label: 'Learn', icon: BookMarked, badge: 'NEW' },
  { href: '/stories', label: 'Story Bank', icon: BookOpen },
  { href: '/knowledge', label: 'Knowledge', icon: GraduationCap },
  { href: '/teardown', label: 'Teardown Arena', icon: Package },
  { href: '/company-prep', label: 'Company Prep', icon: Building2 },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/panic-mode', label: 'Panic Mode', icon: Zap },
  { href: '/debrief', label: 'Debrief', icon: ClipboardList },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-64 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-800 flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-lg">PrepAI</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge === 'FLAGSHIP' && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium">
                  ★
                </span>
              )}
              {item.badge === 'NEW' && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-medium">
                  New
                </span>
              )}
              {item.href === '/panic-mode' && (
                <Zap className="w-3 h-3 text-amber-500" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          PrepAI — PM Interview Prep
        </p>
      </div>
    </aside>
  )
}
