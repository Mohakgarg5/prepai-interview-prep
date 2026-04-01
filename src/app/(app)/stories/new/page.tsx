import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { StoryForm } from '@/components/stories/StoryForm'

export default async function NewStoryPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/signin')

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">New Story</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Add a behavioral story to your bank. Use AI to structure it in STAR format.
        </p>
      </div>
      <StoryForm />
    </div>
  )
}
