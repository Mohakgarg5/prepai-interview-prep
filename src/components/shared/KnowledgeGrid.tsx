"use client"

import * as React from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { ChevronDown, ChevronUp, Lightbulb, Clock, ArrowRight, BarChart2, TrendingUp, Target, MessageSquare, Brain } from "lucide-react"
import { cn } from "@/lib/utils"

interface FrameworkItem {
  slug: string
  title: string
  category: string
  summary: string
  categoryKey: string
}

interface CategoryConfig {
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
  border: string
  dot: string
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  prioritization: {
    label: 'Prioritization',
    icon: BarChart2,
    color: 'text-blue-400',
    bg: 'bg-blue-900/30',
    border: 'border-blue-800/50',
    dot: 'bg-blue-500',
  },
  metrics: {
    label: 'Metrics',
    icon: TrendingUp,
    color: 'text-emerald-400',
    bg: 'bg-emerald-900/30',
    border: 'border-emerald-800/50',
    dot: 'bg-emerald-500',
  },
  strategy: {
    label: 'Product Strategy',
    icon: Target,
    color: 'text-violet-400',
    bg: 'bg-violet-900/30',
    border: 'border-violet-800/50',
    dot: 'bg-violet-500',
  },
  communication: {
    label: 'Communication',
    icon: MessageSquare,
    color: 'text-amber-400',
    bg: 'bg-amber-900/30',
    border: 'border-amber-800/50',
    dot: 'bg-amber-500',
  },
  aipm: {
    label: 'AI-PM Concepts',
    icon: Brain,
    color: 'text-pink-400',
    bg: 'bg-pink-900/30',
    border: 'border-pink-800/50',
    dot: 'bg-pink-500',
  },
}

interface KnowledgeGridProps {
  frameworks: FrameworkItem[]
  query: string
  activeCategory: string | null
}

function FrameworkCard({
  item,
  config,
}: {
  item: FrameworkItem
  config: CategoryConfig
}) {
  const [expanded, setExpanded] = React.useState(false)
  const Icon = config.icon

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-200",
        config.border,
        "bg-slate-900 hover:bg-slate-800/80"
      )}
    >
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full text-left p-5 flex items-start gap-4"
      >
        <div className={cn("rounded-lg p-2 shrink-0 mt-0.5", config.bg)}>
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", config.bg, config.color)}>
              {item.category}
            </span>
          </div>
          <h3 className="text-base font-semibold text-white mt-1.5 leading-snug">{item.title}</h3>
          <p className="text-sm text-slate-400 mt-1 line-clamp-2">{item.summary}</p>
        </div>
        <div className="shrink-0 text-slate-500 mt-1">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-800 pt-4">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-1">When to use</p>
              <p className="text-sm text-slate-300">
                {getWhenToUse(item.slug)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-1">Interview tip</p>
              <p className="text-sm text-slate-300">
                {getInterviewTip(item.slug)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-1">Example</p>
              <p className="text-sm text-slate-300">
                {getExample(item.slug)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Framework-specific content for expanded cards
function getWhenToUse(slug: string): string {
  const map: Record<string, string> = {
    rice: "When comparing multiple features or initiatives objectively. Works best when you have data to estimate reach and effort.",
    moscow: "When aligning stakeholders on scope for a release or sprint. Especially useful for tight timelines.",
    kano: "When deciding which features will genuinely delight vs. just satisfy users. Great for roadmap discussions.",
    ice: "When you need a fast, lightweight prioritization signal. Less rigorous than RICE but quicker to execute.",
    aarrr: "When diagnosing where your product is leaking users or value. Best for growth-focused discussions.",
    heart: "When defining success metrics from the user's perspective. Especially good for feature launches.",
    "north-star": "When aligning the team on long-term direction. Use it to bridge strategy and execution.",
    okrs: "When setting quarterly or annual team goals. Connects individual work to company objectives.",
    "jobs-to-be-done": "When conducting user research or defining product value propositions. Great for discovery work.",
    "blue-ocean": "When evaluating untapped market opportunities. Use in strategy interviews about market entry.",
    "porters-five-forces": "When analyzing competitive dynamics and market attractiveness. Common in strategy rounds.",
    "tam-sam-som": "When justifying market opportunity size. Essential for estimation and strategy interviews.",
    star: "Whenever answering behavioral or leadership questions. The single most important interview framework.",
    circles: "For structured product design interview questions — helps you avoid going blank.",
    mece: "When structuring any complex problem. Shows analytical rigor to interviewers.",
    "transformers-for-pms": "When asked about AI architecture or why a model performs the way it does.",
    rag: "When discussing AI product accuracy improvements or hallucination reduction.",
    "precision-recall": "When defining success metrics for AI features — e.g., spam filters, recommendation systems.",
    "build-vs-buy-ai": "When making AI tooling decisions or justifying a technical product choice.",
    "ai-ethics-frameworks": "When asked about responsible AI, bias, or safety trade-offs in AI products.",
    "latency-accuracy-tradeoff": "When designing real-time AI features like search or autocomplete.",
    "fine-tuning-vs-foundation": "When deciding how to build a specialized AI feature cost-effectively.",
  }
  return map[slug] ?? "Use when the situation calls for a structured, systematic approach to this topic."
}

function getInterviewTip(slug: string): string {
  const map: Record<string, string> = {
    rice: "Always show your math. Write out RICE = (Reach × Impact × Confidence) / Effort on the whiteboard.",
    moscow: "Start by asking 'What does a successful launch look like?' to anchor the Must Haves.",
    kano: "Interviewers love when you identify a Delight feature — it shows customer empathy.",
    ice: "Name ICE if you're short on time and want to appear structured. Acknowledge its limitations vs RICE.",
    aarrr: "Draw the funnel visually. Ask 'Which stage has the biggest drop-off?' to focus the conversation.",
    heart: "Pick 1-2 HEART dimensions that matter most for the product rather than trying to cover all five.",
    "north-star": "The best North Stars reflect user value AND lead revenue. DAU is too shallow; 'songs streamed per DAU' is better.",
    okrs: "Key Results must be measurable. Interviewers notice if you list tasks rather than outcomes.",
    "jobs-to-be-done": "Use the phrase 'When I [situation], I want to [motivation], so I can [outcome]' format.",
    "blue-ocean": "Use the Strategy Canvas to show what you'd eliminate, reduce, raise, and create — it's memorable.",
    "porters-five-forces": "Don't just list the forces — rank them by intensity for the specific company being discussed.",
    "tam-sam-som": "Always bottom-up your TAM estimate. Top-down estimates seem hand-wavy.",
    star: "Spend 60% of time on Action, 20% on Result. Most candidates under-invest in what they actually did.",
    circles: "Spend more time on Cut and Evaluate — that's where junior vs senior PM thinking shows.",
    mece: "Draw a 2x2 or use a list to show MECE structure explicitly. Interviewers want to see it, not just hear it.",
    "transformers-for-pms": "You don't need to explain backpropagation — just understand attention, tokens, and context windows.",
    rag: "Frame RAG as a product decision: when does accuracy matter enough to pay for retrieval latency?",
    "precision-recall": "Always clarify the cost of a false positive vs false negative for the specific use case.",
    "build-vs-buy-ai": "Structure as: strategic differentiation × data moat × cost × time-to-market.",
    "ai-ethics-frameworks": "Concrete examples beat abstract principles. Have a real case ready (facial recognition, hiring AI).",
    "latency-accuracy-tradeoff": "Ask 'What's the user's tolerance for waiting?' before proposing a solution.",
    "fine-tuning-vs-foundation": "Fine-tuning requires labeled data — always ask about data availability first.",
  }
  return map[slug] ?? "Be specific and use concrete numbers when explaining this framework in an interview."
}

function getExample(slug: string): string {
  const map: Record<string, string> = {
    rice: "Spotify deciding between 'Collaborative Playlists' (Reach: 50M/mo, Impact: 2, Confidence: 70%, Effort: 3) vs 'Podcast Chapters' (Reach: 10M/mo, Impact: 3, Confidence: 80%, Effort: 1) — RICE scores: 23.3 vs 24.",
    moscow: "For a mobile banking app launch: Must have — account balance view, transfers. Should have — spending insights. Could have — bill splitting. Won't have — crypto trading.",
    kano: "Netflix: Basic = reliable playback. Performance = more content. Delight = 'Skip Intro' button (unexpected, loved).",
    ice: "Prioritizing a growth team backlog: 'Add social sharing' scores Impact:3, Confidence:7, Ease:8 → ICE 56.",
    aarrr: "DoorDash: Acquisition = paid search + referrals. Activation = first order placed. Retention = weekly order frequency. Revenue = GMV. Referral = 'Give $5 Get $5' program.",
    heart: "Google Maps redesign: Happiness = NPS post-navigation. Engagement = searches per session. Adoption = new feature usage rate. Retention = 30-day re-open rate. Task Success = navigation completion %.",
    "north-star": "Airbnb's North Star: 'Nights booked' — captures both host and guest value, leads revenue, teams can influence it.",
    okrs: "Objective: Make onboarding feel effortless. KR1: Increase Day-7 retention from 40% to 55%. KR2: Reduce time-to-first-value from 8min to 3min. KR3: NPS from new users ≥ 50.",
    "jobs-to-be-done": "'When I'm flying for business, I want to stay productive, so I can feel like I haven't wasted the day.' → product: offline mode, laptop-optimized seat.",
    "blue-ocean": "Cirque du Soleil eliminated animals and star performers, reduced comedy and thrills, raised unique venue experience, created theatrical narrative.",
    "porters-five-forces": "Streaming wars: Rivalry = intense (Netflix/Disney/Apple). Buyer power = high (easy cancel). Substitution = high (YouTube, piracy). New entrants = moderate (capital-heavy). Supplier = growing (content studios demand more).",
    "tam-sam-som": "B2B HR software: TAM = $500B global HR spend. SAM = $50B (mid-market US companies 100-1000 employees). SOM = $500M (reachable in 3 years at current sales velocity).",
    star: "Situation: Our checkout had 40% cart abandonment. Task: Reduce it by Q3. Action: I ran 5 user interviews, found friction at address entry, led A/B test with autofill. Result: Abandonment dropped 18%, revenue +$2M ARR.",
    circles: "Design a flight search for the elderly: Comprehend (accessibility need), Identify (70+ travelers, low tech literacy), Report (large text, voice input), Cut (voice-first), List (solutions), Evaluate (cost vs reach), Summarize (voice-first with large-button fallback).",
    mece: "Root-causing a revenue drop: Revenue = Price × Volume. Volume = New customers + Retained customers. New customers = Organic + Paid. Each branch is mutually exclusive, and together they're exhaustive.",
    "transformers-for-pms": "GPT-4's 128k context window lets it 'remember' an entire codebase in one session — product implication: longer, more coherent conversations without losing context.",
    rag: "Notion AI uses RAG to retrieve relevant pages from your workspace before generating answers — reducing hallucination without retraining the model.",
    "precision-recall": "Spam filter: High precision (few false positives) matters more — users hate losing real emails. Fraud detection: High recall (few false negatives) matters more — missing fraud is catastrophic.",
    "build-vs-buy-ai": "Stripe builds its own fraud models (core IP, proprietary transaction data). Notion buys Claude via API for writing assistance (not core differentiator, faster time-to-market).",
    "ai-ethics-frameworks": "Amazon's recruiting AI downgraded resumes with 'women's' (e.g., women's chess club) — a classic training data bias that reached production. Fix: diverse data + bias audits.",
    "latency-accuracy-tradeoff": "Google Search autocomplete accepts lower accuracy for <100ms latency. Medical AI diagnosis accepts higher latency (seconds) for higher accuracy (lives at stake).",
    "fine-tuning-vs-foundation": "GitHub Copilot fine-tunes on code repositories for domain accuracy. A startup building a general chatbot uses GPT-4 directly — fine-tuning not worth the labeled data cost.",
  }
  return map[slug] ?? "Apply this framework to a product you know well to build intuition before your interview."
}

export function KnowledgeGrid({
  frameworks,
  query,
  activeCategory,
}: KnowledgeGridProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setCategory = (cat: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (cat) {
      params.set("cat", cat)
    } else {
      params.delete("cat")
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const filtered = frameworks.filter((f) => {
    const matchesCategory = !activeCategory || f.categoryKey === activeCategory
    const matchesQuery =
      !query ||
      f.title.toLowerCase().includes(query) ||
      f.summary.toLowerCase().includes(query) ||
      f.category.toLowerCase().includes(query)
    return matchesCategory && matchesQuery
  })

  const grouped = Object.entries(CATEGORY_CONFIG).reduce<
    Record<string, FrameworkItem[]>
  >((acc, [key]) => {
    const items = filtered.filter((f) => f.categoryKey === key)
    if (items.length > 0) acc[key] = items
    return acc
  }, {})

  return (
    <div className="w-full space-y-8">
      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategory(null)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
            !activeCategory
              ? "bg-blue-700 text-white border-blue-600"
              : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-600"
          )}
        >
          All ({frameworks.length})
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const Icon = config.icon
          const count = frameworks.filter((f) => f.categoryKey === key).length
          return (
            <button
              key={key}
              onClick={() => setCategory(activeCategory === key ? null : key)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
                activeCategory === key
                  ? `${config.bg} ${config.color} ${config.border}`
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-600"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {config.label}
              <span className="text-xs opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-400 text-sm">No frameworks match your search.</p>
          <button
            onClick={() => setCategory(null)}
            className="mt-2 text-blue-400 text-sm hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : activeCategory ? (
        // Single category view
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <FrameworkCard
              key={item.slug}
              item={item}
              config={CATEGORY_CONFIG[item.categoryKey]}
            />
          ))}
        </div>
      ) : (
        // All categories grouped
        <div className="space-y-8">
          {Object.entries(grouped).map(([catKey, items]) => {
            const config = CATEGORY_CONFIG[catKey]
            const Icon = config.icon
            return (
              <section key={catKey}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={cn("rounded-lg p-1.5", config.bg)}>
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <h2 className="text-base font-semibold text-white">{config.label}</h2>
                  <span className="text-xs text-slate-500 ml-1">({items.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((item) => (
                    <FrameworkCard key={item.slug} item={item} config={config} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
