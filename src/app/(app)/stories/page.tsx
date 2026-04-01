import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { StoryCard } from '@/components/stories/StoryCard'
import { Plus, BookOpen, Star, Layers } from 'lucide-react'
import { BEHAVIORAL_THEMES } from '@/lib/constants'

export default async function StoriesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/signin')
  const userId = (session.user as { id?: string }).id!

  const stories = await prisma.behavioralStory.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  })

  const totalStories = stories.length
  const avgStrength =
    totalStories > 0
      ? Math.round((stories.reduce((sum, s) => sum + s.strength, 0) / totalStories) * 10) / 10
      : 0
  const allThemes = new Set(stories.flatMap((s) => s.themes))
  const themesCovered = allThemes.size

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Story Bank</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Craft and organize your behavioral interview stories
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/stories/new">
            <Plus className="w-4 h-4" />
            New Story
          </Link>
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-blue-700 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalStories}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Stories</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {totalStories > 0 ? avgStrength : '—'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Avg Strength</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-purple-700 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {themesCovered}/{BEHAVIORAL_THEMES.length}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Themes Covered</p>
          </div>
        </div>
      </div>

      {/* Stories grid */}
      {totalStories === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No stories yet
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mb-6">
            Start building your story bank. Paste a raw experience and let AI structure it into the STAR format.
          </p>
          <Button asChild>
            <Link href="/stories/new">
              <Plus className="w-4 h-4" />
              Add your first story
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {stories.map((story) => (
            <StoryCard
              key={story.id}
              story={{
                id: story.id,
                title: story.title,
                themes: story.themes as string[],
                strength: story.strength,
                companies: story.companies,
                situation: story.situation,
                task: story.task,
                action: story.action,
                result: story.result,
                updatedAt: story.updatedAt.toISOString(),
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
