# Learn Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fully-functional `/learn` section to PrepAI with 3 learning paths, AI-synthesized lesson content, a RAG-powered AI tutor, progress tracking, and deep integration with existing features.

**Architecture:** Hybrid structured + RAG. Prisma models store the curriculum and generated lesson content. pgvector + OpenAI embeddings power the AI tutor's semantic search. Lesson content is generated once by a seed script and cached in the DB, so no generation happens at page-load time. Streaming uses the existing `streamClaude` pattern from `src/lib/ai.ts`.

**Tech Stack:** Next.js 16 (App Router), Prisma 7 + PostgreSQL + pgvector, OpenAI SDK (`text-embedding-3-small`), Anthropic Claude SDK (streaming), Tailwind CSS, shadcn/ui, Recharts, Zustand

---

## Critical Patterns (read before writing any code)

- **Auth**: `const session = await getServerSession(authOptions)` → `(session.user as { id?: string }).id!`
- **Dynamic params**: `{ params }: { params: Promise<{ slug: string }> }` → must `await params`
- **Prisma import**: `import { prisma } from '@/lib/prisma'`
- **Streaming SSE**: `data: ${JSON.stringify({ text })}\n\n` then `data: [DONE]\n\n`
- **pgvector raw query**: `prisma.$queryRaw` with template literal
- **No tests exist** — verification = TypeScript compilation (`npx tsc --noEmit`) + `npm run build`

---

## Part 1 — Foundation

### Task 1: Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add pgvector extension + new models to schema**

Open `prisma/schema.prisma`. Add the following changes:

**1a. Add `previewFeatures` and `extensions` to the generator and datasource blocks (replace the existing top section):**

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  extensions = [pgvector(map: "vector")]
}
```

**1b. Add these two relations to the existing `User` model** (add after `savedJobs` relation line):

```prisma
  lessonProgress    UserLessonProgress[]
  pathEnrollments   UserPathEnrollment[]
```

**1c. Add this new `ActivityType` enum value** to the existing `ActivityType` enum (add `LESSON_COMPLETE` after `PANIC_MODE_REVIEW`):

```prisma
  LESSON_COMPLETE
```

**1d. Append the following new models to the end of the schema file:**

```prisma
// ==================== LEARN MODULE ====================

model KnowledgeChunk {
  id         String                      @id @default(cuid())
  source     String                      // "product-book" | "kellogg" | "frameworks"
  chapterRef String                      // e.g., "ch3", "module-4"
  content    String
  embedding  Unsupported("vector(1536)")
  createdAt  DateTime                    @default(now())
}

model LearningPath {
  id          String               @id @default(cuid())
  slug        String               @unique
  title       String
  description String
  icon        String
  order       Int
  modules     LearningModule[]
  enrollments UserPathEnrollment[]
}

model LearningModule {
  id               String           @id @default(cuid())
  pathId           String
  path             LearningPath     @relation(fields: [pathId], references: [id])
  slug             String
  title            String
  description      String
  weekNumber       Int?
  estimatedMinutes Int
  order            Int
  lessons          LearningLesson[]

  @@unique([pathId, slug])
}

model LearningLesson {
  id                String               @id @default(cuid())
  moduleId          String
  module            LearningModule       @relation(fields: [moduleId], references: [id])
  slug              String
  title             String
  content           String               @default("")
  keyTakeaways      String[]
  practiceQuestions String[]
  interviewTip      String?
  sourceRefs        String[]
  estimatedMinutes  Int
  order             Int
  progress          UserLessonProgress[]

  @@unique([moduleId, slug])
}

model UserLessonProgress {
  id          String         @id @default(cuid())
  userId      String
  user        User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  lessonId    String
  lesson      LearningLesson @relation(fields: [lessonId], references: [id])
  completedAt DateTime?
  quizScore   Float?
  timeSpentMs Int            @default(0)

  @@unique([userId, lessonId])
}

model UserPathEnrollment {
  id          String       @id @default(cuid())
  userId      String
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  pathId      String
  path        LearningPath @relation(fields: [pathId], references: [id])
  startedAt   DateTime     @default(now())
  completedAt DateTime?
  currentWeek Int          @default(1)

  @@unique([userId, pathId])
}
```

- [ ] **Step 2: Verify schema is valid**

```bash
npx prisma validate
```

Expected: `The schema at prisma/schema.prisma is valid`

---

### Task 2: Run Migration

**Files:**
- Creates: `prisma/migrations/*/migration.sql` (auto-generated)

- [ ] **Step 1: Run migration**

```bash
npx prisma migrate dev --name add-learn-module
```

Expected output ends with: `Your database is now in sync with your schema.`

The migration will automatically enable the `pgvector` extension via SQL (`CREATE EXTENSION IF NOT EXISTS vector`).

- [ ] **Step 2: Regenerate Prisma client**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add learn module prisma schema with pgvector"
```

---

### Task 3: Types

**Files:**
- Create: `src/types/learn.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Create `src/types/learn.ts`**

```typescript
// ==================== LEARN MODULE TYPES ====================

export type LearnSkillArea = 'strategy' | 'execution' | 'metrics' | 'behavioral' | 'ai-pm'

export interface LearningPath {
  id: string
  slug: string
  title: string
  description: string
  icon: string
  order: number
  modules: LearningModule[]
}

export interface LearningModule {
  id: string
  pathId: string
  slug: string
  title: string
  description: string
  weekNumber: number | null
  estimatedMinutes: number
  order: number
  lessons: LearningLesson[]
}

export interface LearningLesson {
  id: string
  moduleId: string
  slug: string
  title: string
  content: string
  keyTakeaways: string[]
  practiceQuestions: string[]
  interviewTip: string | null
  sourceRefs: string[]
  estimatedMinutes: number
  order: number
}

export interface UserLessonProgress {
  id: string
  userId: string
  lessonId: string
  completedAt: Date | null
  quizScore: number | null
  timeSpentMs: number
}

export interface UserPathEnrollment {
  id: string
  userId: string
  pathId: string
  startedAt: Date
  completedAt: Date | null
  currentWeek: number
}

export interface LessonWithProgress extends LearningLesson {
  progress: UserLessonProgress | null
}

export interface ModuleWithProgress extends LearningModule {
  lessons: LessonWithProgress[]
  completedCount: number
  totalCount: number
}

export interface PathWithProgress extends LearningPath {
  modules: ModuleWithProgress[]
  enrollment: UserPathEnrollment | null
  completedLessons: number
  totalLessons: number
  progressPercent: number
}

export interface TutorMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface DiagnosticQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  skillArea: LearnSkillArea
  explanation: string
}

export interface DiagnosticResult {
  weakAreas: LearnSkillArea[]
  scores: Record<LearnSkillArea, number>
  recommendedPath: string
}

export interface ReadinessCertification {
  score: number
  lessonScore: number
  quizScore: number
  mockScore: number
  weakAreas: LearnSkillArea[]
  strongAreas: LearnSkillArea[]
}

export interface KnowledgeChunk {
  id: string
  source: string
  chapterRef: string
  content: string
}
```

- [ ] **Step 2: Re-export from `src/types/index.ts`**

Add this line at the very end of `src/types/index.ts`:

```typescript
export * from './learn'
```

- [ ] **Step 3: Verify types compile**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/types/learn.ts src/types/index.ts
git commit -m "feat: add learn module TypeScript types"
```

---

### Task 4: Learn Data

**Files:**
- Create: `src/lib/learn-data.ts`

This file defines the static curriculum structure for all 3 paths. Lesson `content` starts empty — it gets filled by the seed script or on-demand generation.

- [ ] **Step 1: Create `src/lib/learn-data.ts`**

```typescript
// Static curriculum structure for all 3 learning paths.
// Lesson content (the `content` field) is empty here — it is generated
// by scripts/generate-lesson-content.ts and stored in the DB.

export interface StaticLesson {
  slug: string
  title: string
  keyTakeaways: string[]
  practiceQuestions: string[]
  interviewTip: string | null
  sourceRefs: string[]
  estimatedMinutes: number
  order: number
}

export interface StaticModule {
  slug: string
  title: string
  description: string
  weekNumber: number | null
  estimatedMinutes: number
  order: number
  lessons: StaticLesson[]
}

export interface StaticPath {
  slug: string
  title: string
  description: string
  icon: string
  order: number
  modules: StaticModule[]
}

export const LEARN_PATHS: StaticPath[] = [
  // ─── PATH 1: PM PLAYBOOK (0→1) ───────────────────────────────────────────
  {
    slug: 'playbook',
    title: 'PM Playbook: 0→1',
    description: 'An 8-week structured roadmap from zero to interview-ready. Build PM intuition from the ground up.',
    icon: 'BookMarked',
    order: 1,
    modules: [
      {
        slug: 'week-1-what-is-pm',
        title: 'Week 1 — What Is PM?',
        description: 'Understand the PM role, responsibilities, and what a day-in-the-life looks like.',
        weekNumber: 1,
        estimatedMinutes: 60,
        order: 1,
        lessons: [
          {
            slug: 'pm-role-defined',
            title: 'The PM Role Defined',
            keyTakeaways: [
              'PMs own the product vision but have no direct authority — they lead through influence',
              'The three pillars: customer empathy, business acumen, technical literacy',
              'PMs are the "CEO of the product" — accountable for outcomes, not just outputs',
            ],
            practiceQuestions: [
              'How would you explain the PM role to someone who has never heard of it?',
              'What is the difference between a PM and a project manager?',
            ],
            interviewTip: 'When asked "Why PM?", ground your answer in customer impact + cross-functional work, not "I want to be strategic".',
            sourceRefs: ['product-book-ch1', 'kellogg-module-1'],
            estimatedMinutes: 12,
            order: 1,
          },
          {
            slug: 'pm-vs-other-roles',
            title: 'PM vs. Other Roles',
            keyTakeaways: [
              'PM vs. Engineering: PM defines the "what & why", Eng defines the "how"',
              'PM vs. Design: PM owns the problem space, Design owns the solution space',
              'PM vs. Marketing: PM builds it, Marketing tells the story',
            ],
            practiceQuestions: [
              'Tell me about a time you had to work with a difficult engineer. How did you get alignment?',
              'How do you decide when to push back on a designer\'s proposal?',
            ],
            interviewTip: 'Interviewers test whether you understand you don\'t own resources — you own outcomes.',
            sourceRefs: ['product-book-ch1', 'kellogg-module-1'],
            estimatedMinutes: 10,
            order: 2,
          },
          {
            slug: 'pm-day-in-the-life',
            title: 'A Day in the Life',
            keyTakeaways: [
              'Typical PM week: ~30% meetings, 20% async writing, 20% research, 30% 1:1s and reviews',
              'Key artifacts: PRD, roadmap, metrics dashboard, OKRs',
              'The hidden skill: saying no clearly and with data',
            ],
            practiceQuestions: [
              'How do you manage competing priorities across multiple stakeholders?',
              'Describe your typical planning process for a new feature.',
            ],
            interviewTip: 'Mention specific artifacts you\'ve owned (PRDs, roadmaps, OKRs) — abstract answers lose points.',
            sourceRefs: ['product-book-ch1'],
            estimatedMinutes: 10,
            order: 3,
          },
        ],
      },
      {
        slug: 'week-2-markets-users-strategy',
        title: 'Week 2 — Markets, Users & Strategy',
        description: 'Learn how great PMs understand their competitive landscape and user needs.',
        weekNumber: 2,
        estimatedMinutes: 65,
        order: 2,
        lessons: [
          {
            slug: 'market-sizing',
            title: 'Market Sizing & TAM/SAM/SOM',
            keyTakeaways: [
              'TAM = total addressable market, SAM = serviceable, SOM = obtainable',
              'Top-down: start from macro data; Bottom-up: start from unit economics',
              'Interviewers care about your reasoning process, not the exact number',
            ],
            practiceQuestions: [
              'Estimate the market size for a B2B project management tool in the US.',
              'What is the TAM for electric scooter rentals in San Francisco?',
            ],
            interviewTip: 'Always state your assumptions upfront, structure as top-down + sanity check bottom-up.',
            sourceRefs: ['product-book-ch2', 'kellogg-module-2'],
            estimatedMinutes: 15,
            order: 1,
          },
          {
            slug: 'user-segmentation',
            title: 'User Segmentation & Personas',
            keyTakeaways: [
              'Segment by behavior, not just demographics — "power users" vs "casual users" is more useful than "18-34 year olds"',
              'A good persona has: jobs-to-be-done, pain points, current solutions, success criteria',
              'Never assume your users are you',
            ],
            practiceQuestions: [
              'Design a product for elderly users — how would you start?',
              'Your DAU/MAU ratio is dropping. Walk me through how you investigate.',
            ],
            interviewTip: 'In product sense questions, always define your user before proposing solutions — it signals maturity.',
            sourceRefs: ['product-book-ch2', 'kellogg-module-2'],
            estimatedMinutes: 12,
            order: 2,
          },
          {
            slug: 'competitive-analysis',
            title: 'Competitive Analysis',
            keyTakeaways: [
              'Competitive moats: network effects, switching costs, brand, economies of scale, data',
              'Porter\'s 5 Forces: buyer/supplier power, substitutes, new entrants, competitive rivalry',
              'Your differentiation should map to an unserved or underserved user need',
            ],
            practiceQuestions: [
              'How would you differentiate a new note-taking app in a crowded market?',
              'Should Spotify add a social feed feature? Who are its main competitors in that space?',
            ],
            interviewTip: 'When asked about strategy, frame differentiation in terms of user needs — not features.',
            sourceRefs: ['product-book-ch2', 'kellogg-module-2'],
            estimatedMinutes: 14,
            order: 3,
          },
        ],
      },
      {
        slug: 'week-3-opportunity-framing',
        title: 'Week 3 — Opportunity Assessment & Framing',
        description: 'Master how to evaluate product opportunities before building anything.',
        weekNumber: 3,
        estimatedMinutes: 60,
        order: 3,
        lessons: [
          {
            slug: 'opportunity-hypothesis',
            title: 'Creating an Opportunity Hypothesis',
            keyTakeaways: [
              'An opportunity hypothesis is: "We believe [user type] struggles with [problem] because [root cause]. Solving it will [business outcome]."',
              'Validate the problem before validating the solution',
              'Common trap: falling in love with solutions before validating the problem',
            ],
            practiceQuestions: [
              'How would you frame the opportunity for a new enterprise Slack competitor?',
              'Identify a product opportunity for senior citizens in the health tech space.',
            ],
            interviewTip: 'Structure product sense answers with an explicit hypothesis before jumping to solutions.',
            sourceRefs: ['product-book-ch3', 'kellogg-module-2'],
            estimatedMinutes: 12,
            order: 1,
          },
          {
            slug: 'jobs-to-be-done',
            title: 'Jobs-to-be-Done Framework',
            keyTakeaways: [
              'JTBD: people "hire" products to do a job — functional, emotional, or social',
              '"When I [situation], I want to [motivation], so I can [outcome]"',
              'Milkshake example: McDonald\'s found morning commuters hired milkshakes as entertainment, not food',
            ],
            practiceQuestions: [
              'What job does Spotify hire itself to do for a 30-year-old on their commute?',
              'Apply JTBD to redesign the onboarding of a productivity app.',
            ],
            interviewTip: 'Mentioning JTBD by name in a product sense answer signals depth — but only if you can apply it.',
            sourceRefs: ['product-book-ch3', 'kellogg-module-3'],
            estimatedMinutes: 14,
            order: 2,
          },
          {
            slug: 'prioritization-frameworks',
            title: 'Prioritization: RICE, MoSCoW & ICE',
            keyTakeaways: [
              'RICE: (Reach × Impact × Confidence) / Effort — good for large backlogs',
              'MoSCoW: Must Have / Should Have / Could Have / Won\'t Have — good for stakeholder alignment',
              'ICE: Impact × Confidence × Ease — fast and opinionated',
            ],
            practiceQuestions: [
              'You have 5 features to ship in Q1 and capacity for 2. Walk me through your decision.',
              'How do you handle a stakeholder who always argues their feature is a "Must Have"?',
            ],
            interviewTip: 'Always name the framework and justify your scoring — vague prioritization answers fail execution rounds.',
            sourceRefs: ['product-book-ch5', 'kellogg-module-4'],
            estimatedMinutes: 14,
            order: 3,
          },
        ],
      },
      {
        slug: 'week-4-user-research',
        title: 'Week 4 — User Research & Validation',
        description: 'Learn how to validate hypotheses with real users before committing to build.',
        weekNumber: 4,
        estimatedMinutes: 65,
        order: 4,
        lessons: [
          {
            slug: 'user-interviews',
            title: 'User Interviews That Actually Work',
            keyTakeaways: [
              'Ask about past behavior, not hypothetical future behavior: "Tell me about the last time you..." not "Would you use..."',
              'The Mom Test: ask questions even your mom can\'t lie about',
              'Five Whys: keep asking why to uncover root causes',
            ],
            practiceQuestions: [
              'How would you validate whether users want a dark mode feature?',
              'Design a user research plan for a new expense tracking app.',
            ],
            interviewTip: 'In execution questions, mention how you\'d validate before building — it differentiates senior PMs.',
            sourceRefs: ['product-book-ch4', 'kellogg-module-3'],
            estimatedMinutes: 15,
            order: 1,
          },
          {
            slug: 'ab-testing-basics',
            title: 'A/B Testing & Experimentation',
            keyTakeaways: [
              'A/B test: one variable at a time, random assignment, statistical significance (p < 0.05)',
              'Sample size: the smaller the expected effect, the larger the sample needed',
              'Common mistake: stopping tests early when you see positive results (peeking problem)',
            ],
            practiceQuestions: [
              'You ran an A/B test and saw a 3% increase in CTR but not statistical significance. What do you do?',
              'How would you set up an experiment to test a new checkout flow?',
            ],
            interviewTip: 'Know the difference between correlation and causation — interviewers will probe this in metrics questions.',
            sourceRefs: ['product-book-ch4', 'kellogg-module-3'],
            estimatedMinutes: 14,
            order: 2,
          },
          {
            slug: 'prototype-and-mvp',
            title: 'Prototyping & MVP Thinking',
            keyTakeaways: [
              'MVP = Minimum Viable Product — smallest thing you can build to learn the most',
              'Types: Wizard of Oz (fake the backend), Concierge (manual service), Landing Page, Prototype',
              'Lean Startup cycle: Build → Measure → Learn → repeat',
            ],
            practiceQuestions: [
              'How would you build an MVP for a two-sided marketplace in 2 weeks?',
              'Dropbox validated before building anything — what technique did they use and why?',
            ],
            interviewTip: 'Use "MVP" deliberately: always say what you\'re testing, not just what you\'re cutting.',
            sourceRefs: ['product-book-ch4', 'kellogg-module-3'],
            estimatedMinutes: 12,
            order: 3,
          },
        ],
      },
      {
        slug: 'week-5-roadmap-execution',
        title: 'Week 5 — Roadmapping & Execution',
        description: 'Build and defend a roadmap; understand how PMs drive delivery.',
        weekNumber: 5,
        estimatedMinutes: 60,
        order: 5,
        lessons: [
          {
            slug: 'roadmap-types',
            title: 'Roadmap Types & How to Build One',
            keyTakeaways: [
              'Timeline roadmap vs. Outcome roadmap vs. Now-Next-Later — choose based on audience',
              'Outcomes-based roadmaps align stakeholders on goals, not just features',
              'Quarterly OKRs: Objectives (directional) + Key Results (measurable)',
            ],
            practiceQuestions: [
              'Walk me through how you would build a Q3 roadmap for a growth-stage B2C app.',
              'Your CEO wants 10 features in Q1. You can ship 3. What do you do?',
            ],
            interviewTip: 'In roadmap questions, lead with strategy (why this now?) before listing features.',
            sourceRefs: ['product-book-ch5', 'kellogg-module-4'],
            estimatedMinutes: 14,
            order: 1,
          },
          {
            slug: 'agile-and-scrum',
            title: 'Agile, Scrum & Sprint Planning',
            keyTakeaways: [
              'Sprint: time-boxed (usually 2 weeks) cycle of plan → build → review → retrospect',
              'PM writes user stories: "As a [user], I want [feature] so that [outcome]"',
              'Velocity: teams measure story points completed per sprint to forecast capacity',
            ],
            practiceQuestions: [
              'An engineer tells you a feature will take 3 sprints. Your launch date is in 2 sprints. What do you do?',
              'How do you write a good user story? Give an example.',
            ],
            interviewTip: 'Show you can scope down without losing the core value — "What\'s the 80% version we can ship?"',
            sourceRefs: ['product-book-ch5', 'kellogg-module-4'],
            estimatedMinutes: 12,
            order: 2,
          },
          {
            slug: 'metrics-north-star',
            title: 'North Star Metric & Metric Trees',
            keyTakeaways: [
              'North Star Metric: the single metric that best captures the core value your product delivers',
              'Metric tree: break North Star into leading indicators you can influence',
              'Examples: Airbnb = nights booked, Facebook = DAU, Spotify = time spent listening',
            ],
            practiceQuestions: [
              'What would be the North Star metric for LinkedIn? Defend your choice.',
              'Design a metrics framework for a new food delivery app launching in one city.',
            ],
            interviewTip: 'A North Star answer without a metric tree is incomplete — always decompose into drivers.',
            sourceRefs: ['product-book-ch9', 'kellogg-module-4'],
            estimatedMinutes: 14,
            order: 3,
          },
        ],
      },
      {
        slug: 'week-6-design-engineering',
        title: 'Week 6 — Design & Engineering Collaboration',
        description: 'Learn to work effectively with design and engineering teams.',
        weekNumber: 6,
        estimatedMinutes: 55,
        order: 6,
        lessons: [
          {
            slug: 'design-thinking',
            title: 'Design Thinking for PMs',
            keyTakeaways: [
              '5 stages: Empathize → Define → Ideate → Prototype → Test',
              'PM role in design: own the problem definition, not the pixel-pushing',
              'Double diamond: diverge (explore) then converge (decide) at both problem and solution stages',
            ],
            practiceQuestions: [
              'How would you redesign the onboarding experience for a meditation app?',
              'A designer proposes a feature you think is wrong. How do you handle it?',
            ],
            interviewTip: 'In product design questions, start with empathy (who is the user?) not wireframes.',
            sourceRefs: ['product-book-ch6', 'kellogg-module-4'],
            estimatedMinutes: 12,
            order: 1,
          },
          {
            slug: 'writing-prds',
            title: 'Writing PRDs That Engineers Love',
            keyTakeaways: [
              'PRD sections: Problem, Why Now, Goals, Non-goals, User Stories, Success Metrics, Open Questions',
              'Non-goals are as important as goals — they prevent scope creep',
              'Engineers don\'t need wireframes — they need clear success criteria',
            ],
            practiceQuestions: [
              'Write a PRD outline for a "share via link" feature for a document editor.',
              'What questions should a PRD always answer?',
            ],
            interviewTip: 'If asked to spec a feature, use PRD structure: problem → goals → non-goals → metrics → stories.',
            sourceRefs: ['product-book-ch6', 'kellogg-module-3'],
            estimatedMinutes: 14,
            order: 2,
          },
          {
            slug: 'technical-pm-basics',
            title: 'Technical Fluency for PMs',
            keyTakeaways: [
              'You don\'t need to code, but you need to estimate effort and spot technical debt',
              'Key concepts to know: APIs, databases, latency, caching, microservices',
              'Tech debt: the long-term cost of short-term shortcuts — PMs must budget for it',
            ],
            practiceQuestions: [
              'An engineer says "that feature will cause performance issues." How do you respond?',
              'Explain at a high level how an API call works.',
            ],
            interviewTip: 'Technical PM interviews will probe your ability to communicate with engineers — use their vocabulary.',
            sourceRefs: ['product-book-ch7', 'kellogg-module-4'],
            estimatedMinutes: 12,
            order: 3,
          },
        ],
      },
      {
        slug: 'week-7-go-to-market',
        title: 'Week 7 — Go-to-Market & Launch',
        description: 'Learn how to bring products to market and drive successful launches.',
        weekNumber: 7,
        estimatedMinutes: 60,
        order: 7,
        lessons: [
          {
            slug: 'gtm-strategy',
            title: 'Go-to-Market Strategy',
            keyTakeaways: [
              'GTM: the plan for how you will reach your target market and deliver your value proposition',
              'Channels: owned (SEO/email), earned (PR/word of mouth), paid (ads)',
              'Launch tiers: Tier 1 (major launch) vs. Tier 2 (feature release) vs. Tier 3 (silent ship)',
            ],
            practiceQuestions: [
              'Design a GTM strategy for launching a new B2B analytics product.',
              'How would you launch a feature to 10% of users before a full rollout?',
            ],
            interviewTip: 'GTM answers should cover: target segment, value prop, channels, success metric, rollback plan.',
            sourceRefs: ['product-book-ch8', 'kellogg-module-6'],
            estimatedMinutes: 15,
            order: 1,
          },
          {
            slug: 'pricing-strategy',
            title: 'Pricing Strategy',
            keyTakeaways: [
              'Three approaches: cost-plus, value-based, competitive',
              'Freemium: free tier creates top of funnel, paid tier converts power users',
              'Price anchoring: show expensive option first to make middle option feel reasonable',
            ],
            practiceQuestions: [
              'How would you price a new SaaS tool for small businesses?',
              'Netflix raised prices and lost subscribers. How should they respond?',
            ],
            interviewTip: 'Pricing questions often disguise strategy questions — always tie price back to perceived value.',
            sourceRefs: ['product-book-ch8', 'kellogg-module-6'],
            estimatedMinutes: 12,
            order: 2,
          },
          {
            slug: 'post-launch-monitoring',
            title: 'Post-Launch Monitoring',
            keyTakeaways: [
              'Launch dashboard: track core metrics for 48h, 7d, 30d post-launch',
              'Guardrail metrics: things you\'re watching to make sure you\'re not breaking',
              'When to roll back: define the rollback threshold before you ship',
            ],
            practiceQuestions: [
              'You launched a feature and engagement is up 10% but support tickets are up 40%. What do you do?',
              'What metrics would you track in the 48 hours after launching a new checkout flow?',
            ],
            interviewTip: 'Always mention guardrail metrics in launch answers — it signals you think about downside risk.',
            sourceRefs: ['product-book-ch8', 'kellogg-module-6'],
            estimatedMinutes: 12,
            order: 3,
          },
        ],
      },
      {
        slug: 'week-8-metrics-scaling',
        title: 'Week 8 — Metrics, Scaling & Advanced Strategy',
        description: 'Bring it all together with advanced metrics thinking and product strategy.',
        weekNumber: 8,
        estimatedMinutes: 70,
        order: 8,
        lessons: [
          {
            slug: 'metrics-deep-dive',
            title: 'Metrics Deep Dive: AARRR & HEART',
            keyTakeaways: [
              'AARRR (Pirate Metrics): Acquisition → Activation → Retention → Revenue → Referral',
              'HEART: Happiness, Engagement, Adoption, Retention, Task Success',
              'Match the framework to the question: AARRR for growth, HEART for UX quality',
            ],
            practiceQuestions: [
              'Your retention is dropping. Walk me through how you diagnose it using a metrics tree.',
              'Design a metrics framework for a new social feature in a productivity app.',
            ],
            interviewTip: 'In metrics questions: name the metric, explain why it matters, explain how you\'d move it.',
            sourceRefs: ['product-book-ch9', 'kellogg-module-8'],
            estimatedMinutes: 16,
            order: 1,
          },
          {
            slug: 'platform-and-ecosystem',
            title: 'Platform Thinking & Ecosystems',
            keyTakeaways: [
              'Platform: creates value by facilitating interactions between two or more user groups',
              'Network effects: direct (more users → more value for all), indirect (more supply → better for demand side)',
              'Cold start problem: how to get a two-sided marketplace going',
            ],
            practiceQuestions: [
              'How would you grow the supply side of a new freelance marketplace in year one?',
              'When does it make sense to open your platform via APIs?',
            ],
            interviewTip: 'Platform questions are strategy questions in disguise — always identify which side drives value.',
            sourceRefs: ['product-book-ch9', 'kellogg-module-7'],
            estimatedMinutes: 14,
            order: 2,
          },
          {
            slug: 'advanced-strategy',
            title: 'Advanced Product Strategy',
            keyTakeaways: [
              'S-curve: products go through introduction → growth → maturity → decline',
              'Blue Ocean Strategy: create uncontested market space rather than compete head-on',
              'Build vs. Buy vs. Partner: framework for make-or-buy decisions',
            ],
            practiceQuestions: [
              'Amazon wants to enter the healthcare space. How would you think about their strategy?',
              'Should Google build a social network again? Why or why not?',
            ],
            interviewTip: 'Strategy questions reward structured thinking. Use a framework (S-curve, 3Cs, Porter) and then apply your own judgment.',
            sourceRefs: ['product-book-ch9', 'kellogg-module-9'],
            estimatedMinutes: 14,
            order: 3,
          },
        ],
      },
    ],
  },

  // ─── PATH 2: INTERVIEW PREP FAST TRACK ──────────────────────────────────
  {
    slug: 'fast-track',
    title: 'Interview Prep Fast Track',
    description: 'Diagnostic quiz → personalized module order. For PMs who know the concepts but need interview-ready execution.',
    icon: 'Zap',
    order: 2,
    modules: [
      {
        slug: 'diagnostic',
        title: 'Diagnostic Quiz',
        description: 'A 10-question quiz that identifies your 2–3 weakest interview skill areas.',
        weekNumber: null,
        estimatedMinutes: 15,
        order: 1,
        lessons: [
          {
            slug: 'take-diagnostic',
            title: 'Take the Diagnostic Quiz',
            keyTakeaways: ['10 questions covering Strategy, Execution, Metrics, Behavioral, and AI-PM'],
            practiceQuestions: [],
            interviewTip: null,
            sourceRefs: [],
            estimatedMinutes: 15,
            order: 1,
          },
        ],
      },
      {
        slug: 'strategy-refresh',
        title: 'Strategy: Concept Refresh',
        description: 'Core strategy frameworks with interview-ready application.',
        weekNumber: null,
        estimatedMinutes: 40,
        order: 2,
        lessons: [
          {
            slug: 'strategy-frameworks',
            title: 'Strategy Frameworks Cheatsheet',
            keyTakeaways: [
              '3Cs: Company, Customer, Competitor',
              'Porter\'s 5 Forces: external competitive analysis',
              'Ansoff Matrix: growth strategy (market penetration, development, product development, diversification)',
            ],
            practiceQuestions: [
              'What strategy would you recommend for a mid-size SaaS company entering a new vertical?',
              'How do you evaluate whether to expand internationally?',
            ],
            interviewTip: 'Name your framework, apply it, then add your own judgment — don\'t just recite the framework.',
            sourceRefs: ['product-book-ch2', 'kellogg-module-9'],
            estimatedMinutes: 12,
            order: 1,
          },
          {
            slug: 'strategy-practice',
            title: 'Strategy Practice Questions',
            keyTakeaways: ['3 strategy questions with model answer structures'],
            practiceQuestions: [
              'Should Uber enter the B2B corporate travel market? Build the case.',
              'How would you approach product strategy for a company whose core market is shrinking?',
              'Design a 3-year product strategy for a neobank trying to compete with Chase.',
            ],
            interviewTip: 'Use the CIRCLES or STAR method to structure your delivery, even for strategy answers.',
            sourceRefs: ['kellogg-module-9'],
            estimatedMinutes: 20,
            order: 2,
          },
        ],
      },
      {
        slug: 'execution-refresh',
        title: 'Execution: Concept Refresh',
        description: 'Prioritization, tradeoffs, and delivery — the core execution PM toolkit.',
        weekNumber: null,
        estimatedMinutes: 40,
        order: 3,
        lessons: [
          {
            slug: 'execution-frameworks',
            title: 'Execution Frameworks Cheatsheet',
            keyTakeaways: [
              'RICE, MoSCoW, ICE — when to use each',
              'Trade-off analysis: impact vs. effort matrix',
              'The "No" framework: how to decline requests with data',
            ],
            practiceQuestions: [
              'You have 3 high-priority bugs, a major feature request from sales, and a compliance deadline. What do you do?',
              'How do you handle scope creep mid-sprint?',
            ],
            interviewTip: 'Execution answers should show you can say no — the ability to deprioritize is a senior PM signal.',
            sourceRefs: ['product-book-ch5', 'kellogg-module-4'],
            estimatedMinutes: 12,
            order: 1,
          },
          {
            slug: 'execution-practice',
            title: 'Execution Practice Questions',
            keyTakeaways: ['3 execution questions with model answer structures'],
            practiceQuestions: [
              'Your team\'s velocity dropped 40% in Q2. Walk me through your investigation.',
              'Engineering says the feature will take 6 months. Marketing needs it in 2. What happens?',
              'How do you decide whether to rebuild a legacy system vs. incrementally refactor?',
            ],
            interviewTip: 'Structure execution answers: Diagnose → Decide → Communicate → Monitor.',
            sourceRefs: ['product-book-ch5'],
            estimatedMinutes: 20,
            order: 2,
          },
        ],
      },
      {
        slug: 'metrics-refresh',
        title: 'Metrics: Concept Refresh',
        description: 'Metrics thinking end-to-end — from defining success to diagnosing drops.',
        weekNumber: null,
        estimatedMinutes: 40,
        order: 4,
        lessons: [
          {
            slug: 'metrics-frameworks',
            title: 'Metrics Frameworks Cheatsheet',
            keyTakeaways: [
              'AARRR funnel, HEART, NSM + metric tree',
              'Cohort analysis: retention curves, LTV',
              'Metric drop investigation: external vs. internal, segment breakdown',
            ],
            practiceQuestions: [
              'Daily active users dropped 15% last Tuesday. Walk me through how you investigate.',
              'Pick a metric for a new social feature and defend your choice.',
            ],
            interviewTip: 'Metric drop questions are the most common execution interviews — practice a structured 5-step framework.',
            sourceRefs: ['product-book-ch9', 'kellogg-module-8'],
            estimatedMinutes: 12,
            order: 1,
          },
          {
            slug: 'metrics-practice',
            title: 'Metrics Practice Questions',
            keyTakeaways: ['3 metrics questions with model answer structures'],
            practiceQuestions: [
              'Instagram Reels engagement is up but overall time-on-app is down. Is that good or bad?',
              'Design a success metric for a new friend recommendation algorithm.',
              'Your NPS dropped from 42 to 31 in one quarter. What do you do?',
            ],
            interviewTip: 'Always check whether a metric improvement is real or a measurement artifact before celebrating.',
            sourceRefs: ['kellogg-module-8'],
            estimatedMinutes: 20,
            order: 2,
          },
        ],
      },
      {
        slug: 'behavioral-refresh',
        title: 'Behavioral: Concept Refresh',
        description: 'STAR storytelling, leadership signals, and the most common behavioral question patterns.',
        weekNumber: null,
        estimatedMinutes: 35,
        order: 5,
        lessons: [
          {
            slug: 'star-method',
            title: 'STAR Method Mastery',
            keyTakeaways: [
              'STAR: Situation → Task → Action → Result (always quantify the Result)',
              'The Action section should be 60% of your answer',
              'Use "I" not "we" — interviewers want to know what YOU did',
            ],
            practiceQuestions: [
              'Tell me about a time you had to influence without authority.',
              'Describe a product failure you owned. What did you learn?',
            ],
            interviewTip: 'Prepare 7–10 core stories that can be adapted to different questions — don\'t memorize scripts.',
            sourceRefs: ['kellogg-module-1'],
            estimatedMinutes: 12,
            order: 1,
          },
          {
            slug: 'behavioral-practice',
            title: 'Behavioral Practice Questions',
            keyTakeaways: ['Top 5 PM behavioral themes with question examples'],
            practiceQuestions: [
              'Tell me about a time you had to make a decision with incomplete data.',
              'Tell me about a product you shipped that underperformed. What happened?',
              'Describe a time you had to manage up (convince your manager they were wrong).',
            ],
            interviewTip: 'Pre-tag each story with themes so you can quickly select the right one when asked.',
            sourceRefs: [],
            estimatedMinutes: 18,
            order: 2,
          },
        ],
      },
    ],
  },

  // ─── PATH 3: AI-PM TRACK ─────────────────────────────────────────────────
  {
    slug: 'ai-pm',
    title: 'AI-PM Track',
    description: '6 focused modules for PMs targeting AI product roles. Technically rigorous, interview-focused.',
    icon: 'Brain',
    order: 3,
    modules: [
      {
        slug: 'ai-fundamentals',
        title: 'Module 1 — AI/ML Fundamentals for PMs',
        description: 'LLMs, RAG, fine-tuning, embeddings, and evals — explained for PMs.',
        weekNumber: null,
        estimatedMinutes: 60,
        order: 1,
        lessons: [
          {
            slug: 'llms-explained',
            title: 'LLMs Explained for PMs',
            keyTakeaways: [
              'LLM: a neural network trained on text data to predict the next token',
              'Context window: the amount of text an LLM can "see" at once — key constraint for product design',
              'Hallucination: LLMs can generate confident but incorrect output — always design for it',
            ],
            practiceQuestions: [
              'A user reports your AI assistant gave wrong information confidently. How do you handle this product problem?',
              'What are 3 product constraints you should design around when building an LLM-powered feature?',
            ],
            interviewTip: 'In AI-PM interviews, you must explain trade-offs (accuracy vs. latency, cost vs. quality) — not just describe capabilities.',
            sourceRefs: ['kellogg-module-5'],
            estimatedMinutes: 15,
            order: 1,
          },
          {
            slug: 'rag-for-pms',
            title: 'RAG for PMs',
            keyTakeaways: [
              'RAG (Retrieval-Augmented Generation): fetch relevant documents, then generate — reduces hallucination',
              'Key components: embedding model, vector database, retrieval, generation',
              'When to use RAG vs. fine-tuning: RAG for dynamic/updated knowledge, fine-tuning for style/behavior',
            ],
            practiceQuestions: [
              'Should you use RAG or fine-tuning to build a customer support bot for a SaaS product?',
              'Design the RAG architecture for an AI research assistant.',
            ],
            interviewTip: 'Knowing RAG vs. fine-tuning trade-offs is table stakes for AI-PM interviews at AI-first companies.',
            sourceRefs: ['kellogg-module-5'],
            estimatedMinutes: 15,
            order: 2,
          },
          {
            slug: 'evals-for-pms',
            title: 'Evals, Benchmarks & Model Selection',
            keyTakeaways: [
              'Evals: automated tests that measure AI output quality — BLEU, ROUGE, LLM-as-judge',
              'Model selection criteria: cost, latency, context window, quality, provider risk',
              'Benchmark vs. production: a model that wins on benchmarks may still fail in your use case',
            ],
            practiceQuestions: [
              'How would you decide whether to use GPT-4 vs. Claude vs. a smaller open-source model?',
              'Design an eval pipeline for an AI summarization feature.',
            ],
            interviewTip: 'Mention evals early in AI product design answers — it shows you think about quality from day one.',
            sourceRefs: ['kellogg-module-5'],
            estimatedMinutes: 14,
            order: 3,
          },
        ],
      },
      {
        slug: 'ai-product-strategy',
        title: 'Module 2 — AI Product Strategy',
        description: 'Build vs. buy, model selection, AI moats, and strategic positioning.',
        weekNumber: null,
        estimatedMinutes: 55,
        order: 2,
        lessons: [
          {
            slug: 'build-vs-buy-ai',
            title: 'Build vs. Buy vs. Wrap in AI',
            keyTakeaways: [
              'Build: maximum control + differentiation, requires AI/ML team, high cost',
              'Buy: fastest to market, vendor lock-in risk, limited differentiation',
              'Wrap: use foundation models (GPT/Claude) via API — fastest + cheapest, margins at risk',
            ],
            practiceQuestions: [
              'Should a 50-person startup build their own recommendation model or use an API?',
              'What are the risks of building your entire product on top of OpenAI\'s API?',
            ],
            interviewTip: 'Build/buy/wrap trade-offs come up in almost every AI-PM interview — have a crisp framework ready.',
            sourceRefs: ['kellogg-module-5'],
            estimatedMinutes: 15,
            order: 1,
          },
          {
            slug: 'ai-moats',
            title: 'Building AI Moats',
            keyTakeaways: [
              'Data moat: proprietary data that others can\'t replicate — the strongest AI moat',
              'Workflow moat: deeply embedded in user workflow, high switching cost',
              'Model moat: your fine-tuned or proprietary model is better — hard to build, easy to lose',
            ],
            practiceQuestions: [
              'Perplexity AI uses existing search data. What\'s their moat?',
              'How would you build a defensible AI product in a market where foundation models are commoditizing?',
            ],
            interviewTip: 'AI moat questions are strategy questions — use the same frameworks (network effects, switching costs) but apply them to data and AI workflows.',
            sourceRefs: ['kellogg-module-5'],
            estimatedMinutes: 14,
            order: 2,
          },
          {
            slug: 'ai-product-positioning',
            title: 'Positioning AI Products',
            keyTakeaways: [
              'Avoid "AI-powered" as a benefit — users care about outcomes, not technology',
              'Trust is the #1 constraint in AI product adoption — design for transparency',
              'The value should be 10x better, not 10% better — AI features need to be dramatically superior to justify the trust investment',
            ],
            practiceQuestions: [
              'How would you position an AI writing assistant against human editors?',
              'Redesign the onboarding for Cursor (AI coding tool) to maximize trust and adoption.',
            ],
            interviewTip: 'AI product positioning = same positioning rules, but with an extra dimension: trust calibration.',
            sourceRefs: ['kellogg-module-5'],
            estimatedMinutes: 12,
            order: 3,
          },
        ],
      },
      {
        slug: 'ai-product-metrics',
        title: 'Module 3 — AI Product Metrics',
        description: 'Latency, hallucination rate, RLHF, DSAT, and AI-specific success metrics.',
        weekNumber: null,
        estimatedMinutes: 50,
        order: 3,
        lessons: [
          {
            slug: 'ai-quality-metrics',
            title: 'AI Quality Metrics',
            keyTakeaways: [
              'Hallucination rate: % of outputs containing factual errors — track separately from user satisfaction',
              'DSAT (Dissatisfaction): user explicitly signals a bad response — gold-label signal for RLHF',
              'Groundedness: how well the AI response is supported by source documents (key for RAG)',
            ],
            practiceQuestions: [
              'How would you measure the quality of an AI customer support chatbot?',
              'Your AI feature has a 4.2 star avg rating but users are churning. What\'s happening?',
            ],
            interviewTip: 'AI metrics answers should include both technical quality metrics AND user-facing outcome metrics.',
            sourceRefs: ['kellogg-module-5'],
            estimatedMinutes: 15,
            order: 1,
          },
          {
            slug: 'latency-and-cost',
            title: 'Latency, Cost & Model Trade-offs',
            keyTakeaways: [
              'Time to First Token (TTFT): latency users feel — target < 1s for interactive use cases',
              'Cost per query: critical at scale — GPT-4 vs. GPT-4o is 30x cost difference',
              'Caching: reuse expensive LLM calls for common queries — major cost reduction strategy',
            ],
            practiceQuestions: [
              'Your AI feature costs $0.08 per query. At 1M daily users, is that sustainable?',
              'How would you optimize an AI search feature that currently has 4-second response times?',
            ],
            interviewTip: 'AI-PM interviews will probe cost/latency trade-offs — know rough API pricing and have an optimization framework.',
            sourceRefs: ['kellogg-module-5'],
            estimatedMinutes: 14,
            order: 2,
          },
          {
            slug: 'rlhf-feedback-loops',
            title: 'RLHF & Feedback Loop Design',
            keyTakeaways: [
              'RLHF (Reinforcement Learning from Human Feedback): trains models using human preference signals',
              'Feedback loop design: thumbs up/down → review queue → labeling → fine-tuning cycle',
              'Implicit signals: time-on-answer, copy action, share action — often more reliable than explicit ratings',
            ],
            practiceQuestions: [
              'Design a feedback collection system for an AI writing assistant.',
              'How would you build a human review workflow for high-stakes AI outputs?',
            ],
            interviewTip: 'Mentioning RLHF and implicit vs. explicit signals in your AI metrics answer will impress AI-first interviewers.',
            sourceRefs: ['kellogg-module-5'],
            estimatedMinutes: 12,
            order: 3,
          },
        ],
      },
      {
        slug: 'ai-product-teardowns',
        title: 'Module 4 — AI Product Teardowns',
        description: 'Structured teardowns of ChatGPT, Cursor, Perplexity, Copilot, and Gemini.',
        weekNumber: null,
        estimatedMinutes: 60,
        order: 4,
        lessons: [
          {
            slug: 'chatgpt-teardown',
            title: 'ChatGPT Teardown',
            keyTakeaways: [
              'Core value: general-purpose AI assistant with conversational UX',
              'Moat: brand + ecosystem (GPT Store, API ecosystem) + continuous model improvement',
              'Weakness: no persistent memory by default, no real-time data in base model',
            ],
            practiceQuestions: [
              'How would you improve ChatGPT\'s retention for non-power users?',
              'Design a new feature for ChatGPT targeting enterprise knowledge workers.',
            ],
            interviewTip: 'Teardown answers should cover: user segments, core value prop, moat, gaps, and one improvement.',
            sourceRefs: ['kellogg-module-5'],
            estimatedMinutes: 15,
            order: 1,
          },
          {
            slug: 'cursor-perplexity-teardown',
            title: 'Cursor & Perplexity Teardowns',
            keyTakeaways: [
              'Cursor: workflow embedding + codebase context = strong switching cost moat',
              'Perplexity: replaces search for research queries with cited, real-time answers',
              'Both exploit a gap: existing tools (VS Code, Google) are not AI-native',
            ],
            practiceQuestions: [
              'How should Perplexity defend against Google AI Mode?',
              'Design Cursor\'s expansion into a new user segment beyond developers.',
            ],
            interviewTip: 'Use these teardowns as templates — interviewers often ask about products you should have already studied.',
            sourceRefs: ['kellogg-module-5'],
            estimatedMinutes: 15,
            order: 2,
          },
          {
            slug: 'github-copilot-gemini-teardown',
            title: 'GitHub Copilot & Gemini Teardowns',
            keyTakeaways: [
              'Copilot: distribution via GitHub + Microsoft ecosystem is the primary moat, not model quality',
              'Gemini: Google\'s advantage is multimodal data + search integration + Android distribution',
              'Ecosystem vs. model quality: distribution beats model quality in mass market AI',
            ],
            practiceQuestions: [
              'Why is GitHub Copilot still dominant despite many competitors with better models?',
              'How would you differentiate a new AI coding tool against Copilot?',
            ],
            interviewTip: 'In AI product strategy interviews, demonstrate you understand distribution dynamics, not just model capabilities.',
            sourceRefs: ['kellogg-module-5'],
            estimatedMinutes: 15,
            order: 3,
          },
        ],
      },
      {
        slug: 'trust-safety-ethics',
        title: 'Module 5 — Trust, Safety & Ethics in AI',
        description: 'How to build safe AI products: from risk frameworks to bias mitigation.',
        weekNumber: null,
        estimatedMinutes: 50,
        order: 5,
        lessons: [
          {
            slug: 'ai-risk-framework',
            title: 'AI Risk Framework for PMs',
            keyTakeaways: [
              'Risk categories: safety, fairness, privacy, security, misuse',
              'Risk × Severity × Probability matrix: not all risks deserve equal treatment',
              'Red-teaming: systematically attacking your own product before launch',
            ],
            practiceQuestions: [
              'You\'re launching an AI hiring tool. What are the top 3 risks and how do you mitigate them?',
              'Design a trust and safety review process for a new AI content generation feature.',
            ],
            interviewTip: 'T&S answers at AI companies should show you think about both technical safeguards AND policy/governance.',
            sourceRefs: ['kellogg-module-5'],
            estimatedMinutes: 15,
            order: 1,
          },
          {
            slug: 'bias-and-fairness',
            title: 'Bias, Fairness & Responsible AI',
            keyTakeaways: [
              'Training data bias: if the data reflects historical inequity, so will the model',
              'Fairness definitions conflict: equal accuracy vs. equal error rates vs. demographic parity',
              'Explainability vs. accuracy: more complex models are often less explainable',
            ],
            practiceQuestions: [
              'Your AI loan approval model is flagged for racial bias. Walk me through your response.',
              'How do you balance model accuracy with fairness requirements?',
            ],
            interviewTip: 'Bias questions require both technical awareness AND policy/product design answers — cover both.',
            sourceRefs: ['kellogg-module-5'],
            estimatedMinutes: 14,
            order: 2,
          },
          {
            slug: 'ai-governance',
            title: 'AI Governance & Compliance',
            keyTakeaways: [
              'EU AI Act: risk-based tiering (unacceptable / high / limited / minimal risk)',
              'Model cards and system cards: documentation standards for AI transparency',
              'Incident response: what happens when your AI causes harm at scale',
            ],
            practiceQuestions: [
              'How would you structure the AI governance process for a Series B startup?',
              'What does a responsible AI product launch checklist include?',
            ],
            interviewTip: 'Governance questions at large tech companies test whether you can operate within regulatory reality.',
            sourceRefs: ['kellogg-module-5'],
            estimatedMinutes: 12,
            order: 3,
          },
        ],
      },
      {
        slug: 'ai-pm-interview-prep',
        title: 'Module 6 — AI-PM Interview Prep',
        description: 'Question bank + AI-specific mock interview scenarios.',
        weekNumber: null,
        estimatedMinutes: 45,
        order: 6,
        lessons: [
          {
            slug: 'ai-pm-question-bank',
            title: 'AI-PM Question Bank',
            keyTakeaways: [
              '20+ most common AI-PM interview questions organized by category',
              'Common traps: over-indexing on model capabilities, ignoring trust/safety, no mention of evals',
              'Questions increasingly blend product sense + AI knowledge — prepare for hybrids',
            ],
            practiceQuestions: [
              'Design an AI feature for Spotify that improves playlist discovery.',
              'How would you measure the success of an AI-powered content moderation system?',
              'Should Twitter/X use AI to rank its home feed? What are the trade-offs?',
            ],
            interviewTip: 'AI-PM interviews test three things: do you understand AI constraints, can you apply PM frameworks, do you care about safety/ethics.',
            sourceRefs: ['kellogg-module-5'],
            estimatedMinutes: 20,
            order: 1,
          },
          {
            slug: 'ai-pm-mock-scenarios',
            title: 'AI-PM Mock Scenarios',
            keyTakeaways: ['3 full AI-PM case scenarios with structured answer frameworks'],
            practiceQuestions: [
              'You are the PM for Google\'s AI search. A study shows it reduces user trust in health queries. What do you do?',
              'Design a new AI feature for Figma that helps non-designers create production-quality UI.',
              'Your AI customer support bot handles 80% of tickets but 5% of its responses cause escalations. How do you fix it?',
            ],
            interviewTip: 'AI-PM mock scenarios always have a "gotcha" — read the question carefully before structuring your answer.',
            sourceRefs: [],
            estimatedMinutes: 20,
            order: 2,
          },
        ],
      },
    ],
  },
]

// Diagnostic questions for the Fast Track path
export const DIAGNOSTIC_QUESTIONS = [
  {
    id: 'diag-1',
    question: 'Your DAU dropped 20% last Monday. What is the FIRST thing you check?',
    options: [
      'File a bug report with engineering',
      'Check if there was a deploy, outage, or external event',
      'Survey users about their experience',
      'Revert the last feature release',
    ],
    correctIndex: 1,
    skillArea: 'metrics' as const,
    explanation: 'Always rule out external causes (outage, deploy, holiday) before investigating user behavior changes.',
  },
  {
    id: 'diag-2',
    question: 'You have 4 features. A=RICE score 80, B=RICE score 65, C=compliance requirement, D=CEO request. What order?',
    options: [
      'C → A → B → D',
      'D → A → B → C',
      'A → B → C → D',
      'C → D → A → B',
    ],
    correctIndex: 0,
    skillArea: 'execution' as const,
    explanation: 'Compliance requirements are non-negotiable. Then prioritize by data (RICE). CEO requests need data to be deprioritized.',
  },
  {
    id: 'diag-3',
    question: 'What is the BEST way to validate a product hypothesis before building?',
    options: [
      'Build an MVP and measure usage',
      'Run a survey asking if users would use the feature',
      'Interview 5-8 users about past behavior in the problem space',
      'A/B test two versions',
    ],
    correctIndex: 2,
    skillArea: 'execution' as const,
    explanation: 'Surveys measure stated preference (unreliable). User interviews about past behavior reveal actual behavior. Building is validation but it\'s the most expensive.',
  },
  {
    id: 'diag-4',
    question: 'Should Amazon build its own delivery logistics network or partner with FedEx/UPS? Key strategic reason:',
    options: [
      'Build — higher quality control',
      'Build — delivery data is a strategic asset and creates a moat',
      'Partner — faster time to market',
      'Partner — logistics is not a core PM competency',
    ],
    correctIndex: 1,
    skillArea: 'strategy' as const,
    explanation: 'Amazon built because delivery data + logistics infrastructure creates network effects and long-term cost advantages. Speed-to-market is a valid reason to partner but doesn\'t explain the strategic rationale.',
  },
  {
    id: 'diag-5',
    question: 'A user reports your LLM assistant gave confidently wrong medical advice. What do you do FIRST?',
    options: [
      'Improve the model with more medical training data',
      'Add a disclaimer to the UI',
      'Assess severity and scope — how many users were affected?',
      'Temporarily disable the medical query capability',
    ],
    correctIndex: 2,
    skillArea: 'ai-pm' as const,
    explanation: 'First, understand the blast radius. Then decide on immediate mitigation (disable/disclaimer). Training data fixes are long-term, not emergency response.',
  },
  {
    id: 'diag-6',
    question: 'Tell me about a time you influenced a stakeholder without authority. The BEST answer structure is:',
    options: [
      'List the stakeholder\'s concerns and how you addressed each',
      'Describe the situation briefly, then focus heavily on YOUR actions and the outcome',
      'Explain the business context extensively so the interviewer understands the stakes',
      'Focus on team collaboration and shared goals',
    ],
    correctIndex: 1,
    skillArea: 'behavioral' as const,
    explanation: 'STAR format: Situation (brief) → Task (brief) → Action (60% of answer, YOUR actions) → Result (quantified). Interviewers want to know what YOU did, not team or context.',
  },
  {
    id: 'diag-7',
    question: 'What is a North Star Metric?',
    options: [
      'The most important business metric (usually revenue)',
      'The metric that best captures the core value delivered to users — leading indicator of long-term health',
      'The metric your CEO tracks on the dashboard',
      'The metric with the highest correlation to retention',
    ],
    correctIndex: 1,
    skillArea: 'metrics' as const,
    explanation: 'NSM captures user value, not just business value. Revenue is a lagging indicator. Airbnb\'s NSM is "nights booked" — it captures value for both hosts and guests.',
  },
  {
    id: 'diag-8',
    question: 'You are PM for a B2B SaaS. What is the MOST important strategic question before expanding to a new market?',
    options: [
      'Do we have the engineering capacity to support a new market?',
      'Does our core value proposition translate to the new market, and do we have a distribution advantage?',
      'What is the revenue potential of the new market?',
      'Are there competitors already in the new market?',
    ],
    correctIndex: 1,
    skillArea: 'strategy' as const,
    explanation: 'Revenue potential matters but is secondary. The key is whether your value prop translates AND whether you have a path to distribution. Without both, market size is irrelevant.',
  },
  {
    id: 'diag-9',
    question: 'Your team is 2 sprints from a launch deadline when an engineer finds a critical performance issue. What do you do?',
    options: [
      'Push the launch date — quality first',
      'Launch on time with the performance issue and fix in the next sprint',
      'Scope down the feature to remove the performance-heavy parts and launch on time',
      'Ask the engineer to work overtime to fix it before launch',
    ],
    correctIndex: 2,
    skillArea: 'execution' as const,
    explanation: 'Scope down is the PM move. Delaying impacts commitments. Shipping known issues is a trust/safety risk. Overtime is not a PM decision to make unilaterally.',
  },
  {
    id: 'diag-10',
    question: 'What is the difference between RAG and fine-tuning in practical product terms?',
    options: [
      'RAG is cheaper, fine-tuning is more accurate — always prefer RAG',
      'RAG is for dynamic/current knowledge; fine-tuning is for teaching the model new behavior or style',
      'Fine-tuning is always better for production, RAG is just for prototyping',
      'They are equivalent — choose based on engineering team preference',
    ],
    correctIndex: 1,
    skillArea: 'ai-pm' as const,
    explanation: 'RAG lets you update knowledge without retraining (great for docs/databases). Fine-tuning changes model behavior/style (great for brand voice, domain-specific reasoning). They solve different problems.',
  },
]
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/learn-data.ts
git commit -m "feat: add learn module static curriculum data (3 paths, 29 modules, 60 lessons)"
```

---

### Task 5: AI Prompts — Add TUTOR

**Files:**
- Modify: `src/lib/ai-prompts.ts`

- [ ] **Step 1: Add TUTOR prompt to SYSTEM_PROMPTS object**

In `src/lib/ai-prompts.ts`, add the following inside the `SYSTEM_PROMPTS` object, after the `HINT_GENERATOR` entry (before the closing `}`):

```typescript
  TUTOR: (context: { lessonTitle?: string; lessonContent?: string; pathTitle?: string }) =>
    `You are an expert PM interview coach and product management tutor embedded in the PrepAI learning platform.
${context.lessonTitle ? `\nThe learner is currently studying: "${context.lessonTitle}" (part of ${context.pathTitle || 'the PM curriculum'}).` : '\nThe learner is using you as a general PM tutor.'}
${context.lessonContent ? `\nCurrent lesson content for context:\n---\n${context.lessonContent.slice(0, 2000)}\n---` : ''}

BEHAVIOR:
- Answer clearly and concisely — the learner is preparing for PM interviews
- Ground your answers in real product examples (Spotify, Airbnb, Slack, etc.)
- When relevant, connect the answer to how it would appear in an interview context
- If retrieved source material is provided, use it to ground your answer — cite the source briefly
- Ask clarifying questions if the user's question is too vague to answer well
- Keep responses focused and scannable — use bullet points for lists, bold for key terms
- If the user asks a practice question, give structured feedback on their answer using the STAR or framework lens

CONSTRAINTS:
- Stay focused on PM knowledge, product strategy, metrics, behavioral prep, and AI-PM topics
- Do not help with unrelated tasks
- Do not reproduce copyrighted text verbatim — synthesize and explain in your own words`,

  LESSON_GENERATOR: (context: {
    lessonTitle: string
    keyTakeaways: string[]
    practiceQuestions: string[]
    interviewTip: string | null
    sourceRefs: string[]
    retrievedChunks: string
  }) =>
    `You are generating structured lesson content for a PM interview prep platform.
The lesson must be original, synthesized from the source material provided, and optimized for adult learners preparing for PM interviews.

LESSON METADATA:
- Title: ${context.lessonTitle}
- Key Takeaways to cover: ${context.keyTakeaways.join('; ')}
- Source references: ${context.sourceRefs.join(', ')}

SOURCE MATERIAL (use to inform content, do not copy verbatim):
---
${context.retrievedChunks}
---

OUTPUT FORMAT:
Write a lesson in this exact structure (use markdown):

## [Lesson Title]

[2-3 sentence hook that connects this concept to PM interviews]

### Core Concept
[3-4 paragraphs explaining the concept clearly. Use real product examples. No fluff.]

### Why It Matters in Interviews
[1-2 paragraphs on how this topic shows up in PM interviews and what interviewers are looking for]

### Key Frameworks
[Numbered list of 2-3 frameworks or mental models, each with a 1-sentence explanation]

### Real-World Example
[One concrete example — a real product, a real scenario, 2-3 paragraphs]

### Common Mistakes
[Bulleted list of 3-4 mistakes candidates make on this topic]

Keep the total length to 500-700 words. Be specific, not generic. Avoid filler phrases like "In today's fast-paced world..."`,
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai-prompts.ts
git commit -m "feat: add TUTOR and LESSON_GENERATOR system prompts"
```

---

*End of Part 1. Next: Part 2 — Backend (tutor lib, ingest script, content-gen script, 4 API routes).*

---

## Part 2 — Backend

### Task 6: Tutor Library

**Files:**
- Create: `src/lib/tutor.ts`

This module handles the RAG pipeline: embed a query → pgvector similarity search → assemble context. Used by the tutor API route.

- [ ] **Step 1: Create `src/lib/tutor.ts`**

```typescript
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import type { KnowledgeChunk, TutorMessage } from '@/types/learn'

const EMBEDDING_MODEL = 'text-embedding-3-small'
const TOP_K = 5

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')
  return new OpenAI({ apiKey })
}

export async function embedText(text: string): Promise<number[]> {
  const client = getOpenAIClient()
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000), // stay within token limit
  })
  return response.data[0].embedding
}

export async function retrieveChunks(query: string, sourceFilter?: string): Promise<KnowledgeChunk[]> {
  const embedding = await embedText(query)
  const embeddingStr = `[${embedding.join(',')}]`

  let results: KnowledgeChunk[]

  if (sourceFilter) {
    results = await prisma.$queryRaw<KnowledgeChunk[]>`
      SELECT id, source, "chapterRef", content
      FROM "KnowledgeChunk"
      WHERE source = ${sourceFilter}
      ORDER BY embedding <=> ${embeddingStr}::vector
      LIMIT ${TOP_K}
    `
  } else {
    results = await prisma.$queryRaw<KnowledgeChunk[]>`
      SELECT id, source, "chapterRef", content
      FROM "KnowledgeChunk"
      ORDER BY embedding <=> ${embeddingStr}::vector
      LIMIT ${TOP_K}
    `
  }

  return results
}

export async function retrieveChunksForLesson(
  lessonTitle: string,
  sourceRefs: string[]
): Promise<KnowledgeChunk[]> {
  const embedding = await embedText(lessonTitle)
  const embeddingStr = `[${embedding.join(',')}]`

  // Retrieve more chunks for lesson generation — top 10
  const results = await prisma.$queryRaw<KnowledgeChunk[]>`
    SELECT id, source, "chapterRef", content
    FROM "KnowledgeChunk"
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT 10
  `
  return results
}

export function buildTutorContext(
  chunks: KnowledgeChunk[],
  lessonContent?: string
): string {
  const parts: string[] = []

  if (lessonContent) {
    parts.push(`CURRENT LESSON:\n${lessonContent.slice(0, 1500)}`)
  }

  if (chunks.length > 0) {
    parts.push(
      'RETRIEVED SOURCE MATERIAL:\n' +
        chunks
          .map((c, i) => `[${i + 1}] (${c.source} / ${c.chapterRef})\n${c.content}`)
          .join('\n\n')
    )
  }

  return parts.join('\n\n---\n\n')
}

export function buildTutorMessages(
  conversationHistory: TutorMessage[],
  context: string,
  newUserMessage: string
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []

  // Prepend the first user message with context injection
  const contextualFirstMessage =
    conversationHistory.length === 0
      ? `${context ? `<context>\n${context}\n</context>\n\n` : ''}${newUserMessage}`
      : newUserMessage

  // Add history
  for (const msg of conversationHistory) {
    messages.push({ role: msg.role, content: msg.content })
  }

  messages.push({ role: 'user', content: contextualFirstMessage })

  return messages
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/tutor.ts
git commit -m "feat: add RAG tutor library (embed, retrieve, context assembly)"
```

---

### Task 7: PDF Ingestion Script

**Files:**
- Create: `scripts/ingest-content.ts`

This is a one-time script. Run it after placing PDFs in `pdfs/` directory. It chunks, embeds, and stores knowledge into pgvector.

- [ ] **Step 1: Create `pdfs/` directory placeholder**

```bash
mkdir -p pdfs
echo "# Place your PDF files here\n# product-book.pdf\n# kellogg-course.pdf" > pdfs/README.md
```

- [ ] **Step 2: Create `scripts/ingest-content.ts`**

```typescript
/**
 * PDF Ingestion Script
 * Usage: npx tsx scripts/ingest-content.ts --source product-book --file pdfs/product-book.pdf
 *        npx tsx scripts/ingest-content.ts --source kellogg --file pdfs/kellogg-course.pdf
 *        npx tsx scripts/ingest-content.ts --source frameworks
 */

import * as fs from 'fs'
import * as path from 'path'
import pdf from 'pdf-parse'
import OpenAI from 'openai'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const CHUNK_SIZE = 500      // tokens (~2000 chars)
const CHUNK_OVERLAP = 50    // token overlap (~200 chars)
const CHARS_PER_TOKEN = 4   // rough approximation
const BATCH_SIZE = 20       // embeddings per OpenAI API call
const EMBEDDING_MODEL = 'text-embedding-3-small'

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')
  return new OpenAI({ apiKey })
}

function chunkText(text: string, chunkChars: number, overlapChars: number): string[] {
  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + chunkChars, text.length)
    let chunk = text.slice(start, end)

    // Try to break at a sentence boundary
    if (end < text.length) {
      const lastPeriod = chunk.lastIndexOf('. ')
      if (lastPeriod > chunkChars * 0.6) {
        chunk = chunk.slice(0, lastPeriod + 1)
      }
    }

    if (chunk.trim().length > 100) { // skip tiny chunks
      chunks.push(chunk.trim())
    }

    start += chunk.length - overlapChars
  }

  return chunks
}

function detectChapterRef(chunkIndex: number, totalChunks: number, source: string): string {
  // Assign chapter refs by position — rough heuristic
  if (source === 'product-book') {
    const chapterSize = Math.floor(totalChunks / 9)
    const chapter = Math.min(Math.floor(chunkIndex / Math.max(chapterSize, 1)) + 1, 9)
    return `ch${chapter}`
  }
  if (source === 'kellogg') {
    const moduleSize = Math.floor(totalChunks / 10)
    const module = Math.min(Math.floor(chunkIndex / Math.max(moduleSize, 1)) + 1, 10)
    return `module-${module}`
  }
  return 'general'
}

async function embedBatch(texts: string[], openai: OpenAI): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  })
  return response.data.map((d) => d.embedding)
}

async function ingestFrameworks(prisma: PrismaClient, openai: OpenAI) {
  // Import frameworks from knowledge-data.ts as chunks
  const { FRAMEWORKS } = await import('../src/lib/knowledge-data')

  console.log(`Ingesting ${FRAMEWORKS.length} frameworks...`)

  for (let i = 0; i < FRAMEWORKS.length; i += BATCH_SIZE) {
    const batch = FRAMEWORKS.slice(i, i + BATCH_SIZE)
    const texts = batch.map(
      (f: { name: string; description: string; whenToUse?: string; steps?: string[] }) =>
        `Framework: ${f.name}\n\nDescription: ${f.description}\n\nWhen to use: ${f.whenToUse || 'General PM use'}\n\nSteps: ${(f.steps || []).join('; ')}`
    )
    const embeddings = await embedBatch(texts, openai)

    for (let j = 0; j < batch.length; j++) {
      const framework = batch[j]
      const embeddingStr = `[${embeddings[j].join(',')}]`

      // Delete existing chunk for this framework if re-running
      await prisma.$executeRaw`
        DELETE FROM "KnowledgeChunk"
        WHERE source = 'frameworks' AND "chapterRef" = ${framework.name}
      `

      await prisma.$executeRaw`
        INSERT INTO "KnowledgeChunk" (id, source, "chapterRef", content, embedding, "createdAt")
        VALUES (
          gen_random_uuid()::text,
          'frameworks',
          ${framework.name},
          ${texts[j]},
          ${embeddingStr}::vector,
          NOW()
        )
      `
    }

    console.log(`  Embedded frameworks ${i + 1}–${Math.min(i + BATCH_SIZE, FRAMEWORKS.length)}`)
  }
}

async function ingestPDF(source: string, filePath: string, prisma: PrismaClient, openai: OpenAI) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`PDF not found: ${filePath}`)
  }

  const buffer = fs.readFileSync(filePath)
  const data = await pdf(buffer)
  const text = data.text

  const chunkChars = CHUNK_SIZE * CHARS_PER_TOKEN
  const overlapChars = CHUNK_OVERLAP * CHARS_PER_TOKEN
  const chunks = chunkText(text, chunkChars, overlapChars)

  console.log(`Parsed ${chunks.length} chunks from ${path.basename(filePath)}`)

  // Delete existing chunks for this source if re-running
  await prisma.$executeRaw`DELETE FROM "KnowledgeChunk" WHERE source = ${source}`
  console.log(`  Cleared existing chunks for source: ${source}`)

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE)
    const embeddings = await embedBatch(batch, openai)

    for (let j = 0; j < batch.length; j++) {
      const chunkIndex = i + j
      const chapterRef = detectChapterRef(chunkIndex, chunks.length, source)
      const embeddingStr = `[${embeddings[j].join(',')}]`

      await prisma.$executeRaw`
        INSERT INTO "KnowledgeChunk" (id, source, "chapterRef", content, embedding, "createdAt")
        VALUES (
          gen_random_uuid()::text,
          ${source},
          ${chapterRef},
          ${batch[j]},
          ${embeddingStr}::vector,
          NOW()
        )
      `
    }

    const pct = Math.round(((i + BATCH_SIZE) / chunks.length) * 100)
    console.log(`  Progress: ${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length} chunks (${pct}%)`)

    // Rate limit: small delay between batches
    if (i + BATCH_SIZE < chunks.length) {
      await new Promise((r) => setTimeout(r, 200))
    }
  }
}

async function main() {
  const args = process.argv.slice(2)
  const sourceIdx = args.indexOf('--source')
  const fileIdx = args.indexOf('--file')

  const source = sourceIdx !== -1 ? args[sourceIdx + 1] : null
  const filePath = fileIdx !== -1 ? args[fileIdx + 1] : null

  if (!source) {
    console.error('Usage: npx tsx scripts/ingest-content.ts --source <product-book|kellogg|frameworks> [--file <path>]')
    process.exit(1)
  }

  const prisma = createPrisma()
  const openai = getOpenAI()

  try {
    if (source === 'frameworks') {
      await ingestFrameworks(prisma as unknown as import('@prisma/client').PrismaClient, openai)
    } else {
      if (!filePath) {
        console.error(`--file is required for source: ${source}`)
        process.exit(1)
      }
      await ingestPDF(source, filePath, prisma as unknown as import('@prisma/client').PrismaClient, openai)
    }

    const count = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "KnowledgeChunk" WHERE source = ${source}
    `
    console.log(`\nDone. Total chunks for "${source}": ${count[0].count}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
```

- [ ] **Step 3: Verify the script compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add scripts/ingest-content.ts pdfs/README.md
git commit -m "feat: add PDF ingestion script (pdf-parse → chunks → OpenAI embeddings → pgvector)"
```

---

### Task 8: Lesson Content Generation + DB Seed Script

**Files:**
- Create: `scripts/generate-lesson-content.ts`

This script seeds the DB with path/module/lesson structure from `learn-data.ts`, then generates content for each lesson using RAG + Claude.

- [ ] **Step 1: Create `scripts/generate-lesson-content.ts`**

```typescript
/**
 * Lesson Content Generation Script
 * Seeds the DB with the curriculum structure, then generates AI lesson content.
 *
 * Usage:
 *   npx tsx scripts/generate-lesson-content.ts              # seed structure + generate all
 *   npx tsx scripts/generate-lesson-content.ts --seed-only  # only seed structure
 *   npx tsx scripts/generate-lesson-content.ts --path playbook  # generate one path
 *   npx tsx scripts/generate-lesson-content.ts --regenerate    # regenerate all (overwrite existing)
 */

import Anthropic from '@anthropic-ai/sdk'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { LEARN_PATHS } from '../src/lib/learn-data'
import { SYSTEM_PROMPTS } from '../src/lib/ai-prompts'

const MODEL = 'claude-sonnet-4-20250514'

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

function getAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
  return new Anthropic({ apiKey })
}

async function retrieveChunksForLesson(
  prisma: PrismaClient,
  lessonTitle: string
): Promise<string> {
  // Dynamic import to avoid circular reference at top level
  const OpenAI = (await import('openai')).default
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

  const embResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: lessonTitle.slice(0, 8000),
  })
  const embeddingStr = `[${embResponse.data[0].embedding.join(',')}]`

  const results = await prisma.$queryRaw<Array<{ content: string; source: string; chapterRef: string }>>`
    SELECT content, source, "chapterRef"
    FROM "KnowledgeChunk"
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT 10
  `

  if (results.length === 0) return ''

  return results
    .map((r, i) => `[${i + 1}] (${r.source} / ${r.chapterRef})\n${r.content}`)
    .join('\n\n')
}

async function generateLessonContent(
  anthropic: Anthropic,
  lessonTitle: string,
  keyTakeaways: string[],
  practiceQuestions: string[],
  interviewTip: string | null,
  sourceRefs: string[],
  retrievedChunks: string
): Promise<string> {
  const systemPrompt = SYSTEM_PROMPTS.LESSON_GENERATOR({
    lessonTitle,
    keyTakeaways,
    practiceQuestions,
    interviewTip,
    sourceRefs,
    retrievedChunks,
  })

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Generate the lesson content for: "${lessonTitle}"`,
      },
    ],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  return textBlock ? textBlock.text : ''
}

async function seedStructure(prisma: PrismaClient) {
  console.log('\n--- Seeding curriculum structure ---')

  for (const pathData of LEARN_PATHS) {
    // Upsert path
    const path = await prisma.learningPath.upsert({
      where: { slug: pathData.slug },
      update: {
        title: pathData.title,
        description: pathData.description,
        icon: pathData.icon,
        order: pathData.order,
      },
      create: {
        slug: pathData.slug,
        title: pathData.title,
        description: pathData.description,
        icon: pathData.icon,
        order: pathData.order,
      },
    })
    console.log(`  Path: ${path.slug}`)

    for (const moduleData of pathData.modules) {
      // Upsert module
      const module = await prisma.learningModule.upsert({
        where: { pathId_slug: { pathId: path.id, slug: moduleData.slug } },
        update: {
          title: moduleData.title,
          description: moduleData.description,
          weekNumber: moduleData.weekNumber,
          estimatedMinutes: moduleData.estimatedMinutes,
          order: moduleData.order,
        },
        create: {
          pathId: path.id,
          slug: moduleData.slug,
          title: moduleData.title,
          description: moduleData.description,
          weekNumber: moduleData.weekNumber,
          estimatedMinutes: moduleData.estimatedMinutes,
          order: moduleData.order,
        },
      })

      for (const lessonData of moduleData.lessons) {
        // Upsert lesson (without content — generated separately)
        await prisma.learningLesson.upsert({
          where: { moduleId_slug: { moduleId: module.id, slug: lessonData.slug } },
          update: {
            title: lessonData.title,
            keyTakeaways: lessonData.keyTakeaways,
            practiceQuestions: lessonData.practiceQuestions,
            interviewTip: lessonData.interviewTip,
            sourceRefs: lessonData.sourceRefs,
            estimatedMinutes: lessonData.estimatedMinutes,
            order: lessonData.order,
          },
          create: {
            moduleId: module.id,
            slug: lessonData.slug,
            title: lessonData.title,
            content: '',
            keyTakeaways: lessonData.keyTakeaways,
            practiceQuestions: lessonData.practiceQuestions,
            interviewTip: lessonData.interviewTip,
            sourceRefs: lessonData.sourceRefs,
            estimatedMinutes: lessonData.estimatedMinutes,
            order: lessonData.order,
          },
        })
      }

      console.log(`    Module: ${module.slug} (${moduleData.lessons.length} lessons)`)
    }
  }

  console.log('Structure seeding complete.')
}

async function generateContent(
  prisma: PrismaClient,
  anthropic: Anthropic,
  pathSlugFilter: string | null,
  regenerate: boolean
) {
  console.log('\n--- Generating lesson content ---')

  const hasChunks = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM "KnowledgeChunk"
  `
  const chunkCount = Number(hasChunks[0].count)

  if (chunkCount === 0) {
    console.warn(
      'WARNING: No knowledge chunks found in DB. Run ingest-content.ts first for best results.\n' +
        'Continuing with Claude\'s training knowledge only...'
    )
  } else {
    console.log(`Found ${chunkCount} knowledge chunks for RAG retrieval.`)
  }

  const whereClause = pathSlugFilter
    ? { path: { slug: pathSlugFilter } }
    : {}

  const modules = await prisma.learningModule.findMany({
    where: whereClause,
    include: {
      lessons: true,
      path: { select: { slug: true } },
    },
    orderBy: [{ path: { order: 'asc' } }, { order: 'asc' }],
  })

  let totalGenerated = 0
  let totalSkipped = 0

  for (const module of modules) {
    for (const lesson of module.lessons) {
      // Skip if already has content and --regenerate not set
      if (lesson.content && lesson.content.length > 100 && !regenerate) {
        totalSkipped++
        continue
      }

      // Skip diagnostic placeholder lesson
      if (lesson.slug === 'take-diagnostic') {
        totalSkipped++
        continue
      }

      console.log(`  Generating: [${module.path.slug}] ${lesson.title}`)

      try {
        const retrievedChunks = chunkCount > 0
          ? await retrieveChunksForLesson(prisma, lesson.title)
          : ''

        const content = await generateLessonContent(
          anthropic,
          lesson.title,
          lesson.keyTakeaways,
          lesson.practiceQuestions,
          lesson.interviewTip,
          lesson.sourceRefs,
          retrievedChunks
        )

        await prisma.learningLesson.update({
          where: { id: lesson.id },
          data: { content },
        })

        totalGenerated++
        console.log(`    Done (${content.length} chars)`)

        // Rate limit: avoid hitting API limits
        await new Promise((r) => setTimeout(r, 500))
      } catch (err) {
        console.error(`    ERROR generating ${lesson.slug}:`, err)
      }
    }
  }

  console.log(`\nGeneration complete. Generated: ${totalGenerated}, Skipped: ${totalSkipped}`)
}

async function main() {
  const args = process.argv.slice(2)
  const seedOnly = args.includes('--seed-only')
  const regenerate = args.includes('--regenerate')
  const pathIdx = args.indexOf('--path')
  const pathFilter = pathIdx !== -1 ? args[pathIdx + 1] : null

  const prisma = createPrisma()
  const anthropic = getAnthropic()

  try {
    await seedStructure(prisma)

    if (!seedOnly) {
      await generateContent(prisma, anthropic, pathFilter, regenerate)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
```

- [ ] **Step 2: Verify the script compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-lesson-content.ts
git commit -m "feat: add lesson content generation + curriculum seed script"
```

---

### Task 9: API Route — AI Tutor (Streaming)

**Files:**
- Create: `src/app/api/ai/tutor/route.ts`

Accepts `{ messages, lessonId? }`. Retrieves RAG context, streams Claude response.

- [ ] **Step 1: Create `src/app/api/ai/tutor/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { streamClaude } from '@/lib/ai'
import { SYSTEM_PROMPTS } from '@/lib/ai-prompts'
import { retrieveChunks, buildTutorContext, buildTutorMessages } from '@/lib/tutor'
import { sanitizeInput } from '@/lib/utils'
import type { TutorMessage } from '@/types/learn'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { messages, lessonId } = body as {
      messages: TutorMessage[]
      lessonId?: string
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages is required' }, { status: 400 })
    }

    // Sanitize all message content
    const sanitizedMessages: TutorMessage[] = messages.map((m) => ({
      role: m.role,
      content: sanitizeInput(m.content),
    }))

    const latestUserMessage = sanitizedMessages.filter((m) => m.role === 'user').pop()
    if (!latestUserMessage) {
      return NextResponse.json({ error: 'No user message found' }, { status: 400 })
    }

    // Load lesson context if provided
    let lessonTitle: string | undefined
    let lessonContent: string | undefined
    let pathTitle: string | undefined

    if (lessonId) {
      const lesson = await prisma.learningLesson.findUnique({
        where: { id: lessonId },
        select: {
          title: true,
          content: true,
          module: { select: { path: { select: { title: true } } } },
        },
      })
      if (lesson) {
        lessonTitle = lesson.title
        lessonContent = lesson.content || undefined
        pathTitle = lesson.module.path.title
      }
    }

    // Retrieve relevant chunks from pgvector
    const chunks = await retrieveChunks(latestUserMessage.content).catch(() => [])

    // Build RAG context
    const context = buildTutorContext(chunks, lessonContent)

    // Build messages for Claude
    const history = sanitizedMessages.slice(0, -1) // all except the last user message
    const claudeMessages = buildTutorMessages(history, context, latestUserMessage.content)

    const systemPrompt = SYSTEM_PROMPTS.TUTOR({ lessonTitle, lessonContent, pathTitle })

    const stream = await streamClaude({
      systemPrompt,
      messages: claudeMessages,
      maxTokens: 2048,
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Tutor API error:', error)
    return NextResponse.json({ error: 'Failed to get tutor response' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ai/tutor/route.ts
git commit -m "feat: add streaming RAG tutor API route"
```

---

### Task 10: API Route — Lesson Progress

**Files:**
- Create: `src/app/api/learn/progress/route.ts`

Marks a lesson complete, saves quiz score, creates a `ProgressEntry` for analytics.

- [ ] **Step 1: Create `src/app/api/learn/progress/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id?: string }).id!

    const body = await request.json()
    const { lessonId, quizScore, timeSpentMs } = body as {
      lessonId: string
      quizScore?: number
      timeSpentMs?: number
    }

    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId is required' }, { status: 400 })
    }

    // Verify lesson exists
    const lesson = await prisma.learningLesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        module: {
          select: {
            path: { select: { slug: true } },
          },
        },
      },
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Upsert progress record
    const progress = await prisma.userLessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: {
        completedAt: new Date(),
        ...(quizScore !== undefined && { quizScore }),
        ...(timeSpentMs !== undefined && { timeSpentMs }),
      },
      create: {
        userId,
        lessonId,
        completedAt: new Date(),
        quizScore: quizScore ?? null,
        timeSpentMs: timeSpentMs ?? 0,
      },
    })

    // Create a ProgressEntry so this shows up in analytics/streaks
    await prisma.progressEntry.create({
      data: {
        userId,
        category: 'PRODUCT_SENSE', // default — lessons don't map 1:1 to interview categories
        activity: 'LESSON_COMPLETE',
        score: quizScore ?? null,
        timeSpent: Math.round((timeSpentMs ?? 0) / 1000 / 60), // ms → minutes
        metadata: {
          lessonId,
          pathSlug: lesson.module.path.slug,
        },
      },
    })

    return NextResponse.json({ success: true, progress })
  } catch (error) {
    console.error('Progress API error:', error)
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id?: string }).id!

    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get('lessonId')

    if (lessonId) {
      const progress = await prisma.userLessonProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId } },
      })
      return NextResponse.json(progress)
    }

    // Return all progress for the user
    const allProgress = await prisma.userLessonProgress.findMany({
      where: { userId },
      select: {
        lessonId: true,
        completedAt: true,
        quizScore: true,
        timeSpentMs: true,
      },
    })

    return NextResponse.json(allProgress)
  } catch (error) {
    console.error('Progress GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/learn/progress/route.ts
git commit -m "feat: add lesson progress API route (mark complete, quiz score, analytics)"
```

---

### Task 11: API Route — Path Enrollment

**Files:**
- Create: `src/app/api/learn/enroll/route.ts`

Enrolls a user in a learning path. Idempotent — calling twice is safe.

- [ ] **Step 1: Create `src/app/api/learn/enroll/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id?: string }).id!

    const body = await request.json()
    const { pathSlug } = body as { pathSlug: string }

    if (!pathSlug) {
      return NextResponse.json({ error: 'pathSlug is required' }, { status: 400 })
    }

    const path = await prisma.learningPath.findUnique({ where: { slug: pathSlug } })
    if (!path) return NextResponse.json({ error: 'Path not found' }, { status: 404 })

    const enrollment = await prisma.userPathEnrollment.upsert({
      where: { userId_pathId: { userId, pathId: path.id } },
      update: {}, // no-op if already enrolled
      create: {
        userId,
        pathId: path.id,
        currentWeek: 1,
      },
    })

    return NextResponse.json({ success: true, enrollment })
  } catch (error) {
    console.error('Enroll API error:', error)
    return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as { id?: string }).id!

    const enrollments = await prisma.userPathEnrollment.findMany({
      where: { userId },
      include: { path: { select: { slug: true, title: true } } },
    })

    return NextResponse.json(enrollments)
  } catch (error) {
    console.error('Enroll GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/learn/enroll/route.ts
git commit -m "feat: add path enrollment API route"
```

---

### Task 12: API Route — Diagnostic Quiz

**Files:**
- Create: `src/app/api/learn/diagnostic/route.ts`

Accepts `{ answers: Array<{ questionId, selectedIndex }> }`. Returns weak areas + recommended path.

- [ ] **Step 1: Create `src/app/api/learn/diagnostic/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DIAGNOSTIC_QUESTIONS } from '@/lib/learn-data'
import type { DiagnosticResult, LearnSkillArea } from '@/types/learn'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { answers } = body as {
      answers: Array<{ questionId: string; selectedIndex: number }>
    }

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'answers array is required' }, { status: 400 })
    }

    // Score by skill area
    const areaCorrect: Record<LearnSkillArea, number> = {
      strategy: 0,
      execution: 0,
      metrics: 0,
      behavioral: 0,
      'ai-pm': 0,
    }
    const areaTotal: Record<LearnSkillArea, number> = {
      strategy: 0,
      execution: 0,
      metrics: 0,
      behavioral: 0,
      'ai-pm': 0,
    }

    for (const answer of answers) {
      const question = DIAGNOSTIC_QUESTIONS.find((q) => q.id === answer.questionId)
      if (!question) continue

      const area = question.skillArea as LearnSkillArea
      areaTotal[area] = (areaTotal[area] || 0) + 1

      if (answer.selectedIndex === question.correctIndex) {
        areaCorrect[area] = (areaCorrect[area] || 0) + 1
      }
    }

    // Compute scores (0–100)
    const scores: Record<LearnSkillArea, number> = {
      strategy: 0,
      execution: 0,
      metrics: 0,
      behavioral: 0,
      'ai-pm': 0,
    }
    const areas: LearnSkillArea[] = ['strategy', 'execution', 'metrics', 'behavioral', 'ai-pm']

    for (const area of areas) {
      const total = areaTotal[area] || 1
      scores[area] = Math.round((areaCorrect[area] / total) * 100)
    }

    // Find 2–3 weakest areas
    const sortedAreas = areas
      .filter((a) => areaTotal[a] > 0)
      .sort((a, b) => scores[a] - scores[b])

    const weakAreas = sortedAreas.slice(0, 2) as LearnSkillArea[]

    // Recommend a path based on weaknesses
    let recommendedPath = 'fast-track'
    if (weakAreas.includes('ai-pm')) {
      recommendedPath = 'ai-pm'
    } else if (scores.strategy < 50 && scores.execution < 50 && scores.metrics < 50) {
      recommendedPath = 'playbook' // very broad weakness → start from scratch
    }

    const result: DiagnosticResult = {
      weakAreas,
      scores,
      recommendedPath,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Diagnostic API error:', error)
    return NextResponse.json({ error: 'Failed to score diagnostic' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/learn/diagnostic/route.ts
git commit -m "feat: add diagnostic quiz scoring API route"
```

---

*End of Part 2. Next: Part 3 — UI Components (LearningHub, PathOverview, LessonView, TutorChat, LessonQuiz).*

---

## Part 3 — UI Components

### Task 13: LearningHub + PathCard

**Files:**
- Create: `src/components/learn/PathCard.tsx`
- Create: `src/components/learn/LearningHub.tsx`

- [ ] **Step 1: Create `src/components/learn/PathCard.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { BookMarked, Zap, Brain, CheckCircle2, Clock, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PathWithProgress } from '@/types/learn'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BookMarked,
  Zap,
  Brain,
}

interface PathCardProps {
  path: PathWithProgress
  onEnroll: (pathSlug: string) => void
  enrolling: boolean
}

export function PathCard({ path, onEnroll, enrolling }: PathCardProps) {
  const Icon = ICON_MAP[path.icon] ?? BookMarked
  const isEnrolled = !!path.enrollment
  const hasProgress = path.completedLessons > 0

  const colorMap: Record<string, { bg: string; icon: string; bar: string; badge: string }> = {
    playbook: {
      bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
      icon: 'bg-blue-800 text-white',
      bar: 'bg-blue-600',
      badge: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    },
    'fast-track': {
      bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
      icon: 'bg-amber-500 text-white',
      bar: 'bg-amber-500',
      badge: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300',
    },
    'ai-pm': {
      bg: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
      icon: 'bg-purple-700 text-white',
      bar: 'bg-purple-600',
      badge: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    },
  }

  const colors = colorMap[path.slug] ?? colorMap.playbook

  const totalMinutes = path.modules.reduce((sum, m) => sum + m.estimatedMinutes, 0)
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  return (
    <div className={cn('rounded-2xl border p-6 flex flex-col gap-4 transition-all', colors.bg)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', colors.icon)}>
          <Icon className="w-5 h-5" />
        </div>
        {isEnrolled && (
          <span className={cn('text-xs font-medium px-2 py-1 rounded-full', colors.badge)}>
            Enrolled
          </span>
        )}
      </div>

      {/* Title + desc */}
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-white text-lg leading-snug">
          {path.title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
          {path.description}
        </p>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {path.totalLessons} lessons
        </span>
        <span>{path.modules.length} modules</span>
      </div>

      {/* Progress bar (if enrolled) */}
      {isEnrolled && (
        <div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span>{path.completedLessons}/{path.totalLessons} lessons done</span>
            <span>{path.progressPercent}%</span>
          </div>
          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', colors.bar)}
              style={{ width: `${path.progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mt-auto pt-2">
        {isEnrolled ? (
          <Link href={`/learn/${path.slug}`}>
            <Button className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white">
              {hasProgress ? 'Continue Learning' : 'Start Learning'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        ) : (
          <Button
            onClick={() => onEnroll(path.slug)}
            disabled={enrolling}
            variant="outline"
            className="w-full"
          >
            {enrolling ? 'Enrolling...' : 'Enroll — Free'}
          </Button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/learn/LearningHub.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, GraduationCap } from 'lucide-react'
import { PathCard } from './PathCard'
import type { PathWithProgress } from '@/types/learn'

interface LearningHubProps {
  paths: PathWithProgress[]
}

export function LearningHub({ paths }: LearningHubProps) {
  const [enrollingSlug, setEnrollingSlug] = useState<string | null>(null)
  const router = useRouter()

  const handleEnroll = async (pathSlug: string) => {
    setEnrollingSlug(pathSlug)
    try {
      const res = await fetch('/api/learn/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathSlug }),
      })
      if (!res.ok) throw new Error('Enroll failed')
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setEnrollingSlug(null)
    }
  }

  const enrolledPaths = paths.filter((p) => p.enrollment)
  const availablePaths = paths.filter((p) => !p.enrollment)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-800 flex items-center justify-center shrink-0">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Learning Hub</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Structured PM curriculum — from zero to interview-ready. Pick a path and start learning.
          </p>
        </div>
      </div>

      {/* Enrolled paths */}
      {enrolledPaths.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Your Paths
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {enrolledPaths.map((path) => (
              <PathCard
                key={path.id}
                path={path}
                onEnroll={handleEnroll}
                enrolling={enrollingSlug === path.slug}
              />
            ))}
          </div>
        </section>
      )}

      {/* Available paths */}
      {availablePaths.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {enrolledPaths.length > 0 ? 'More Paths' : 'Choose a Path'}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {availablePaths.map((path) => (
              <PathCard
                key={path.id}
                path={path}
                onEnroll={handleEnroll}
                enrolling={enrollingSlug === path.slug}
              />
            ))}
          </div>
        </section>
      )}

      {paths.length === 0 && (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No learning paths available yet. Run the seed script to populate content.</p>
          <code className="text-xs mt-2 block">npx tsx scripts/generate-lesson-content.ts --seed-only</code>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/learn/PathCard.tsx src/components/learn/LearningHub.tsx
git commit -m "feat: add LearningHub and PathCard components"
```

---

### Task 14: PathOverview + ModuleCard + ProgressRing

**Files:**
- Create: `src/components/learn/ProgressRing.tsx`
- Create: `src/components/learn/ModuleCard.tsx`
- Create: `src/components/learn/PathOverview.tsx`

- [ ] **Step 1: Create `src/components/learn/ProgressRing.tsx`**

```typescript
interface ProgressRingProps {
  percent: number   // 0–100
  size?: number
  strokeWidth?: number
  color?: string
}

export function ProgressRing({
  percent,
  size = 40,
  strokeWidth = 4,
  color = '#2563eb',
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-slate-700 dark:text-slate-200">
        {Math.round(percent)}%
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/learn/ModuleCard.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { Clock, ChevronRight, CheckCircle2, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProgressRing } from './ProgressRing'
import type { ModuleWithProgress } from '@/types/learn'

interface ModuleCardProps {
  module: ModuleWithProgress
  pathSlug: string
  isLocked?: boolean
}

export function ModuleCard({ module, pathSlug, isLocked = false }: ModuleCardProps) {
  const completionPercent =
    module.totalCount > 0
      ? Math.round((module.completedCount / module.totalCount) * 100)
      : 0
  const isComplete = completionPercent === 100

  const card = (
    <div
      className={cn(
        'group flex items-center gap-4 p-4 rounded-xl border transition-all',
        isLocked
          ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 opacity-60 cursor-not-allowed'
          : isComplete
          ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-700'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm cursor-pointer'
      )}
    >
      {/* Progress ring */}
      <div className="shrink-0">
        {isComplete ? (
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        ) : isLocked ? (
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Lock className="w-4 h-4 text-slate-400" />
          </div>
        ) : (
          <ProgressRing percent={completionPercent} size={40} strokeWidth={4} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {module.weekNumber && (
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 shrink-0">
              Week {module.weekNumber}
            </span>
          )}
          <h3 className="font-medium text-slate-900 dark:text-white text-sm truncate">
            {module.title}
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
          {module.description}
        </p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {module.estimatedMinutes}m
          </span>
          <span>{module.completedCount}/{module.totalCount} lessons</span>
        </div>
      </div>

      {/* Arrow */}
      {!isLocked && (
        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors" />
      )}
    </div>
  )

  if (isLocked) return card

  return (
    <Link href={`/learn/${pathSlug}/${module.slug}`} className="block">
      {card}
    </Link>
  )
}
```

- [ ] **Step 3: Create `src/components/learn/PathOverview.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { ArrowLeft, BookMarked, Zap, Brain } from 'lucide-react'
import { ModuleCard } from './ModuleCard'
import { ProgressRing } from './ProgressRing'
import { Button } from '@/components/ui/button'
import type { PathWithProgress } from '@/types/learn'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BookMarked, Zap, Brain,
}

interface PathOverviewProps {
  path: PathWithProgress
}

export function PathOverview({ path }: PathOverviewProps) {
  const Icon = ICON_MAP[path.icon] ?? BookMarked

  // Find the first incomplete module for "Continue" CTA
  const nextModule = path.modules.find((m) => m.completedCount < m.totalCount)
  const firstLesson = nextModule?.lessons[0]

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/learn"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Learning Hub
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-800 flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{path.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">{path.description}</p>
        </div>
        <div className="shrink-0">
          <ProgressRing percent={path.progressPercent} size={56} strokeWidth={5} />
        </div>
      </div>

      {/* Progress summary */}
      <div className="flex items-center gap-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{path.completedLessons}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Completed</p>
        </div>
        <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{path.totalLessons - path.completedLessons}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Remaining</p>
        </div>
        <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{path.modules.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Modules</p>
        </div>
        {nextModule && firstLesson && (
          <div className="ml-auto">
            <Link href={`/learn/${path.slug}/${nextModule.slug}/${firstLesson.slug}`}>
              <Button className="bg-blue-800 hover:bg-blue-900 text-white text-sm">
                {path.completedLessons > 0 ? 'Continue' : 'Start'}
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Module list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Modules
        </h2>
        {path.modules.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            pathSlug={path.slug}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/components/learn/ProgressRing.tsx src/components/learn/ModuleCard.tsx src/components/learn/PathOverview.tsx
git commit -m "feat: add ProgressRing, ModuleCard, PathOverview components"
```

---

### Task 15: LessonContent + LessonView

**Files:**
- Create: `src/components/learn/LessonContent.tsx`
- Create: `src/components/learn/LessonView.tsx`

- [ ] **Step 1: Create `src/components/learn/LessonContent.tsx`**

```typescript
'use client'

import ReactMarkdown from 'react-markdown'
import { Lightbulb, CheckCircle2, MessageSquare } from 'lucide-react'

interface LessonContentProps {
  content: string
  keyTakeaways: string[]
  interviewTip: string | null
}

export function LessonContent({ content, keyTakeaways, interviewTip }: LessonContentProps) {
  return (
    <div className="space-y-6">
      {/* Main content — MDX rendered via react-markdown + prose */}
      <div className="prose prose-slate dark:prose-invert prose-sm max-w-none
        prose-headings:font-semibold prose-headings:text-slate-900 dark:prose-headings:text-white
        prose-p:text-slate-700 dark:prose-p:text-slate-300
        prose-strong:text-slate-900 dark:prose-strong:text-white
        prose-li:text-slate-700 dark:prose-li:text-slate-300
        prose-code:text-blue-700 dark:prose-code:text-blue-300 prose-code:bg-blue-50 dark:prose-code:bg-blue-950/30 prose-code:px-1 prose-code:rounded">
        {content ? (
          <ReactMarkdown>{content}</ReactMarkdown>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <p className="text-slate-400 dark:text-slate-500 text-sm italic">
              Content is being generated — check back in a moment or use the AI Tutor to learn this topic now.
            </p>
          </div>
        )}
      </div>

      {/* Key Takeaways */}
      {keyTakeaways.length > 0 && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Key Takeaways</h3>
          </div>
          <ul className="space-y-2">
            {keyTakeaways.map((takeaway, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-emerald-800 dark:text-emerald-200">
                <span className="text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5">•</span>
                {takeaway}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Interview Tip */}
      {interviewTip && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Interview Tip</h3>
          </div>
          <p className="text-sm text-amber-800 dark:text-amber-200">{interviewTip}</p>
        </div>
      )}

      {/* Practice Questions preview */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-4">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Practice Questions</h3>
        </div>
        <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
          Test yourself on this lesson — scroll down to the quiz.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/learn/LessonView.tsx`**

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle2, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LessonContent } from './LessonContent'
import { LessonQuiz } from './LessonQuiz'
import { PracticePrompt } from './PracticePrompt'
import { InlineTutor } from './InlineTutor'
import { cn } from '@/lib/utils'
import type { LessonWithProgress } from '@/types/learn'

interface LessonViewProps {
  lesson: LessonWithProgress
  pathSlug: string
  moduleSlug: string
  prevLesson: { slug: string; title: string } | null
  nextLesson: { slug: string; title: string } | null
}

export function LessonView({
  lesson,
  pathSlug,
  moduleSlug,
  prevLesson,
  nextLesson,
}: LessonViewProps) {
  const [isComplete, setIsComplete] = useState(!!lesson.progress?.completedAt)
  const [tutorOpen, setTutorOpen] = useState(false)
  const startTimeRef = useRef<number>(Date.now())

  const markComplete = async (quizScore?: number) => {
    const timeSpentMs = Date.now() - startTimeRef.current

    await fetch('/api/learn/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: lesson.id, quizScore, timeSpentMs }),
    })
    setIsComplete(true)
  }

  return (
    <div className="flex h-full">
      {/* Main content area */}
      <div className={cn('flex-1 overflow-y-auto transition-all duration-300', tutorOpen ? 'lg:mr-80' : '')}>
        <div className="p-6 max-w-3xl mx-auto space-y-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Link href="/learn" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Learn
            </Link>
            <span>/</span>
            <Link href={`/learn/${pathSlug}`} className="hover:text-slate-900 dark:hover:text-white transition-colors capitalize">
              {pathSlug.replace(/-/g, ' ')}
            </Link>
            <span>/</span>
            <Link href={`/learn/${pathSlug}/${moduleSlug}`} className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Module
            </Link>
          </div>

          {/* Lesson header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {isComplete && (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Completed
                  </span>
                )}
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {lesson.estimatedMinutes} min read
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{lesson.title}</h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTutorOpen(!tutorOpen)}
              className={cn(
                'shrink-0 gap-1.5',
                tutorOpen && 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
              )}
            >
              <Bot className="w-4 h-4" />
              AI Tutor
            </Button>
          </div>

          {/* Lesson content */}
          <LessonContent
            content={lesson.content}
            keyTakeaways={lesson.keyTakeaways}
            interviewTip={lesson.interviewTip}
          />

          {/* Quiz */}
          <LessonQuiz
            lessonTitle={lesson.title}
            practiceQuestions={lesson.practiceQuestions}
            isComplete={isComplete}
            onComplete={markComplete}
          />

          {/* Practice CTA */}
          <PracticePrompt lessonTitle={lesson.title} />

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            {prevLesson ? (
              <Link href={`/learn/${pathSlug}/${moduleSlug}/${prevLesson.slug}`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ArrowLeft className="w-4 h-4" />
                  {prevLesson.title}
                </Button>
              </Link>
            ) : (
              <div />
            )}
            {nextLesson ? (
              <Link href={`/learn/${pathSlug}/${moduleSlug}/${nextLesson.slug}`}>
                <Button size="sm" className="bg-blue-800 hover:bg-blue-900 text-white gap-1.5">
                  {nextLesson.title}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Link href={`/learn/${pathSlug}/${moduleSlug}`}>
                <Button size="sm" variant="outline" className="gap-1.5">
                  Back to Module
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Inline tutor sidebar */}
      {tutorOpen && (
        <div className="hidden lg:flex fixed right-0 top-0 bottom-0 w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-40 flex-col">
          <InlineTutor
            lessonId={lesson.id}
            lessonTitle={lesson.title}
            onClose={() => setTutorOpen(false)}
          />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/learn/LessonContent.tsx src/components/learn/LessonView.tsx
git commit -m "feat: add LessonContent and LessonView components"
```

---

### Task 16: TutorChat + InlineTutor

**Files:**
- Create: `src/components/learn/TutorChat.tsx`
- Create: `src/components/learn/InlineTutor.tsx`

- [ ] **Step 1: Create `src/components/learn/TutorChat.tsx`**

```typescript
'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Send, Bot, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { TutorMessage } from '@/types/learn'

interface TutorChatProps {
  lessonId?: string
  suggestedQuestions?: string[]
  className?: string
}

export function TutorChat({ lessonId, suggestedQuestions = [], className }: TutorChatProps) {
  const [messages, setMessages] = useState<TutorMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streaming, setStreaming] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: TutorMessage = { role: 'user', content: content.trim() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)
    setStreaming('')

    try {
      const response = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          lessonId,
        }),
      })

      if (!response.ok) throw new Error('Tutor request failed')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      let accumulated = ''
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            if (parsed.text) {
              accumulated += parsed.text
              setStreaming(accumulated)
            }
          } catch {
            // ignore parse errors
          }
        }
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: accumulated }])
      setStreaming('')
    } catch (err) {
      console.error(err)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ])
    } finally {
      setIsLoading(false)
      setStreaming('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) sendMessage(input)
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !streaming && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Ask me anything about this topic.
            </p>
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="w-full text-left text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn('flex gap-2.5', msg.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-blue-800 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm',
                msg.role === 'user'
                  ? 'bg-blue-800 text-white rounded-br-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm'
              )}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-li:my-0.5 prose-headings:mt-2 prose-headings:mb-1">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              </div>
            )}
          </div>
        ))}

        {/* Streaming */}
        {streaming && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-full bg-blue-800 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800">
              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1">
                <ReactMarkdown>{streaming}</ReactMarkdown>
                <span className="inline-block w-1 h-3.5 bg-blue-600 animate-pulse ml-0.5 align-text-bottom" />
              </div>
            </div>
          </div>
        )}

        {isLoading && !streaming && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-full bg-blue-800 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="rounded-2xl rounded-bl-sm px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800">
              <div className="flex gap-1 items-center h-5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-3">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question... (Ctrl+Enter)"
            className="min-h-[60px] max-h-[120px] resize-none text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="shrink-0 self-end bg-blue-800 hover:bg-blue-900 text-white h-9 w-9"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/learn/InlineTutor.tsx`**

```typescript
'use client'

import { X, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TutorChat } from './TutorChat'

interface InlineTutorProps {
  lessonId: string
  lessonTitle: string
  onClose: () => void
}

export function InlineTutor({ lessonId, lessonTitle, onClose }: InlineTutorProps) {
  const suggestedQuestions = [
    `Explain the core concept of "${lessonTitle}" in simple terms`,
    'How would this topic come up in a PM interview?',
    'Give me a real-world example of this in action',
    'What are common mistakes candidates make on this topic?',
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-800 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">AI Tutor</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{lessonTitle}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <TutorChat
          lessonId={lessonId}
          suggestedQuestions={suggestedQuestions}
          className="h-full"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/learn/TutorChat.tsx src/components/learn/InlineTutor.tsx
git commit -m "feat: add TutorChat and InlineTutor components with SSE streaming"
```

---

### Task 17: LessonQuiz + PracticePrompt

**Files:**
- Create: `src/components/learn/LessonQuiz.tsx`
- Create: `src/components/learn/PracticePrompt.tsx`

- [ ] **Step 1: Create `src/components/learn/LessonQuiz.tsx`**

This component uses the lesson's `practiceQuestions` (open-ended text prompts) as a self-reflection quiz.

```typescript
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface LessonQuizProps {
  lessonTitle: string
  practiceQuestions: string[]
  isComplete: boolean
  onComplete: (score?: number) => void
}

export function LessonQuiz({
  lessonTitle,
  practiceQuestions,
  isComplete,
  onComplete,
}: LessonQuizProps) {
  const [expanded, setExpanded] = useState(false)
  const [answers, setAnswers] = useState<string[]>(practiceQuestions.map(() => ''))
  const [submitted, setSubmitted] = useState(false)

  if (practiceQuestions.length === 0) {
    // No questions — just show a mark complete button
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {isComplete ? 'Lesson completed' : 'Mark this lesson as complete'}
          </span>
        </div>
        {!isComplete && (
          <Button
            size="sm"
            onClick={() => onComplete()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Mark Complete
          </Button>
        )}
        {isComplete && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Done
          </span>
        )}
      </div>
    )
  }

  const handleSubmit = () => {
    setSubmitted(true)
    // Self-reflection quiz — no scoring, just mark complete on submission
    onComplete()
  }

  const answeredCount = answers.filter((a) => a.trim().length > 20).length
  const canSubmit = answeredCount === practiceQuestions.length

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-sm font-medium text-slate-900 dark:text-white">
            Practice Questions ({practiceQuestions.length})
          </span>
          {isComplete && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Done
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="p-4 space-y-5">
          {practiceQuestions.map((question, i) => (
            <div key={i} className="space-y-2">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                <span className="text-slate-400 dark:text-slate-500 mr-2">{i + 1}.</span>
                {question}
              </p>
              <Textarea
                value={answers[i]}
                onChange={(e) => {
                  const updated = [...answers]
                  updated[i] = e.target.value
                  setAnswers(updated)
                }}
                placeholder="Write your answer here... Aim for 2-4 sentences with a clear structure."
                className="min-h-[90px] resize-none text-sm"
                disabled={submitted || isComplete}
              />
            </div>
          ))}

          {/* Tip */}
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">
            These are open-ended — there's no single right answer. Use them as interview practice.
            Write as you'd speak in an interview.
          </p>

          {/* Submit */}
          {!isComplete && !submitted && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {answeredCount}/{practiceQuestions.length} answered
              </span>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={cn(
                  'text-white',
                  canSubmit
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                )}
                size="sm"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Submit & Complete Lesson
              </Button>
            </div>
          )}

          {(isComplete || submitted) && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              Lesson complete! Great work.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/learn/PracticePrompt.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { MessageSquare, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PracticePromptProps {
  lessonTitle: string
}

// Maps lesson topics to the closest mock interview category
function getInterviewCategory(lessonTitle: string): string {
  const title = lessonTitle.toLowerCase()
  if (title.includes('metric') || title.includes('aarrr') || title.includes('north star')) return 'METRICS'
  if (title.includes('strategy') || title.includes('market') || title.includes('competitive')) return 'STRATEGY'
  if (title.includes('execut') || title.includes('roadmap') || title.includes('priorit')) return 'EXECUTION'
  if (title.includes('behavioral') || title.includes('star') || title.includes('leadership')) return 'BEHAVIORAL'
  if (title.includes('ai') || title.includes('llm') || title.includes('ml') || title.includes('rag')) return 'TECHNICAL_AI'
  if (title.includes('design') || title.includes('ux') || title.includes('user')) return 'PRODUCT_DESIGN'
  return 'PRODUCT_SENSE'
}

export function PracticePrompt({ lessonTitle }: PracticePromptProps) {
  const category = getInterviewCategory(lessonTitle)
  const categoryLabel = category.replace(/_/g, ' ').toLowerCase()

  return (
    <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shrink-0">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
            Ready to practice in a real interview?
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Start a mock interview focused on <span className="font-medium">{categoryLabel}</span> —
            the category that matches what you just learned.
          </p>
        </div>
        <Link
          href={`/mock-interview?category=${category}`}
          className="shrink-0"
        >
          <Button size="sm" className="bg-blue-800 hover:bg-blue-900 text-white gap-1.5 whitespace-nowrap">
            Practice Now
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/learn/LessonQuiz.tsx src/components/learn/PracticePrompt.tsx
git commit -m "feat: add LessonQuiz and PracticePrompt components"
```

---

*End of Part 3. Next: Part 4 — PlaybookRoadmap + SkillMastery + ReadinessBadge + all 6 pages.*

---

## Part 4 — Remaining Components + All Pages

### Task 18: PlaybookRoadmap

**Files:**
- Create: `src/components/learn/PlaybookRoadmap.tsx`

Visual 8-week timeline with progress indicators per week.

- [ ] **Step 1: Create `src/components/learn/PlaybookRoadmap.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { CheckCircle2, Circle, Lock, Clock, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ModuleWithProgress } from '@/types/learn'

interface PlaybookRoadmapProps {
  modules: ModuleWithProgress[]
  pathSlug: string
}

export function PlaybookRoadmap({ modules, pathSlug }: PlaybookRoadmapProps) {
  // Sort by weekNumber
  const weeks = [...modules].sort((a, b) => (a.weekNumber ?? 0) - (b.weekNumber ?? 0))

  return (
    <div className="space-y-4">
      {weeks.map((module, index) => {
        const isComplete = module.completedCount === module.totalCount && module.totalCount > 0
        const isInProgress = module.completedCount > 0 && !isComplete
        const prevModule = weeks[index - 1]
        const isPrevComplete =
          !prevModule ||
          (prevModule.completedCount === prevModule.totalCount && prevModule.totalCount > 0)
        const isUnlocked = index === 0 || isPrevComplete

        const firstUncompletedLesson = module.lessons.find((l) => !l.progress?.completedAt)
        const targetLesson = firstUncompletedLesson ?? module.lessons[0]

        return (
          <div key={module.id} className="flex gap-4">
            {/* Timeline spine */}
            <div className="flex flex-col items-center shrink-0 w-8">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10',
                  isComplete
                    ? 'bg-emerald-600 text-white'
                    : isInProgress
                    ? 'bg-blue-600 text-white'
                    : isUnlocked
                    ? 'bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 text-slate-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isUnlocked ? (
                  <span className="text-xs font-bold">{module.weekNumber}</span>
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
              </div>
              {index < weeks.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 flex-1 mt-1',
                    isComplete ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'
                  )}
                />
              )}
            </div>

            {/* Content card */}
            <div
              className={cn(
                'flex-1 mb-4 rounded-xl border p-4 transition-all',
                isComplete
                  ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/10'
                  : isInProgress
                  ? 'border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/10'
                  : isUnlocked
                  ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 opacity-60'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        'text-xs font-semibold uppercase tracking-wide',
                        isComplete
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isInProgress
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-400 dark:text-slate-500'
                      )}
                    >
                      Week {module.weekNumber}
                    </span>
                    {isInProgress && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        In Progress
                      </span>
                    )}
                    {isComplete && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Complete
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                    {module.title.replace(/^Week \d+ — /, '')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {module.description}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {module.estimatedMinutes}m
                    </span>
                    <span>
                      {module.completedCount}/{module.totalCount} lessons
                    </span>
                  </div>

                  {/* Progress bar */}
                  {isInProgress && (
                    <div className="mt-2 h-1 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.round((module.completedCount / module.totalCount) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* CTA */}
                {isUnlocked && targetLesson && (
                  <Link href={`/learn/${pathSlug}/${module.slug}/${targetLesson.slug}`}>
                    <button
                      className={cn(
                        'shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                        isComplete
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600'
                          : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/60'
                      )}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/learn/PlaybookRoadmap.tsx
git commit -m "feat: add PlaybookRoadmap component (8-week visual timeline)"
```

---

### Task 19: SkillMastery + ReadinessBadge

**Files:**
- Create: `src/components/learn/SkillMastery.tsx`
- Create: `src/components/learn/ReadinessBadge.tsx`

- [ ] **Step 1: Create `src/components/learn/SkillMastery.tsx`**

Radar-style breakdown of skill areas using Recharts.

```typescript
'use client'

import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts'
import type { LearnSkillArea } from '@/types/learn'

const AREA_LABELS: Record<LearnSkillArea, string> = {
  strategy: 'Strategy',
  execution: 'Execution',
  metrics: 'Metrics',
  behavioral: 'Behavioral',
  'ai-pm': 'AI-PM',
}

interface SkillMasteryProps {
  scores: Partial<Record<LearnSkillArea, number>>
}

export function SkillMastery({ scores }: SkillMasteryProps) {
  const areas: LearnSkillArea[] = ['strategy', 'execution', 'metrics', 'behavioral', 'ai-pm']

  const data = areas.map((area) => ({
    subject: AREA_LABELS[area],
    score: scores[area] ?? 0,
    fullMark: 100,
  }))

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Skill Mastery</h3>

      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#2563eb"
            fill="#2563eb"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Score list */}
      <div className="space-y-2">
        {areas.map((area) => {
          const score = scores[area] ?? 0
          const color =
            score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-400'
          return (
            <div key={area} className="flex items-center gap-3">
              <span className="text-xs text-slate-600 dark:text-slate-400 w-20 shrink-0">
                {AREA_LABELS[area]}
              </span>
              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${color}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-8 text-right">
                {score}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/learn/ReadinessBadge.tsx`**

```typescript
'use client'

import { Award, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReadinessCertification } from '@/types/learn'

const AREA_LABELS: Record<string, string> = {
  strategy: 'Strategy',
  execution: 'Execution',
  metrics: 'Metrics',
  behavioral: 'Behavioral',
  'ai-pm': 'AI-PM',
}

interface ReadinessBadgeProps {
  certification: ReadinessCertification
  pathTitle: string
}

export function ReadinessBadge({ certification, pathTitle }: ReadinessBadgeProps) {
  const { score, lessonScore, quizScore, mockScore, weakAreas, strongAreas } = certification

  const tier =
    score >= 85 ? { label: 'Excellent', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' } :
    score >= 70 ? { label: 'Strong', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' } :
    score >= 50 ? { label: 'Developing', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' } :
    { label: 'Building', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800' }

  const weakLabel = weakAreas.map((a) => AREA_LABELS[a] ?? a).join(', ')
  const strongLabel = strongAreas.map((a) => AREA_LABELS[a] ?? a).join(', ')

  return (
    <div className={cn('rounded-2xl border p-6 space-y-5', tier.bg)}>
      {/* Badge header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
          <Award className={cn('w-7 h-7', tier.color)} />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Readiness Score — {pathTitle}
          </p>
          <div className="flex items-end gap-2 mt-0.5">
            <span className={cn('text-4xl font-bold', tier.color)}>{score}</span>
            <span className="text-slate-400 dark:text-slate-500 text-sm mb-1">/100</span>
            <span className={cn('text-sm font-semibold mb-1', tier.color)}>{tier.label}</span>
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Lessons', value: lessonScore, weight: '30%' },
          { label: 'Quizzes', value: quizScore, weight: '30%' },
          { label: 'Mock Score', value: mockScore, weight: '40%' },
        ].map(({ label, value, weight }) => (
          <div
            key={label}
            className="text-center p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{weight}</p>
          </div>
        ))}
      </div>

      {/* Strengths + weaknesses */}
      <div className="space-y-3">
        {strongAreas.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <span className="text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5">✓</span>
            <span className="text-slate-700 dark:text-slate-300">
              <strong>Strong:</strong> {strongLabel}
            </span>
          </div>
        )}
        {weakAreas.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
            <span className="text-slate-700 dark:text-slate-300">
              <strong>To improve:</strong> {weakLabel} — take{' '}
              {weakAreas.length === 1 ? '2 more mock interviews' : 'targeted mock interviews'} in{' '}
              {weakAreas.length === 1 ? 'this area' : 'these areas'}.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/learn/SkillMastery.tsx src/components/learn/ReadinessBadge.tsx
git commit -m "feat: add SkillMastery and ReadinessBadge components"
```

---

### Task 20: Learning Hub Page

**Files:**
- Create: `src/app/(app)/learn/page.tsx`

Server component. Fetches all paths, enrollment, and progress, then builds `PathWithProgress[]`.

- [ ] **Step 1: Create `src/app/(app)/learn/page.tsx`**

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { LearningHub } from '@/components/learn/LearningHub'
import type { PathWithProgress, ModuleWithProgress, LessonWithProgress } from '@/types/learn'

export default async function LearnPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/signin')
  const userId = (session.user as { id?: string }).id!

  const [paths, enrollments, allProgress] = await Promise.all([
    prisma.learningPath.findMany({
      orderBy: { order: 'asc' },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: { lessons: { orderBy: { order: 'asc' } } },
        },
      },
    }),
    prisma.userPathEnrollment.findMany({ where: { userId } }),
    prisma.userLessonProgress.findMany({ where: { userId } }),
  ])

  const progressMap = new Map(allProgress.map((p) => [p.lessonId, p]))
  const enrollmentMap = new Map(enrollments.map((e) => [e.pathId, e]))

  const pathsWithProgress: PathWithProgress[] = paths.map((path) => {
    const enrollment = enrollmentMap.get(path.id) ?? null

    const modules: ModuleWithProgress[] = path.modules.map((mod) => {
      const lessons: LessonWithProgress[] = mod.lessons.map((lesson) => ({
        ...lesson,
        progress: progressMap.get(lesson.id) ?? null,
      }))
      const completedCount = lessons.filter((l) => l.progress?.completedAt).length
      return { ...mod, lessons, completedCount, totalCount: lessons.length }
    })

    const completedLessons = modules.reduce((sum, m) => sum + m.completedCount, 0)
    const totalLessons = modules.reduce((sum, m) => sum + m.totalCount, 0)
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

    return { ...path, modules, enrollment, completedLessons, totalLessons, progressPercent }
  })

  return <LearningHub paths={pathsWithProgress} />
}
```

- [ ] **Step 2: Verify build**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/learn/page.tsx
git commit -m "feat: add /learn Learning Hub page"
```

---

### Task 21: Open Tutor Page

**Files:**
- Create: `src/app/(app)/learn/tutor/page.tsx`

- [ ] **Step 1: Create `src/app/(app)/learn/tutor/page.tsx`**

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TutorChat } from '@/components/learn/TutorChat'
import { Bot, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function TutorPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/signin')

  const suggestedQuestions = [
    'What is the North Star Metric and how do I find one in an interview?',
    'Walk me through a RICE prioritization example',
    'Explain RAG vs fine-tuning for an AI product role interview',
    'How do I answer "why are metrics down 20%?" in an execution interview?',
    'What should I know about A/B testing for PM interviews?',
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <Link
          href="/learn"
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 dark:text-white">AI Tutor</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ask anything about PM concepts, frameworks, or interview prep
          </p>
        </div>
      </div>

      {/* Chat — takes remaining height */}
      <div className="flex-1 overflow-hidden max-w-2xl w-full mx-auto">
        <TutorChat suggestedQuestions={suggestedQuestions} className="h-full" />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/learn/tutor/page.tsx
git commit -m "feat: add /learn/tutor Open AI Tutor page"
```

---

### Task 22: Playbook Roadmap Page

**Files:**
- Create: `src/app/(app)/learn/playbook/page.tsx`

- [ ] **Step 1: Create `src/app/(app)/learn/playbook/page.tsx`**

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookMarked } from 'lucide-react'
import { PlaybookRoadmap } from '@/components/learn/PlaybookRoadmap'
import type { ModuleWithProgress, LessonWithProgress } from '@/types/learn'

export default async function PlaybookPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/signin')
  const userId = (session.user as { id?: string }).id!

  const path = await prisma.learningPath.findUnique({
    where: { slug: 'playbook' },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } },
      },
    },
  })

  if (!path) notFound()

  // Auto-enroll if not already enrolled
  await prisma.userPathEnrollment.upsert({
    where: { userId_pathId: { userId, pathId: path.id } },
    update: {},
    create: { userId, pathId: path.id },
  })

  const allProgress = await prisma.userLessonProgress.findMany({
    where: { userId },
  })
  const progressMap = new Map(allProgress.map((p) => [p.lessonId, p]))

  const modulesWithProgress: ModuleWithProgress[] = path.modules.map((mod) => {
    const lessons: LessonWithProgress[] = mod.lessons.map((lesson) => ({
      ...lesson,
      progress: progressMap.get(lesson.id) ?? null,
    }))
    const completedCount = lessons.filter((l) => l.progress?.completedAt).length
    return { ...mod, lessons, completedCount, totalCount: lessons.length }
  })

  const totalLessons = modulesWithProgress.reduce((s, m) => s + m.totalCount, 0)
  const completedLessons = modulesWithProgress.reduce((s, m) => s + m.completedCount, 0)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/learn"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Learning Hub
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-800 flex items-center justify-center shrink-0">
          <BookMarked className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{path.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{path.description}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {completedLessons} of {totalLessons} lessons complete
          </p>
        </div>
      </div>

      {/* Roadmap */}
      <PlaybookRoadmap modules={modulesWithProgress} pathSlug="playbook" />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/learn/playbook/page.tsx
git commit -m "feat: add /learn/playbook Playbook Roadmap page"
```

---

### Task 23: Track Overview Page

**Files:**
- Create: `src/app/(app)/learn/[track]/page.tsx`

- [ ] **Step 1: Create `src/app/(app)/learn/[track]/page.tsx`**

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PathOverview } from '@/components/learn/PathOverview'
import type { PathWithProgress, ModuleWithProgress, LessonWithProgress } from '@/types/learn'

interface Props {
  params: Promise<{ track: string }>
}

export default async function TrackPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/signin')
  const userId = (session.user as { id?: string }).id!

  const { track } = await params

  const path = await prisma.learningPath.findUnique({
    where: { slug: track },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } },
      },
      enrollments: { where: { userId } },
    },
  })

  if (!path) notFound()

  const allProgress = await prisma.userLessonProgress.findMany({ where: { userId } })
  const progressMap = new Map(allProgress.map((p) => [p.lessonId, p]))

  const modules: ModuleWithProgress[] = path.modules.map((mod) => {
    const lessons: LessonWithProgress[] = mod.lessons.map((lesson) => ({
      ...lesson,
      progress: progressMap.get(lesson.id) ?? null,
    }))
    const completedCount = lessons.filter((l) => l.progress?.completedAt).length
    return { ...mod, lessons, completedCount, totalCount: lessons.length }
  })

  const completedLessons = modules.reduce((s, m) => s + m.completedCount, 0)
  const totalLessons = modules.reduce((s, m) => s + m.totalCount, 0)
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  const enrollment = path.enrollments[0] ?? null

  const pathWithProgress: PathWithProgress = {
    ...path,
    modules,
    enrollment,
    completedLessons,
    totalLessons,
    progressPercent,
  }

  return <PathOverview path={pathWithProgress} />
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/learn/[track]/page.tsx"
git commit -m "feat: add /learn/[track] Track Overview page"
```

---

### Task 24: Module View Page

**Files:**
- Create: `src/app/(app)/learn/[track]/[module]/page.tsx`

Lists all lessons in a module with completion status and a CTA to the first uncompleted lesson.

- [ ] **Step 1: Create `src/app/(app)/learn/[track]/[module]/page.tsx`**

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Circle, Clock, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  params: Promise<{ track: string; module: string }>
}

export default async function ModulePage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/signin')
  const userId = (session.user as { id?: string }).id!

  const { track, module: moduleSlug } = await params

  const path = await prisma.learningPath.findUnique({ where: { slug: track } })
  if (!path) notFound()

  const mod = await prisma.learningModule.findUnique({
    where: { pathId_slug: { pathId: path.id, slug: moduleSlug } },
    include: { lessons: { orderBy: { order: 'asc' } } },
  })
  if (!mod) notFound()

  const lessonIds = mod.lessons.map((l) => l.id)
  const progressRecords = await prisma.userLessonProgress.findMany({
    where: { userId, lessonId: { in: lessonIds } },
  })
  const progressMap = new Map(progressRecords.map((p) => [p.lessonId, p]))

  const lessonsWithStatus = mod.lessons.map((lesson) => ({
    ...lesson,
    isComplete: !!progressMap.get(lesson.id)?.completedAt,
  }))

  const completedCount = lessonsWithStatus.filter((l) => l.isComplete).length
  const nextLesson = lessonsWithStatus.find((l) => !l.isComplete)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/learn" className="hover:text-slate-900 dark:hover:text-white transition-colors">Learn</Link>
        <span>/</span>
        <Link href={`/learn/${track}`} className="hover:text-slate-900 dark:hover:text-white transition-colors capitalize">
          {track.replace(/-/g, ' ')}
        </Link>
      </div>

      {/* Header */}
      <div>
        {mod.weekNumber && (
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
            Week {mod.weekNumber}
          </p>
        )}
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {mod.title.replace(/^Week \d+ — /, '')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">{mod.description}</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {mod.estimatedMinutes} min
          </span>
          <span>{completedCount}/{mod.lessons.length} lessons complete</span>
        </div>
      </div>

      {/* Progress bar */}
      {completedCount > 0 && (
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.round((completedCount / mod.lessons.length) * 100)}%` }}
          />
        </div>
      )}

      {/* Continue CTA */}
      {nextLesson && (
        <Link href={`/learn/${track}/${moduleSlug}/${nextLesson.slug}`}>
          <Button className="w-full sm:w-auto bg-blue-800 hover:bg-blue-900 text-white">
            {completedCount > 0 ? 'Continue' : 'Start'}: {nextLesson.title}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      )}

      {/* Lesson list */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Lessons
        </h2>
        {lessonsWithStatus.map((lesson, i) => (
          <Link
            key={lesson.id}
            href={`/learn/${track}/${moduleSlug}/${lesson.slug}`}
            className={cn(
              'flex items-center gap-4 p-4 rounded-xl border transition-all group',
              lesson.isComplete
                ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-300'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm'
            )}
          >
            <div className="shrink-0">
              {lesson.isComplete ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                <span className="text-slate-400 dark:text-slate-500 mr-2 text-xs">{i + 1}.</span>
                {lesson.title}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {lesson.estimatedMinutes} min
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/learn/[track]/[module]/page.tsx"
git commit -m "feat: add /learn/[track]/[module] Module View page"
```

---

### Task 25: Lesson View Page

**Files:**
- Create: `src/app/(app)/learn/[track]/[module]/[lesson]/page.tsx`

The most complex page — loads lesson, generates content on-demand if empty, renders `LessonView`.

- [ ] **Step 1: Create `src/app/(app)/learn/[track]/[module]/[lesson]/page.tsx`**

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { LessonView } from '@/components/learn/LessonView'
import { callClaude } from '@/lib/ai'
import { SYSTEM_PROMPTS } from '@/lib/ai-prompts'
import { retrieveChunksForLesson, buildTutorContext } from '@/lib/tutor'
import type { LessonWithProgress } from '@/types/learn'

interface Props {
  params: Promise<{ track: string; module: string; lesson: string }>
}

async function generateAndCacheContent(lessonId: string, lesson: {
  title: string
  keyTakeaways: string[]
  practiceQuestions: string[]
  interviewTip: string | null
  sourceRefs: string[]
}): Promise<string> {
  // Retrieve relevant source chunks
  const chunks = await retrieveChunksForLesson(lesson.title, lesson.sourceRefs).catch(() => [])
  const retrievedChunks = buildTutorContext(chunks)

  const content = await callClaude({
    systemPrompt: SYSTEM_PROMPTS.LESSON_GENERATOR({
      lessonTitle: lesson.title,
      keyTakeaways: lesson.keyTakeaways,
      practiceQuestions: lesson.practiceQuestions,
      interviewTip: lesson.interviewTip,
      sourceRefs: lesson.sourceRefs,
      retrievedChunks,
    }),
    userMessage: `Generate the lesson content for: "${lesson.title}"`,
    maxTokens: 2048,
  })

  // Cache it in the DB
  await prisma.learningLesson.update({
    where: { id: lessonId },
    data: { content },
  })

  return content
}

export default async function LessonPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/signin')
  const userId = (session.user as { id?: string }).id!

  const { track, module: moduleSlug, lesson: lessonSlug } = await params

  const path = await prisma.learningPath.findUnique({ where: { slug: track } })
  if (!path) notFound()

  const mod = await prisma.learningModule.findUnique({
    where: { pathId_slug: { pathId: path.id, slug: moduleSlug } },
    include: { lessons: { orderBy: { order: 'asc' } } },
  })
  if (!mod) notFound()

  const lessonIndex = mod.lessons.findIndex((l) => l.slug === lessonSlug)
  if (lessonIndex === -1) notFound()

  let lesson = mod.lessons[lessonIndex]

  // On-demand content generation: if lesson has no content, generate + cache it now
  if (!lesson.content || lesson.content.length < 50) {
    const generated = await generateAndCacheContent(lesson.id, {
      title: lesson.title,
      keyTakeaways: lesson.keyTakeaways,
      practiceQuestions: lesson.practiceQuestions,
      interviewTip: lesson.interviewTip,
      sourceRefs: lesson.sourceRefs,
    }).catch(() => '')

    if (generated) {
      lesson = { ...lesson, content: generated }
    }
  }

  // Load progress for this specific lesson
  const progress = await prisma.userLessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId: lesson.id } },
  })

  const lessonWithProgress: LessonWithProgress = { ...lesson, progress: progress ?? null }

  const prevLesson = lessonIndex > 0 ? mod.lessons[lessonIndex - 1] : null
  const nextLesson = lessonIndex < mod.lessons.length - 1 ? mod.lessons[lessonIndex + 1] : null

  return (
    <LessonView
      lesson={lessonWithProgress}
      pathSlug={track}
      moduleSlug={moduleSlug}
      prevLesson={prevLesson ? { slug: prevLesson.slug, title: prevLesson.title } : null}
      nextLesson={nextLesson ? { slug: nextLesson.slug, title: nextLesson.title } : null}
    />
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Run a full build to catch any compile errors across all new files**

```bash
npm run build
```

Expected: Build completes. If there are errors, fix them before committing.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/learn/[track]/[module]/[lesson]/page.tsx"
git commit -m "feat: add /learn/[track]/[module]/[lesson] Lesson View page (with on-demand content generation)"
```

---

*End of Part 4. Next: Part 5 — Integrations (Sidebar, MobileNav, Dashboard card, Panic Mode, Readiness score).*

---

## Part 5 — Integrations

### Task 26: Sidebar + MobileNav

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/MobileNav.tsx`

- [ ] **Step 1: Add Learn link to Sidebar**

In `src/components/layout/Sidebar.tsx`, add `BookMarked` to the import list and insert a nav item.

Find the import line:
```typescript
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
} from 'lucide-react'
```

Replace it with:
```typescript
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
```

Then find the `navItems` array and add the Learn entry after the `{ href: '/mock-interview/history', ... }` entry:
```typescript
  { href: '/learn', label: 'Learn', icon: BookMarked, badge: 'NEW' },
```

Then find the badge rendering block in the JSX (inside the `map`) and add handling for the `'NEW'` badge alongside the existing `'FLAGSHIP'` badge:
```typescript
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
```

- [ ] **Step 2: Add Learn link to MobileNav**

In `src/components/layout/MobileNav.tsx`, add `BookMarked` to the import list:
```typescript
import {
  LayoutDashboard,
  MessageSquare,
  Zap,
  TrendingUp,
  MoreHorizontal,
  BookMarked,
} from 'lucide-react'
```

Then add Learn to `mobileNavItems` (insert after the Interview item):
```typescript
  { href: '/learn', label: 'Learn', icon: BookMarked },
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Sidebar.tsx src/components/layout/MobileNav.tsx
git commit -m "feat: add Learn link to Sidebar and MobileNav"
```

---

### Task 27: Dashboard — ResumeLearningCard

**Files:**
- Create: `src/components/learn/ResumeLearningCard.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Create `src/components/learn/ResumeLearningCard.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { BookMarked, ChevronRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ResumeLearningCardProps {
  pathTitle: string
  pathSlug: string
  moduleTitle: string
  lessonTitle: string
  lessonSlug: string
  moduleSlug: string
  completedLessons: number
  totalLessons: number
}

export function ResumeLearningCard({
  pathTitle,
  pathSlug,
  moduleTitle,
  lessonTitle,
  lessonSlug,
  moduleSlug,
  completedLessons,
  totalLessons,
}: ResumeLearningCardProps) {
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Resume Learning</h3>
        </div>
        <Link href="/learn" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
          All paths
        </Link>
      </div>

      {/* Path + lesson info */}
      <div>
        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
          {pathTitle}
        </p>
        <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5 truncate">
          {lessonTitle}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          {moduleTitle}
        </p>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mb-1.5">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            {completedLessons}/{totalLessons} lessons
          </span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* CTA */}
      <Link href={`/learn/${pathSlug}/${moduleSlug}/${lessonSlug}`}>
        <Button className="w-full bg-blue-800 hover:bg-blue-900 text-white text-sm gap-1.5">
          Continue Lesson
          <ChevronRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: Add ResumeLearningCard to the dashboard page**

In `src/app/(app)/dashboard/page.tsx`, add the import at the top of the file alongside the other imports:
```typescript
import { ResumeLearningCard } from '@/components/learn/ResumeLearningCard'
```

In the `Promise.all` data-fetching block, add a new query for active learning enrollment (add as the 7th item in the array):
```typescript
    prisma.userPathEnrollment.findFirst({
      where: { userId, completedAt: null },
      orderBy: { startedAt: 'desc' },
      include: {
        path: {
          select: {
            slug: true,
            title: true,
            modules: {
              orderBy: { order: 'asc' },
              include: { lessons: { orderBy: { order: 'asc' } } },
            },
          },
        },
      },
    }),
```

Update the destructuring to capture it (add `activeEnrollment` as the 7th variable):
```typescript
  const [user, progressEntries, mockSessions, stories, streakData, targetCompanies, activeEnrollment] =
    await Promise.all([...])
```

Then, inside the returned JSX, find the `{/* Bottom row */}` comment and add `ResumeLearningCard` before it. Compute the required props inline (add this block right before the `{/* Bottom row */}` section):

```typescript
      {/* Resume Learning card — only shown when user has an active enrollment */}
      {(() => {
        if (!activeEnrollment) return null
        const path = activeEnrollment.path
        // Find the first incomplete lesson across all modules
        const allProgress = progressEntries
          .filter((e) => e.activity === 'LESSON_COMPLETE')
          .map((e) => (e.metadata as Record<string, string> | null)?.lessonId)
          .filter(Boolean) as string[]
        const completedSet = new Set(allProgress)
        let nextLesson: { slug: string; title: string } | null = null
        let nextModule: { slug: string; title: string } | null = null
        let completedLessons = 0
        let totalLessons = 0
        for (const mod of path.modules) {
          for (const lesson of mod.lessons) {
            totalLessons++
            if (completedSet.has(lesson.id)) {
              completedLessons++
            } else if (!nextLesson) {
              nextLesson = lesson
              nextModule = mod
            }
          }
        }
        if (!nextLesson || !nextModule) return null
        return (
          <ResumeLearningCard
            pathTitle={path.title}
            pathSlug={path.slug}
            moduleTitle={nextModule.title}
            lessonTitle={nextLesson.title}
            lessonSlug={nextLesson.slug}
            moduleSlug={nextModule.slug}
            completedLessons={completedLessons}
            totalLessons={totalLessons}
          />
        )
      })()}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/learn/ResumeLearningCard.tsx src/app/(app)/dashboard/page.tsx
git commit -m "feat: add ResumeLearningCard to dashboard for active learning enrollments"
```

---

### Task 28: Panic Mode Integration

**Files:**
- Modify: `src/app/(app)/panic-mode/page.tsx`

Panic Mode's one-pager pulls from lessons the user has completed, so it can personalize the review content.

- [ ] **Step 1: Read the current panic mode page**

Before editing, read the file:

```bash
cat src/app/(app)/panic-mode/page.tsx
```

- [ ] **Step 2: Add completed lesson topics to the panic mode prompt context**

In `src/app/(app)/panic-mode/page.tsx`, find where the user profile is assembled to pass to `SYSTEM_PROMPTS.PANIC_MODE(profile, company)`.

Add this query to the existing `Promise.all` data fetch (alongside whatever other queries are there):
```typescript
    prisma.userLessonProgress.findMany({
      where: { userId, completedAt: { not: null } },
      include: {
        lesson: { select: { title: true, keyTakeaways: true } },
      },
      orderBy: { completedAt: 'desc' },
      take: 20,
    }),
```

Then when building the profile string that gets passed to `SYSTEM_PROMPTS.PANIC_MODE`, append the completed topics:
```typescript
const completedTopics = completedLessons
  .slice(0, 10)
  .map((p) => p.lesson.title)
  .join(', ')

// Append to the existing profile string used in the PANIC_MODE prompt:
// profile = `...existing profile content...\nCompleted learning topics: ${completedTopics}`
```

The exact insertion point depends on how the profile string is currently built in the file — read it first (Step 1) to find the right location.

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/panic-mode/page.tsx
git commit -m "feat: inject completed lesson topics into Panic Mode profile context"
```

---

### Task 29: Readiness Score — Learn Contribution

**Files:**
- Create: `src/lib/learn-readiness.ts`
- Modify: `src/app/(app)/progress/page.tsx`

Computes the `ReadinessCertification` for a completed path and surfaces the `ReadinessBadge` on the progress page.

- [ ] **Step 1: Create `src/lib/learn-readiness.ts`**

```typescript
import type { ReadinessCertification, LearnSkillArea } from '@/types/learn'

interface LessonProgressData {
  completedAt: Date | null
  quizScore: number | null
  lesson: {
    title: string
    sourceRefs: string[]
  }
}

interface MockScoreData {
  category: string
  overallScore: number | null
}

// Maps source refs to skill areas
function inferSkillArea(sourceRefs: string[]): LearnSkillArea {
  const refs = sourceRefs.join(' ').toLowerCase()
  if (refs.includes('module-5') || refs.includes('kellogg-module-5')) return 'ai-pm'
  if (refs.includes('ch2') || refs.includes('module-2') || refs.includes('module-9')) return 'strategy'
  if (refs.includes('ch5') || refs.includes('module-4') || refs.includes('module-8')) return 'execution'
  if (refs.includes('ch9') || refs.includes('module-6') || refs.includes('module-7')) return 'metrics'
  return 'behavioral'
}

// Maps interview categories to skill areas
function categoryToSkillArea(category: string): LearnSkillArea {
  const map: Record<string, LearnSkillArea> = {
    STRATEGY: 'strategy',
    EXECUTION: 'execution',
    METRICS: 'metrics',
    BEHAVIORAL: 'behavioral',
    TECHNICAL_AI: 'ai-pm',
    ML_SYSTEM_DESIGN: 'ai-pm',
    AI_ETHICS: 'ai-pm',
    PRODUCT_SENSE: 'execution',
    ESTIMATION: 'metrics',
    PRODUCT_DESIGN: 'execution',
  }
  return map[category] ?? 'execution'
}

export function computeReadinessCertification(
  lessonProgress: LessonProgressData[],
  mockScores: MockScoreData[],
  totalLessons: number
): ReadinessCertification {
  const completedLessons = lessonProgress.filter((p) => p.completedAt).length

  // Lesson score: % of lessons completed (0–100)
  const lessonScore = totalLessons > 0
    ? Math.round((completedLessons / totalLessons) * 100)
    : 0

  // Quiz score: average of non-null quiz scores (0–100)
  const quizScores = lessonProgress
    .filter((p) => p.quizScore !== null)
    .map((p) => p.quizScore as number)
  const quizScore = quizScores.length > 0
    ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
    : 0

  // Mock score: average of completed mock sessions in relevant categories (0–100)
  const relevantMockScores = mockScores
    .filter((s) => s.overallScore !== null)
    .map((s) => s.overallScore as number)
  const mockScore = relevantMockScores.length > 0
    ? Math.round(relevantMockScores.reduce((a, b) => a + b, 0) / relevantMockScores.length)
    : 0

  // Composite score: lessons 30% + quiz 30% + mock 40%
  const score = Math.round(lessonScore * 0.3 + quizScore * 0.3 + mockScore * 0.4)

  // Per skill area scores
  const areaScores: Record<LearnSkillArea, number[]> = {
    strategy: [],
    execution: [],
    metrics: [],
    behavioral: [],
    'ai-pm': [],
  }

  for (const p of lessonProgress) {
    if (p.completedAt && p.quizScore !== null) {
      const area = inferSkillArea(p.lesson.sourceRefs)
      areaScores[area].push(p.quizScore)
    }
  }

  for (const m of mockScores) {
    if (m.overallScore !== null) {
      const area = categoryToSkillArea(m.category)
      areaScores[area].push(m.overallScore)
    }
  }

  const areas: LearnSkillArea[] = ['strategy', 'execution', 'metrics', 'behavioral', 'ai-pm']
  const avgAreaScores = areas.map((area) => {
    const scores = areaScores[area]
    return {
      area,
      avg: scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 50, // neutral default if no data
    }
  })

  const sorted = [...avgAreaScores].sort((a, b) => a.avg - b.avg)
  const weakAreas = sorted.slice(0, 2).filter((a) => a.avg < 70).map((a) => a.area)
  const strongAreas = sorted.slice(-2).filter((a) => a.avg >= 70).map((a) => a.area)

  return { score, lessonScore, quizScore, mockScore, weakAreas, strongAreas }
}
```

- [ ] **Step 2: Add ReadinessBadge to the progress page**

Read the current file first:
```bash
cat src/app/(app)/progress/page.tsx
```

Then add the following to the existing data fetch in `src/app/(app)/progress/page.tsx`:

**New imports to add at the top:**
```typescript
import { computeReadinessCertification } from '@/lib/learn-readiness'
import { ReadinessBadge } from '@/components/learn/ReadinessBadge'
```

**New query to add to the `Promise.all`:**
```typescript
    // Learn module: enrollment + lesson progress for readiness badge
    prisma.userPathEnrollment.findFirst({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      include: {
        path: {
          select: {
            title: true,
            modules: {
              include: {
                lessons: {
                  select: { id: true, sourceRefs: true, title: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.userLessonProgress.findMany({
      where: { userId },
      include: {
        lesson: { select: { title: true, sourceRefs: true } },
      },
    }),
```

**After the data fetch, compute the certification:**
```typescript
  const certification = activeEnrollment
    ? computeReadinessCertification(
        lessonProgressAll,
        mockSessions.map((s: { category: string; overallScore: number | null }) => ({
          category: s.category,
          overallScore: s.overallScore,
        })),
        activeEnrollment.path.modules.reduce(
          (sum: number, m: { lessons: unknown[] }) => sum + m.lessons.length,
          0
        )
      )
    : null
```

**In the JSX, add the badge (find a natural spot like after the readiness gauge or at the top of a section):**
```typescript
      {certification && activeEnrollment && (
        <ReadinessBadge
          certification={certification}
          pathTitle={activeEnrollment.path.title}
        />
      )}
```

The exact placement depends on the current structure of the progress page — read it first (Step 2 reads it) to find the right insertion point.

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Run full build**

```bash
npm run build
```

Expected: build succeeds with no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/learn-readiness.ts src/app/(app)/progress/page.tsx
git commit -m "feat: add learn readiness score computation and ReadinessBadge on progress page"
```

---

### Task 30: Final Build + Verification

- [ ] **Step 1: Ensure all new env vars are documented**

Add the following to your `.env.example` (or equivalent), if you have one:

```bash
# Required for RAG embeddings + ingest script
OPENAI_API_KEY=sk-...
```

- [ ] **Step 2: Run full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: build succeeds. All pages compile. No missing module errors.

- [ ] **Step 4: Run database seed (curriculum structure)**

```bash
npx tsx scripts/generate-lesson-content.ts --seed-only
```

Expected output ends with: `Structure seeding complete.`

- [ ] **Step 5: Verify learn routes are accessible**

Start the dev server and manually verify:

```bash
npm run dev
```

Check:
- `http://localhost:3000/learn` — shows Learning Hub with 3 path cards
- `http://localhost:3000/learn/playbook` — shows 8-week roadmap
- `http://localhost:3000/learn/playbook/week-1-what-is-pm` — shows module lesson list
- `http://localhost:3000/learn/playbook/week-1-what-is-pm/pm-role-defined` — shows lesson view (content generates on first visit)
- `http://localhost:3000/learn/tutor` — shows open AI tutor chat

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "feat: complete Learn Module — 3 paths, 60 lessons, RAG tutor, progress tracking, dashboard + sidebar integrations"
```

---

## File Map Summary

| File | Status | Purpose |
|------|--------|---------|
| `prisma/schema.prisma` | Modify | Add pgvector + 6 new models |
| `src/types/learn.ts` | Create | All TypeScript types |
| `src/types/index.ts` | Modify | Re-export learn types |
| `src/lib/learn-data.ts` | Create | Static curriculum (3 paths, ~60 lessons) |
| `src/lib/ai-prompts.ts` | Modify | Add TUTOR + LESSON_GENERATOR prompts |
| `src/lib/tutor.ts` | Create | RAG pipeline (embed → retrieve → context) |
| `src/lib/learn-readiness.ts` | Create | Readiness score computation |
| `src/app/api/ai/tutor/route.ts` | Create | Streaming RAG tutor endpoint |
| `src/app/api/learn/progress/route.ts` | Create | Mark lesson complete + quiz score |
| `src/app/api/learn/enroll/route.ts` | Create | Path enrollment |
| `src/app/api/learn/diagnostic/route.ts` | Create | Diagnostic quiz scoring |
| `scripts/ingest-content.ts` | Create | PDF → pgvector ingestion |
| `scripts/generate-lesson-content.ts` | Create | Curriculum seed + AI content gen |
| `src/components/learn/PathCard.tsx` | Create | Path card with enrollment CTA |
| `src/components/learn/LearningHub.tsx` | Create | Hub grid (enrolled + available) |
| `src/components/learn/ProgressRing.tsx` | Create | SVG progress ring |
| `src/components/learn/ModuleCard.tsx` | Create | Module card (locked/in-progress/done) |
| `src/components/learn/PathOverview.tsx` | Create | Track module list + continue CTA |
| `src/components/learn/LessonContent.tsx` | Create | Markdown renderer + takeaways + tip |
| `src/components/learn/LessonView.tsx` | Create | Full lesson layout + tutor toggle |
| `src/components/learn/TutorChat.tsx` | Create | SSE chat UI (reusable) |
| `src/components/learn/InlineTutor.tsx` | Create | Sidebar tutor wrapper |
| `src/components/learn/LessonQuiz.tsx` | Create | Self-reflection quiz + mark complete |
| `src/components/learn/PracticePrompt.tsx` | Create | CTA → mock interview |
| `src/components/learn/PlaybookRoadmap.tsx` | Create | 8-week visual timeline |
| `src/components/learn/SkillMastery.tsx` | Create | Recharts radar skill breakdown |
| `src/components/learn/ReadinessBadge.tsx` | Create | Readiness score card |
| `src/components/learn/ResumeLearningCard.tsx` | Create | Dashboard resume-learning widget |
| `src/app/(app)/learn/page.tsx` | Create | Learning Hub page |
| `src/app/(app)/learn/tutor/page.tsx` | Create | Open tutor page |
| `src/app/(app)/learn/playbook/page.tsx` | Create | Playbook roadmap page |
| `src/app/(app)/learn/[track]/page.tsx` | Create | Track overview page |
| `src/app/(app)/learn/[track]/[module]/page.tsx` | Create | Module view page |
| `src/app/(app)/learn/[track]/[module]/[lesson]/page.tsx` | Create | Lesson view page |
| `src/components/layout/Sidebar.tsx` | Modify | Add Learn nav item |
| `src/components/layout/MobileNav.tsx` | Modify | Add Learn nav item |
| `src/app/(app)/dashboard/page.tsx` | Modify | Add ResumeLearningCard |
| `src/app/(app)/panic-mode/page.tsx` | Modify | Inject completed lesson topics |
| `src/app/(app)/progress/page.tsx` | Modify | Add ReadinessBadge |
