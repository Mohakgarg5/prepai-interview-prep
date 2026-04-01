import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Layers, BookOpen, Mic, Target, TrendingUp, Zap } from 'lucide-react'

export default async function RootPage() {
  const session = await getServerSession(authOptions)
  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold">PrepAI</span>
        </div>
        <Link
          href="/signin"
          className="text-sm font-medium bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition-colors"
        >
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-800/50 text-blue-300 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <Zap className="w-3 h-3" />
          AI-powered PM Interview Prep
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-6">
          Land your PM role<br />
          <span className="text-blue-400">with confidence</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
          Practice mock interviews, master PM frameworks, and study with an AI tutor trained on
          the best PM books and Kellogg course materials — all in one place.
        </p>
        <Link
          href="/signin"
          className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-colors"
        >
          Start preparing for free
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              Icon: Mic,
              title: 'Mock Interviews',
              desc: 'Practice with an AI interviewer that asks real PM questions and gives structured feedback on your answers.',
            },
            {
              Icon: BookOpen,
              title: 'AI Tutor',
              desc: 'Ask anything about PM — get answers grounded in Cracking the PM Career, The Product Book, and Kellogg course materials.',
            },
            {
              Icon: Target,
              title: 'Company Prep',
              desc: 'Deep-dive prep for your target companies. Understand their products, culture, and what interviewers look for.',
            },
            {
              Icon: TrendingUp,
              title: 'Progress Tracking',
              desc: 'Know exactly where you stand. Track weak areas, monitor improvement, and focus your prep time wisely.',
            },
            {
              Icon: Zap,
              title: 'Panic Mode',
              desc: 'Interview tomorrow? Get a laser-focused crash plan covering the most important concepts in under an hour.',
            },
            {
              Icon: Layers,
              title: 'Stories & Teardowns',
              desc: 'Craft your behavioral stories using the STAR method. Analyze real products to sharpen your product sense.',
            },
          ].map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-900/40 flex items-center justify-center mb-4">
                <Icon className="w-[18px] h-[18px] text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-800 py-16 text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to start?</h2>
        <p className="text-slate-400 text-sm mb-8">Sign in with Google to create your free account.</p>
        <Link
          href="/signin"
          className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-colors"
        >
          Get started — it&apos;s free
        </Link>
      </section>

      <footer className="text-center text-xs text-slate-600 pb-8">
        PrepAI — PM Interview Preparation Platform
      </footer>
    </div>
  )
}
