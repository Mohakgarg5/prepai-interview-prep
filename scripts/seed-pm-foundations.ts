/**
 * PM Foundations 0→1 Knowledge Seeder
 * Hand-crafted comprehensive guide for complete beginners
 * Usage: npx tsx scripts/seed-pm-foundations.ts
 */

import OpenAI from 'openai'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const EMBEDDING_MODEL = 'text-embedding-3-small'
const SOURCE = 'pm-foundations'

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')
  return new OpenAI({ apiKey })
}

const FOUNDATIONS_CHUNKS: { chapterRef: string; content: string }[] = [
  // ─── WHAT IS A PRODUCT MANAGER ───────────────────────────────────────────
  {
    chapterRef: 'what-is-pm',
    content: `What is a Product Manager (PM)?

A Product Manager is the person responsible for defining WHAT gets built and WHY. They sit at the intersection of business, technology, and user experience.

Key definition: A PM identifies the right problems to solve, defines what success looks like, and guides a cross-functional team to ship products that create value for users and the business.

Common misconceptions:
- PMs are NOT project managers (they don't just track timelines)
- PMs are NOT the "boss" of engineers or designers
- PMs are NOT just feature requesters

What PMs actually do:
- Discover user problems through research and data
- Define and prioritize what to build
- Write product specs and user stories
- Align engineers, designers, and stakeholders
- Measure success after launch
- Iterate based on feedback

The PM is often called the "CEO of the product" — but without direct authority. You must lead through influence, not hierarchy. You need to convince, inspire, and align people who don't report to you.

Types of PM roles:
- General PM: Broad product ownership across features
- Growth PM: Focused on acquisition, retention, monetization
- Technical PM: Works closely with infrastructure/platform teams
- AI/ML PM: Focuses on machine learning products and data pipelines
- Associate PM (APM): Entry-level rotational program (Google, Meta, etc.)`,
  },
  {
    chapterRef: 'pm-vs-other-roles',
    content: `How PM differs from other roles

PM vs. Project Manager:
- Project Manager: Focuses on HOW (timelines, resources, risks, execution)
- Product Manager: Focuses on WHAT and WHY (strategy, user needs, prioritization)
- At many companies these overlap, but they are fundamentally different disciplines

PM vs. Engineer:
- Engineers decide HOW to build something (architecture, code, technical approach)
- PMs decide WHAT to build and WHY (user needs, business value, prioritization)
- Great PMs understand technology enough to have credible conversations, but don't need to code

PM vs. Designer:
- Designers own HOW the product looks and feels (UX, visual design, interaction patterns)
- PMs own the problem definition, success metrics, and scope
- The PM-designer relationship is one of the most important partnerships in product work

PM vs. Data Analyst:
- Analysts interpret what the data says
- PMs use data to make decisions and set priorities
- PMs need data literacy but don't need to be statisticians

The Product Triad: The core team at most modern tech companies is Engineer + Designer + Product Manager. All three own the product together. Engineers own "can we build it?" Designers own "should it look/work like this?" PMs own "should we build this at all?"`,
  },
  {
    chapterRef: 'pm-skills-overview',
    content: `The 5 Core Skill Areas Every PM Needs

1. Product Skills — Understanding users, data, and design
   - User insight: deeply understanding user needs, problems, and motivations
   - Data insight: using metrics, A/B tests, and analytics to make decisions
   - Analytical problem solving: structuring ambiguous problems
   - Product and design sense: knowing what makes a great product experience
   - Technical skills: understanding APIs, systems, and engineering constraints

2. Execution Skills — Shipping products
   - Project management: keeping teams on track without micromanaging
   - Scoping and MVPs: defining the smallest thing that delivers value
   - Product launches: coordinating go-to-market
   - Getting things done: unblocking teams, making decisions quickly

3. Strategic Skills — Setting direction
   - Product vision: painting a compelling picture of the future
   - Product strategy: how you'll win in your market
   - Roadmapping: prioritizing what to build over time
   - Goal setting with OKRs: defining measurable success

4. Leadership Skills — Working with people
   - Influencing without authority: persuading without power
   - Communication: clear, crisp writing and speaking
   - Collaboration: making the team better together
   - Ownership mentality: caring deeply about outcomes

5. People Management Skills — Growing others (senior PMs)
   - Recruiting and interviewing PMs
   - Coaching and developing your team
   - Organizational design and team structure`,
  },

  // ─── PRODUCT LIFECYCLE ───────────────────────────────────────────────────
  {
    chapterRef: 'product-lifecycle',
    content: `The Product Development Lifecycle: Discover → Define → Design → Develop → Deliver → Debrief

Every product goes through phases. PMs run two tracks simultaneously: discovery (figuring out what to build next) and delivery (shipping what's currently in development).

DISCOVER — Finding the right problem to solve
- Read feature requests and support tickets
- Interview users and observe their behavior
- Analyze funnel metrics and usage data
- Research competitors and market trends
- Run design sprints
- Key question: "What is the most important problem we should solve?"
- Failure mode: skipping this phase and just building what someone requested

DEFINE — Scoping the solution
- Narrow the problem to a specific, feasible slice
- Pick a target customer segment
- Map the customer journey
- Define success metrics
- Write the product vision for this initiative
- Create a high-level roadmap
- Key question: "What exactly are we building, for whom, and how will we know it worked?"
- Failure mode: misalignment with your team because the scope wasn't clear

DESIGN — Exploring solutions
- Whiteboard and brainstorm multiple solutions
- Write a product spec
- Create wireframes and prototypes
- Run usability tests with users
- Give feedback on design mocks
- Key question: "What's the best way to solve this problem?"
- Failure mode: going with the first idea without testing alternatives

DEVELOP — Building
- Write engineering stories and tickets
- Triage bugs and unblock engineers
- Check in regularly with the team
- Keep stakeholders updated
- Try features as they're built
- Key question: "Are we building the right thing, and are we on track?"

DELIVER — Launching
- Run beta tests, A/B tests, and stability tests
- Coordinate with marketing, sales, and support
- Write release notes and launch comms
- Monitor metrics closely post-launch
- Key question: "Did we ship something that works and reaches users safely?"

DEBRIEF — Learning
- Run a retrospective: what went well, what didn't
- Analyze launch metrics vs. goals
- Read customer feedback
- Prioritize follow-up work
- Share learnings with the broader company
- Key question: "What did we learn, and what do we do next?"`,
  },

  // ─── USER RESEARCH ───────────────────────────────────────────────────────
  {
    chapterRef: 'user-research-basics',
    content: `User Research for PMs: How to Understand Your Users

The #1 mistake new PMs make: building products without talking to real users. User insight is the foundation of all great product work.

How to talk to users:
- Aim for 5–10 user interviews per project at minimum
- Use open-ended questions: "Walk me through the last time you tried to do X"
- Avoid leading questions: "Would you use this feature?" (everyone says yes)
- Ask about past behavior, not hypothetical future behavior
- Listen for emotions, frustrations, and workarounds — these are goldmines

The Jobs-to-be-Done (JTBD) framework:
People don't buy products; they "hire" them to do a job. Focus on the job, not the demographic.
Template: "When I [situation], I want to [motivation], so I can [outcome]."
Example: "When I'm throwing a party, I want upbeat music ready, so my friends have a great time."

Digging below surface needs:
- Users tell you what they want (a lighter arm), but the real problem is something deeper (maneuverability)
- Ask "why" 3–5 times to get to the root problem
- Treat feature requests as signals, not requirements

Types of user research:
1. User interviews — qualitative, great for understanding motivations
2. Usability tests — watch users try to complete tasks in your product
3. Surveys — quantitative, good for "how many" questions
4. Field studies — observe users in their natural environment
5. Diary studies — users log their own behavior over time
6. Beta programs — small group gets early access to give feedback

Common mistakes:
- Asking leading questions ("Don't you think this would be helpful?")
- Interviewing too many users for usability studies (5 is enough to find patterns)
- Using focus groups (people perform for each other, not honest)
- Treating what users say as what they'll actually do`,
  },
  {
    chapterRef: 'user-insight-advanced',
    content: `Advanced User Insight: Customer Journey and Usability Heuristics

The Customer Journey Framework
Every user goes through stages with your product. Map them all:
1. Awareness — How do they find out your product exists?
2. Consideration — What makes them consider signing up or buying?
3. Purchase/Activation — What makes them commit and get started?
4. Retention — What keeps them coming back?
5. Advocacy — What makes them recommend you to others?

Most PMs over-invest in features for existing users and under-invest in acquisition and activation. Improving any stage can dramatically improve product success.

Jakob Nielsen's 10 Usability Heuristics — memorize these:
1. Visibility of system status — always tell users what's happening
2. Match real-world conventions — use familiar language and concepts
3. User control and freedom — provide undo/redo and escape routes
4. Consistency and standards — follow platform conventions
5. Error prevention — design to prevent mistakes before they happen
6. Recognition over recall — don't make users memorize things
7. Flexibility and efficiency — power users should have shortcuts
8. Aesthetic and minimalist design — every element competes for attention
9. Help users recognize and recover from errors — plain language, not error codes
10. Help and documentation — if needed, make it easy to find

Additional usability principles:
- Limited attention: users won't read; they scan. Make the primary action obvious.
- Whitespace matters: cramped UIs feel hard, but too much space feels slow
- Accessibility: 4% of people are colorblind. Don't rely on color alone for meaning.
- Mobile-first: more than 50% of web traffic is mobile globally`,
  },

  // ─── DATA & METRICS ──────────────────────────────────────────────────────
  {
    chapterRef: 'metrics-fundamentals',
    content: `Metrics for PMs: How to Define and Measure Success

Why metrics matter:
User research tells you WHY people do things. Metrics tell you WHAT they actually do at scale. Both are essential. Great PMs are fluent in both.

Good metrics vs. vanity metrics:
Vanity metrics feel good but don't tell you if the product is improving:
- Total registered users (always goes up, never down)
- Total page views (can be gamed by adding more pages)
- App downloads (says nothing about usage)

Good metrics are actionable and correlated with real value:
- Week 1 retention rate (% of new users who come back in week 1)
- Daily Active Users / Monthly Active Users ratio (DAU/MAU)
- Average revenue per user (ARPU)
- Net Promoter Score (NPS) — "How likely are you to recommend us?"
- Time to first value (how quickly does a new user experience the core value?)

The AARRR Pirate Metrics Framework (Dave McClure):
- Acquisition: New users finding and signing up for your product
- Activation: Users having a successful first experience (e.g., Facebook's "10 friends in 7 days")
- Retention: Users coming back (tracked as DAU, MAU, or cohort retention curves)
- Revenue: Users paying you (track LTV:CAC ratio — should be at least 3:1)
- Referral: Users recommending you (NPS, viral coefficient, invite rate)

Setting up a metrics dashboard — include:
- Core success metrics (retention, revenue, engagement)
- Precursor metrics (what drives success metrics)
- Usage metrics (how people actually use features)
- Normalize by active users, not raw counts
- Account for seasonality by comparing to same period last year
- Use 7-day rolling averages to smooth out spikes`,
  },
  {
    chapterRef: 'ab-testing',
    content: `A/B Testing: Running Experiments as a PM

What is an A/B test?
An A/B test (split test) shows two versions of your product to random groups of users simultaneously. You measure which version better achieves your goal. After the test, the winning version rolls out to 100% of users.

Why A/B testing matters:
- Tells you what users actually DO, not just what they say they'll do
- Eliminates external factors (seasonality, competitor news) by running simultaneously
- Gives statistical confidence that a change is real, not random

When to use A/B tests:
- High-traffic pages and flows (signup, onboarding, checkout)
- Changes with expected short-term measurable effects
- When you have enough users to reach statistical significance

When NOT to use A/B tests:
- Low-traffic features (you won't have enough data)
- Major UX redesigns (too many variables at once)
- Features that build habit over months (hard to measure quickly)

Key statistics concepts:
- Statistical significance: the result is unlikely to be random (p < 0.05 means 95% confidence)
- Confidence interval: the range where the true effect likely falls (e.g., +2% to +8% signups)
- P-hacking: fishing for significant results by testing too many metrics — avoid by pre-registering what you'll measure
- Minimum detectable effect: define what improvement size matters before running the test

Rule of thumb: Run your A/B test until you have statistical significance, but don't run it indefinitely. Work with a data scientist to calculate sample size needed upfront.`,
  },

  // ─── ANALYTICAL PROBLEM SOLVING ──────────────────────────────────────────
  {
    chapterRef: 'analytical-problem-solving',
    content: `Analytical Problem Solving: How PMs Structure Ambiguous Problems

PMs face ambiguous problems every day:
- "Why did our metrics drop 20% last week?"
- "Should we build feature A or feature B?"
- "How can we grow revenue by 30%?"
- "Should we delay launch to fix this bug?"

Two types of problems:

1. Exploratory problems — "How can we improve X?"
   - Slice the problem space before brainstorming solutions
   - For "How can we grow revenue?":
     - New vs. existing customers
     - Subscription vs. ads vs. marketplace revenue
     - Small optimizations vs. big bets
     - Different customer segments
   - By slicing first, you generate better, more creative solutions

2. Decision-making problems — "Which option is best?"
   - Reduce to core tradeoffs (low risk vs. high risk, short-term vs. long-term)
   - Create a decision framework or scoring matrix
   - Separate facts (what we know) from assumptions (what we believe)
   - Identify the cheapest way to validate your key assumptions

When metrics drop — diagnostic framework:
1. Is the drop real, or a tracking/instrumentation bug?
2. Did we change something? (launch, A/B test, marketing change)
3. Did something external happen? (competitor, news, holiday)
4. Is it global or localized? (geography, platform, segment)
5. Is it in one part of the funnel or everywhere?
6. Is it a specific customer type or all customers?

The goal of analytical PM work: bring clarity to ambiguity by structuring the problem, gathering the right data, and driving the team to a decision.`,
  },

  // ─── PRIORITIZATION ──────────────────────────────────────────────────────
  {
    chapterRef: 'prioritization-frameworks',
    content: `Prioritization: How PMs Decide What to Build Next

Prioritization is one of the most important and hardest PM skills. Every "yes" means saying "no" to something else.

Principles of good prioritization:
1. Align with company strategy and goals first
2. Maximize impact per unit of effort
3. Be explicit about what you're NOT building
4. Revisit priorities regularly — things change

The RICE Framework:
Score = (Reach × Impact × Confidence) / Effort
- Reach: How many users affected per time period?
- Impact: How much does this move your key metric? (0.25 = minimal, 1 = moderate, 3 = massive)
- Confidence: How sure are you in your estimates? (Low=50%, Medium=80%, High=100%)
- Effort: Person-months to build
- Higher RICE score = higher priority

The MoSCoW Method (good for scoping releases):
- Must have: Non-negotiable for launch
- Should have: Important but not critical
- Could have: Nice-to-have if time allows
- Won't have: Explicitly deferred

Kano Model (understanding what delights vs. just satisfies):
- Basic needs: Expected features (their absence causes dissatisfaction; their presence is neutral)
- Performance needs: More = better (faster, cheaper, more features)
- Delighters: Unexpected features that create "wow" moments

Common prioritization mistakes:
- HiPPO problem: Highest Paid Person's Opinion drives decisions instead of data
- Saying yes to everything: results in a bloated, unfocused product
- Ignoring technical debt: eventually slows everything down
- Not communicating tradeoffs: stakeholders feel blindsided when their requests aren't prioritized`,
  },

  // ─── WRITING PRODUCT SPECS ───────────────────────────────────────────────
  {
    chapterRef: 'product-specs',
    content: `Writing Product Specs and PRDs

A product spec (or PRD — Product Requirements Document) is the PM's primary written artifact. It communicates WHAT you're building, WHY, and what success looks like.

A good spec includes:
1. Problem statement — What user/business problem are we solving? Why now?
2. Goals and success metrics — How will we know this worked? (quantifiable)
3. Non-goals — Explicitly what is out of scope (prevents scope creep)
4. User stories — "As a [user type], I want to [action] so that [benefit]"
5. Functional requirements — What the product must do
6. UX mocks/wireframes — How it looks and works
7. Edge cases and error states — What happens when things go wrong
8. Technical constraints — What the engineers have flagged
9. Launch plan — How and when this goes out

Tips for writing great specs:
- Be precise. Vague requirements lead to wrong implementations.
- Write for the reader — your engineers and designers haven't lived in your head
- Include the "why" behind decisions — it helps when requirements change
- Keep it as short as possible while being complete
- Link to user research data that supports your decisions

User stories format: "As a [type of user], I want to [perform an action], so that [achieve a goal]."

Example: "As a new user, I want to import my existing tasks from another app, so I don't have to re-enter everything manually."

Acceptance criteria: Define exactly when a story is "done." Be specific:
- Good: "User can upload files up to 10MB in .jpg, .png, or .pdf format"
- Bad: "User can upload files"`,
  },

  // ─── STRATEGY ────────────────────────────────────────────────────────────
  {
    chapterRef: 'product-strategy',
    content: `Product Strategy: Setting Direction for Your Product

Product strategy answers: How will your product win in the market, and what bets will you make to get there?

A good product strategy has three components:
1. Diagnosis — What's the competitive situation? What are the key challenges?
2. Guiding policy — What approach will you take? What will you NOT do?
3. Coherent actions — The specific moves that reinforce each other

Product Vision vs. Strategy vs. Roadmap:
- Vision: The inspiring future state ("10 years from now, we will...")
- Strategy: How you'll get there ("We'll win by focusing on X over Y")
- Roadmap: The near-term plan (next 6-18 months of work)

How to write a product vision:
- Describe the world as it will be when you succeed
- Make it ambitious but believable
- Focus on user impact, not features
- It should inspire your team and help them make decisions without you
- Test it: does it tell you what to prioritize? Does it help you say no to things?

Porter's Five Forces (for competitive strategy):
1. Competitive rivalry — who are you competing with directly?
2. Threat of new entrants — how easy is it for new players to enter?
3. Bargaining power of suppliers — how much leverage do partners have?
4. Bargaining power of buyers — how much leverage do customers have?
5. Threat of substitutes — what else could users do instead of your product?

Network effects — the most powerful strategic moat:
A product has network effects when it gets more valuable as more people use it (e.g., Slack, WhatsApp, Airbnb). If you have network effects, focus on reaching critical mass in specific markets before expanding.`,
  },
  {
    chapterRef: 'roadmapping',
    content: `Roadmapping and Prioritization at Scale

A roadmap is a plan that communicates where the product is headed, why, and roughly when. It's a communication tool, not a commitment.

Roadmap principles:
- Outcome-based, not output-based — "Improve new user activation by 20%" not "Build onboarding tour"
- Always tied to strategy — every item should connect to a business or user goal
- Rough time horizons — Now / Next / Later rather than specific dates when uncertain
- Living document — update it regularly as you learn

Now / Next / Later framework:
- Now: Currently being worked on (committed, high confidence)
- Next: Next 1-3 months (high priority, roughly scoped)
- Later: Beyond 3 months (directional, likely to change)

How to build a roadmap:
1. Start with goals (OKRs, company priorities, team mission)
2. Identify the key bets that move those goals
3. Size and sequence bets by impact and dependencies
4. Leave slack — 20-30% of capacity for bugs, tech debt, and unplanned work
5. Share early and get buy-in from engineering, design, and leadership
6. Communicate tradeoffs explicitly

Roadmap stakeholder management:
- Sales will always want features for specific deals — evaluate ROI objectively
- Engineering will flag technical debt — budget for it explicitly (not as a side item)
- Leadership will push for big bets — balance with quick wins that show progress
- Other PMs will compete for shared resources — coordinate through a portfolio roadmap`,
  },

  // ─── OKRs AND GOALS ──────────────────────────────────────────────────────
  {
    chapterRef: 'okrs-goals',
    content: `OKRs: Setting and Measuring Team Goals

OKR stands for Objectives and Key Results. Created at Intel, popularized by Google. The most widely used goal-setting framework in tech.

Structure:
- Objective: Qualitative, inspiring direction ("Become the go-to tool for remote teams")
- Key Results: Quantitative, measurable outcomes that define success (3-5 per objective)
  - "Increase DAU/MAU ratio from 35% to 50%"
  - "Achieve NPS > 40 among power users"
  - "Grow enterprise customers from 50 to 150"

Rules for great OKRs:
- Objectives should be inspiring and ambitious, not a list of tasks
- Key Results must be measurable (if it doesn't have a number, it's not a KR)
- Aim for 60-70% achievement at end of quarter — if you always hit 100%, you're not ambitious enough
- Don't have more than 3-5 OKRs per team — focus is the point
- Separate aspirational OKRs (moonshots) from committed OKRs (must deliver)

OKR anti-patterns:
- Output OKRs: "Launch feature X" — this is a task, not an outcome
- Too many KRs: dilutes focus
- Top-down dictation: teams need to own their OKRs
- Not reviewing them: OKRs only work if you check in weekly

North Star Metric:
Every product should have ONE metric that best captures the core value delivered to users. Everything else should be in service of this metric.
- Facebook: Daily Active Users
- Airbnb: Nights booked
- Spotify: Time spent listening
- Slack: Messages sent

Your North Star should: (1) reflect user value, (2) predict long-term revenue, (3) be measurable, and (4) be something your team can directly influence.`,
  },

  // ─── EXECUTION SKILLS ────────────────────────────────────────────────────
  {
    chapterRef: 'scoping-mvp',
    content: `Scoping and MVPs: Shipping Faster by Doing Less

The biggest execution failure is building too much. The MVP (Minimum Viable Product) is the smallest thing you can ship that delivers real value and teaches you what to build next.

MVP principles:
- "Viable" means real users get real value, not just a prototype
- Start with the riskiest assumption and test it first
- Scope for learning, not for completeness
- Every feature you cut accelerates learning

How to scope an MVP:
1. List everything you think the product needs
2. Identify the single core use case users care most about
3. Cut everything that isn't essential for that use case
4. Ask: "If we removed this, would the core experience break?"
5. What you cut becomes v2, v3, and the backlog

Incremental development:
Don't build all of a feature at once. Decompose into vertical slices:
- Each slice should be independently shippable
- Each slice should add user value
- Don't build horizontally (all the backend, then all the frontend)

Common scope creep traps:
- "While we're in there" — just because you touched this code doesn't mean you should add features
- "Edge cases" — solve the 80% case first, handle edge cases later based on real feedback
- "Polishing" — launching at 80% quality gets you real user data that polishing can't

The launch/learn cycle:
Ship → Measure → Learn → Ship again. The faster you cycle, the faster you improve. Companies that ship weekly learn 10x faster than companies that ship quarterly.`,
  },
  {
    chapterRef: 'project-management',
    content: `Project Management for PMs: Getting Things Done

PMs are responsible for the outcome, even if they don't directly manage the team's time. Getting things done through influence is a core skill.

Sprint planning and agile basics:
- Sprint: A fixed time box (typically 2 weeks) in which the team commits to specific work
- Backlog: The prioritized list of all upcoming work
- Sprint review: Demo of what was built
- Retrospective: What went well, what didn't, what to change
- Standups: Daily 15-min syncs — what did you do, what are you doing, what's blocking you

PM's role in sprints:
- Maintain a groomed backlog (stories written, estimated, prioritized)
- Be available to answer questions during the sprint
- Remove blockers immediately — don't wait for the next meeting
- Avoid changing sprint scope mid-sprint except for critical bugs

Managing dependencies:
Most products depend on other teams (infrastructure, auth, payments, etc.). Manage this proactively:
- Identify dependencies early, not when you're blocked
- Get commitments from other teams explicitly
- Have a fallback plan if they slip

Handling stakeholder pressure:
- When executives push for faster timelines: show the tradeoff (scope or quality must flex)
- When sales pushes for custom features: evaluate ROI vs. roadmap cost
- When engineers push back on estimates: dig into why, resolve root cause
- When QA finds late-breaking bugs: use severity × customer impact to decide ship/hold

Managing up:
- Keep your manager informed with brief, proactive updates
- Surface risks early, not after they become crises
- Bring solutions, not just problems
- Know what your manager cares about and make sure those things get attention`,
  },

  // ─── PRODUCT LAUNCHES ────────────────────────────────────────────────────
  {
    chapterRef: 'product-launches',
    content: `Product Launches: How to Ship Successfully

A launch is more than pressing the deploy button. Successful launches require coordination across product, engineering, design, marketing, sales, and support.

Pre-launch checklist:
- Metrics instrumentation in place before launch (you can't analyze what you didn't track)
- QA completed — ideally automated + manual testing
- Rollback plan documented — how do you revert if something goes wrong?
- Support team briefed on what's new and expected questions
- Sales/CS notified and trained if the change affects their workflows
- Internal announcement drafted
- External comms prepared (blog post, email, in-app notification)

Launch strategies:
- Silent launch: Push to production with no announcement (for backend changes, small improvements)
- Beta / early access: Give a small group access first to validate before full rollout
- Percentage rollout: Roll out to 5% → 20% → 100% while monitoring metrics
- Feature flags: Ship the code but control who sees it via a toggle
- Hard launch: Full rollout with marketing campaign

Post-launch monitoring:
- Watch crash rates, error rates, and load times in first 24 hours
- Monitor your core success metrics vs. pre-launch baseline
- Read customer feedback in support channels, app store reviews, and social media
- Schedule a debrief 1-2 weeks after launch

The launch debrief:
- Did we hit our success metrics?
- What surprised us?
- What would we do differently?
- What should we build next based on what we learned?
- Share findings with the broader team and leadership`,
  },

  // ─── LEADERSHIP SKILLS ───────────────────────────────────────────────────
  {
    chapterRef: 'influence-without-authority',
    content: `Influencing Without Authority: The Core PM Leadership Skill

PMs have responsibility without authority. You can't order engineers or designers to do things — you must earn their buy-in.

Why engineers follow great PMs:
1. You understand their work (technical empathy)
2. You protect their time from unnecessary meetings and context-switching
3. You make good decisions quickly, reducing rework
4. You give them credit and shield them from blame
5. You have a clear vision of why the work matters

How to build influence:
- Be right often: develop strong product intuition backed by data and user research
- Be trusted: do what you say you'll do, follow through on commitments
- Be helpful: find ways to make others' work easier, not just your own
- Be transparent: share information openly, including bad news
- Be curious: show genuine interest in others' work and goals

Handling disagreements:
- Start by understanding their perspective fully (you may be missing something)
- Find common ground — you usually share the same end goal
- Use data and user research as objective arbiter
- Present tradeoffs, not mandates — "If we do X, we get A but give up B"
- Disagree and commit: once a decision is made, support it fully even if you disagreed

Influencing executives:
- Know what they care about (metrics? customer feedback? competitive position?)
- Lead with the conclusion, then support with data
- Anticipate their objections and address them proactively
- Ask for input before making decisions (makes them feel ownership)
- Communicate risk clearly — executives hate surprises more than bad news`,
  },
  {
    chapterRef: 'communication-pm',
    content: `Communication Skills for PMs

Clear communication is the PM's most-used tool. You communicate constantly: in specs, in meetings, in presentations, in Slack, in emails.

Writing clearly:
- Lead with the conclusion (BLUF: Bottom Line Up Front)
- Use short sentences and plain language
- Structure with headers for anything longer than 3 paragraphs
- Use bullet points for lists of 3+ items
- Every doc should answer: what decision do you need, and when?

The PM communication stack:
- Strategy: Vision docs, strategy memos (quarterly)
- Planning: Roadmaps, PRDs, specs (monthly)
- Execution: Sprint goals, weekly updates, standups (weekly/daily)
- Escalation: Risk alerts, blockers (as needed)

Meeting facilitation:
- Every meeting needs an agenda and an owner
- Start with the decision/outcome you need from the meeting
- Time-box discussions — if you're stuck, table it and decide asynchronously
- End with clear next steps and owners
- If a meeting can be an email, make it an email

Presenting to leadership:
1. Open with the key message ("We're recommending we pause feature X")
2. State the context briefly (what's the situation?)
3. Present 2-3 options with tradeoffs
4. Make your recommendation and explain why
5. Ask for the decision you need

Giving and receiving feedback:
- Feedback should be specific, behavioral, and timely
- Use "I noticed..." and "I think..." to make it less threatening
- Ask for feedback proactively — "What's one thing I could do better?"
- Separate criticism from personal judgement — it's about the work, not the person`,
  },
  {
    chapterRef: 'ownership-mindset',
    content: `Ownership Mentality: Thinking Like an Owner

The best PMs think and act like owners of their product and business, not like feature delivery managers.

What ownership looks like:
- You care about the outcome, not just the output ("Did it help users?" not "Did we ship it?")
- You proactively surface problems, not wait to be asked
- You feel personal accountability when the product fails
- You invest in understanding the business model, not just the UX
- You think about the product 5 years from now, not just next sprint

Anti-patterns of low ownership:
- "That's not my job" — owners find a way or delegate, but don't abandon problems
- Waiting for permission — owners move forward with judgment, then communicate
- Blaming others — owners focus on what they can control
- Executing without questioning — owners ask "should we build this?" not just "how do we build this?"
- Shipping and forgetting — owners track outcomes after launch

The CEO analogy:
The PM is often called the "CEO of the product." A CEO is responsible for:
- The product vision and strategy
- Allocating resources (engineering time, budget)
- Team performance and culture
- Customer outcomes
- Business results

While PMs don't control headcount or budgets the way a CEO does, they carry the same intellectual and emotional responsibility for their product's success. Own it completely.`,
  },

  // ─── CAREER ──────────────────────────────────────────────────────────────
  {
    chapterRef: 'pm-career-ladder',
    content: `The PM Career Ladder: APM → PM → Senior PM → Staff/Principal → Director → VP

Associate Product Manager (APM)
- Entry level, usually from new grad rotational programs (Google, Meta, LinkedIn, Uber)
- Works under close mentorship
- Owns a specific feature or small product area
- Focus: learning the basics, building credibility, shipping first products

Product Manager (PM)
- Owns a product area end-to-end
- Sets roadmap with manager guidance
- Runs discovery, defines specs, drives execution
- Responsible for metrics for their product area

Senior Product Manager
- Independent contributor — minimal supervision needed
- Makes significant strategic decisions
- Influences cross-team direction
- Mentors junior PMs informally
- Drives multi-quarter initiatives

Staff / Principal PM
- Leads product strategy for a large product area
- Influences company-level strategy
- Mentors multiple PMs formally
- Drives organizational PM standards and processes

Director of Product / Group PM
- Manages a team of PMs (typically 3-8)
- Sets strategy for a product line
- Interfaces with VP-level leadership
- Responsible for PM hiring, development, and performance

VP of Product
- Company-wide product strategy
- Manages directors
- Represents product at the executive table
- Owns the overall product roadmap and vision

How promotions work in PM:
Promotions aren't about time in role. You get promoted by demonstrating you can consistently perform at the next level. This means: greater scope, greater autonomy, and greater impact — before you have the title.`,
  },
  {
    chapterRef: 'breaking-into-pm',
    content: `How to Break Into Product Management

PM is one of the hardest roles to break into because most companies prefer to hire PMs with PM experience — a classic chicken-and-egg problem.

The most common paths into PM:
1. APM programs (best for new grads) — Google APM, Meta RPM, LinkedIn PM Fellows, Microsoft PM Rotation, Uber APM. Highly competitive (1-3% acceptance), but excellent training.

2. Internal transfer — The easiest path. Excel in your current role (engineering, design, data science, marketing), then advocate for a PM opportunity internally. Companies prefer known quantities.

3. MBA → PM — Many top companies hire MBAs into associate PM roles. Only worth it if you target the right companies and use business school to build connections.

4. Startup PM — Small startups take more chances on inexperienced candidates. You'll get broad exposure but less mentorship. Use this as a launch pad to bigger companies.

5. Side projects and portfolio — Build something. Launch a product (even a small app), write a product teardown, run a product critique. Shows you can think like a PM.

How to prepare for PM interviews:
- Practice product design questions ("Design an app for X")
- Practice metrics questions ("How would you measure success for Y?")
- Practice behavioral questions with STAR method (Situation, Task, Action, Result)
- Prepare 3-5 strong behavioral stories covering leadership, conflict, failure, success
- Do product teardowns of apps you use daily
- Study the company you're interviewing at: understand their strategy, products, metrics, and recent launches
- Practice out loud with a partner — talking through your thinking is very different from writing it`,
  },
  {
    chapterRef: 'pm-interview-prep',
    content: `PM Interview Preparation: Complete Framework

PM interviews test 4 areas. Prepare all four.

1. PRODUCT DESIGN QUESTIONS ("Design a product for X")
Framework: CIRCLES method
- C: Comprehend the situation (clarify goals and constraints)
- I: Identify the customer (who specifically are we designing for?)
- R: Report customer needs (what jobs do they need to get done?)
- C: Cut through prioritization (pick one user segment and one use case to focus on)
- L: List solutions (brainstorm at least 3 different approaches)
- E: Evaluate tradeoffs (compare solutions on impact, effort, risk)
- S: Summarize recommendation (pick one and explain why)

2. METRICS QUESTIONS ("How would you measure success for Google Maps?")
Framework:
- Define the goal of the product
- Identify the primary success metric (North Star)
- List 3-5 supporting metrics across the funnel (acquisition, activation, retention, revenue)
- Identify guard rail metrics (what you want to make sure doesn't break)
- State what would concern you if you saw it in the data

3. ESTIMATION QUESTIONS ("How many Uber rides happen in NYC per day?")
Framework:
- Clarify: What exactly are we estimating?
- Structure: Break it into components (population → relevant users → frequency → etc.)
- Estimate each component with round numbers
- Calculate and sanity check against intuition
- Acknowledge uncertainty and key assumptions

4. BEHAVIORAL QUESTIONS ("Tell me about a time you had to influence without authority")
Use STAR method:
- Situation: Set the scene (1-2 sentences)
- Task: What was your responsibility?
- Action: What did YOU specifically do? (Use "I", not "we")
- Result: What happened? Include a metric if possible.

Prepare 5-6 STAR stories that can flex across different behavioral themes: leadership, conflict, failure/learning, data-driven decision, ambiguity, cross-functional work.`,
  },

  // ─── TECHNICAL SKILLS ────────────────────────────────────────────────────
  {
    chapterRef: 'technical-skills-pm',
    content: `Technical Skills for PMs: What You Need to Know

You don't need to code, but you need enough technical depth to:
- Have credible conversations with engineers
- Identify technically risky assumptions before they become expensive
- Understand tradeoffs between different technical approaches
- Write clearer specs (with proper edge cases and API thinking)

Key technical concepts every PM should understand:

APIs (Application Programming Interfaces):
- APIs let software systems talk to each other
- REST APIs are the most common type in web products
- When a feature depends on a third-party API (e.g., Stripe for payments, Twilio for SMS), the PM should understand the API's capabilities, rate limits, and pricing implications

Databases and SQL basics:
- Data is stored in tables (rows and columns)
- SQL lets you query data: SELECT, FROM, WHERE, GROUP BY, JOIN
- PMs who can pull their own data move 10x faster
- Learn just enough SQL to answer your own questions without waiting for a data analyst

System performance basics:
- Latency: how long a request takes (users abandon pages that take >3 seconds)
- Throughput: how many requests a system can handle per second
- Caching: storing frequently accessed data to serve it faster
- CDNs: distributing content closer to users globally

Web and mobile basics:
- Frontend: what users see (HTML, CSS, JavaScript in browsers; Swift/Kotlin on mobile)
- Backend: servers and databases that process requests
- Mobile releases: iOS App Store / Google Play review processes take 1-3 days

Security and privacy basics:
- HTTPS encrypts data in transit
- Authentication: who are you? Authorization: what can you do?
- GDPR/CCPA: users have rights over their personal data — build privacy-first
- Don't log or store sensitive data (passwords, credit cards) in plain text`,
  },

  // ─── WORKING WITH DIFFERENT TEAMS ────────────────────────────────────────
  {
    chapterRef: 'cross-functional-work',
    content: `Working Across Functions: Engineering, Design, Data, Marketing, Sales

Product success depends on excellent cross-functional relationships. Each function has different goals and languages. Great PMs learn to speak all of them.

Working with Engineers:
- Respect their time: don't interrupt coding sprints with ad-hoc requests
- Write clear specs: ambiguity creates rework
- Ask "is this technically feasible?" early — don't design something unbuildable
- Involve them in discovery: engineers find creative solutions when they understand the problem
- Don't dictate the solution — tell them the problem and let them propose how to solve it
- Celebrate their launches and give them credit publicly

Working with Designers:
- Share user research early and let designers help interpret it
- Don't come with a fully-formed solution — bring the problem
- Give design critique based on user needs, not personal taste ("I'm not sure users will understand this hierarchy" vs "I don't like this")
- Protect design time in the schedule — rushed design = poor product

Working with Data Scientists/Analysts:
- Form your hypothesis before asking for data (avoid p-hacking)
- Learn SQL so you can answer your own quick questions
- Involve analysts in experiment design, not just analysis
- Communicate what decision the data needs to inform

Working with Marketing:
- Include marketing in product discovery — they know what messages resonate
- Give them enough lead time for launch preparation (4-6+ weeks for big launches)
- Share product data that helps them target the right users

Working with Sales:
- Listen to sales feedback on user pain points — they hear objections daily
- Be clear about what's in the roadmap vs. what's being considered
- Avoid making commitments to customers that engineering hasn't agreed to`,
  },

  // ─── BEHAVIORAL INTERVIEW STORIES ────────────────────────────────────────
  {
    chapterRef: 'behavioral-stories',
    content: `Behavioral Interview Stories: How to Prepare and Tell Them

Behavioral questions explore how you've acted in real situations. Interviewers use the past to predict the future: "Did this person make good decisions under pressure? Do they learn from failure? Can they influence?"

The STAR Method:
- Situation: Set the context (1-2 sentences, don't over-explain)
- Task: What was your specific responsibility in this situation?
- Action: What did YOU do? Be specific. Use "I" not "we." This is the most important part.
- Result: What happened? Quantify if possible. What did you learn?

Common behavioral themes and example questions:

LEADERSHIP:
"Tell me about a time you led a team through a difficult project."
"Give me an example of when you set a vision and got others to follow."

INFLUENCE WITHOUT AUTHORITY:
"Tell me about a time you had to persuade someone without formal authority."
"Describe a situation where you had to convince a skeptical stakeholder."

DEALING WITH FAILURE:
"Tell me about a product that failed. What did you learn?"
"Describe a time you made a wrong call. How did you recover?"

DATA-DRIVEN DECISION MAKING:
"Give me an example of a decision you made based on data."
"Tell me about a time when the data surprised you and changed your direction."

HANDLING AMBIGUITY:
"Tell me about a time you had to make a decision with incomplete information."
"Describe a situation where the requirements kept changing."

CROSS-FUNCTIONAL COLLABORATION:
"Tell me about a time you had to work with a difficult colleague."
"Describe a situation where you had to align multiple teams with different priorities."

Prepare 5-6 detailed STAR stories. Each story should be adaptable to multiple questions. Practice telling each in under 2 minutes.`,
  },

  // ─── PRODUCT SENSE ───────────────────────────────────────────────────────
  {
    chapterRef: 'product-sense',
    content: `Developing Product Sense: How to Think Like a Great PM

Product sense is the ability to quickly understand what makes a product good, identify problems, and generate creative solutions. It's learned, not innate.

How to build product sense:
1. Use products critically — when you use any app, ask: "What problem does this solve? Who is it for? What would I change?"
2. Read product teardowns — Medium, LinkedIn, Substack are full of PM analyses of products
3. Follow product leaders — follow PMs at top companies on Twitter/LinkedIn
4. Do product critiques weekly — pick one product, write 500 words on what's great and what's broken
5. Understand business models — great products must also make money. How does this product generate revenue?

The product sense interview framework:
When asked "How would you improve [product]?":
1. Clarify the goal ("Are we optimizing for growth, retention, or revenue?")
2. Identify the user segments ("Who are the key users?")
3. Map the user journey ("What does a typical session look like?")
4. Identify the biggest pain points or opportunities
5. Generate 3+ creative solutions
6. Evaluate each on impact, feasibility, and alignment with goal
7. Recommend one and explain why

What separates great product sense from average:
- User empathy: you can articulate what users actually feel, not just what they do
- Business acumen: you understand how the product makes money and why that matters
- Technical feasibility: you know what's easy vs. hard to build
- Creative breadth: you generate surprising solutions, not just obvious ones
- Structured thinking: you're systematic, not random`,
  },

  // ─── ESTIMATION ──────────────────────────────────────────────────────────
  {
    chapterRef: 'estimation-questions',
    content: `Estimation Questions: Market Sizing and Fermi Problems

Estimation questions test structured thinking, not math skills. Interviewers want to see you break a problem into components logically, make reasonable assumptions, and sanity-check your answer.

Common types:
- Market sizing: "What's the market size for ride-sharing in the US?"
- Usage estimation: "How many Google searches happen per day?"
- Revenue estimation: "What's Spotify's annual revenue from premium subscriptions?"

The framework:
1. Clarify — what exactly are we estimating? What counts?
2. Identify the approach — top-down (total population → filter down) or bottom-up (unit × frequency)
3. Break it into components — each component should be easy to estimate independently
4. Estimate each component with round numbers — be explicit about assumptions
5. Calculate and get to the answer
6. Sanity check — does this make intuitive sense?

Example: How many Uber rides happen in NYC per day?
- NYC population: ~8 million people
- Adults who might use Uber: ~60% = 4.8M people
- Uber users among them: ~25% use it at least monthly = 1.2M regular users
- Average usage: 1 ride every 3 days on average for active users = ~400K rides/day
- Factor in non-regular/one-time users: add 20% = ~480K rides/day
- Sanity check: NYC has about 80K yellow cabs doing ~500K rides/day. Uber being slightly below yellow cab volume feels about right.
- Answer: ~500K rides per day

Key estimation tips:
- Round to nice numbers (4.8M becomes 5M)
- State your assumptions out loud as you make them
- Show your structure first, then calculate
- Don't try to be precise — be reasonable and systematic
- If you're wildly off, explain why you think it might be higher or lower`,
  },
]

async function main() {
  const prisma = createPrisma()
  const openai = getOpenAI()

  console.log(`Seeding ${FOUNDATIONS_CHUNKS.length} PM Foundations chunks...`)

  // Clear existing
  await prisma.$executeRaw`DELETE FROM "KnowledgeChunk" WHERE source = ${SOURCE}`
  console.log('  Cleared existing pm-foundations chunks')

  const BATCH_SIZE = 20

  for (let i = 0; i < FOUNDATIONS_CHUNKS.length; i += BATCH_SIZE) {
    const batch = FOUNDATIONS_CHUNKS.slice(i, i + BATCH_SIZE)
    const texts = batch.map((c) => c.content)

    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
    })

    for (let j = 0; j < batch.length; j++) {
      const { chapterRef, content } = batch[j]
      const embeddingStr = `[${response.data[j].embedding.join(',')}]`

      await prisma.$executeRaw`
        INSERT INTO "KnowledgeChunk" (id, source, "chapterRef", content, embedding, "createdAt")
        VALUES (
          gen_random_uuid()::text,
          ${SOURCE},
          ${chapterRef},
          ${content},
          ${embeddingStr}::vector,
          NOW()
        )
      `
    }

    console.log(`  Embedded ${Math.min(i + BATCH_SIZE, FOUNDATIONS_CHUNKS.length)}/${FOUNDATIONS_CHUNKS.length} chunks`)
    if (i + BATCH_SIZE < FOUNDATIONS_CHUNKS.length) await new Promise((r) => setTimeout(r, 200))
  }

  const count = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM "KnowledgeChunk" WHERE source = ${SOURCE}
  `
  console.log(`\nDone. Total pm-foundations chunks: ${count[0].count}`)
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
