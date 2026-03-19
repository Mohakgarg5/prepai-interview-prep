# Interview Prep Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack AI-powered Interview Preparation Platform for PM/AI-PM roles covering the entire interview lifecycle.

**Architecture:** Next.js 14 App Router with TypeScript; PostgreSQL via Prisma for persistence; NextAuth for auth; Anthropic Claude API (streaming) for all AI features; Zustand for client-side interview session state.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Anthropic Claude API (`claude-sonnet-4-20250514`), PostgreSQL, Prisma, NextAuth.js, Zustand

**PRD:** `/Users/mohakgarg/Desktop/DRRC Documents/interview-prep-tool-prd.md`

---

## Phase 1 — Foundation

### Task 1: Project Initialization

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `tailwind.config.ts`
- Create: `.env.local`
- Create: `.env.example`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd "/Users/mohakgarg/Desktop/Interview prep"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

- [ ] **Step 2: Install core dependencies**

```bash
npm install @prisma/client prisma next-auth @auth/prisma-adapter zustand @anthropic-ai/sdk
npm install lucide-react class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-progress @radix-ui/react-checkbox @radix-ui/react-slider @radix-ui/react-avatar
npm install recharts date-fns
npm install -D @types/node
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init
# Select: Default style, Slate base color, CSS variables yes
```

- [ ] **Step 4: Add shadcn components**

```bash
npx shadcn@latest add button card badge input textarea select dialog tabs toast progress skeleton avatar separator
```

- [ ] **Step 5: Create .env.local**

```env
DATABASE_URL="postgresql://user:password@localhost:5432/interview_prep"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
ANTHROPIC_API_KEY=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

- [ ] **Step 6: Verify app runs**

```bash
npm run dev
```
Expected: No errors, default Next.js page at localhost:3000

---

### Task 2: Prisma Schema + Database

**Files:**
- Create: `prisma/schema.prisma`

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init
```

- [ ] **Step 2: Write schema** (exact schema from PRD Section 3 — copy verbatim)

- [ ] **Step 3: Run migration**

```bash
npx prisma migrate dev --name init
```
Expected: Migration created, tables created in DB

- [ ] **Step 4: Create Prisma client singleton**

`src/lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 5: Verify Prisma Studio**

```bash
npx prisma studio
```
Expected: Studio opens showing all tables

---

### Task 3: NextAuth Setup

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create auth config** (`src/lib/auth.ts`)

```typescript
import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    newUser: '/onboarding',
  },
}
```

- [ ] **Step 2: Create route handler** (`src/app/api/auth/[...nextauth]/route.ts`)

```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

- [ ] **Step 3: Create SessionProvider wrapper** (`src/components/providers.tsx`)

```typescript
'use client'
import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

- [ ] **Step 4: Add Providers to root layout** (`src/app/layout.tsx`)

---

### Task 4: Shared Types + Constants + Utils

**Files:**
- Create: `src/types/index.ts`
- Create: `src/lib/constants.ts`
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Create shared types** (`src/types/index.ts`)

Include: `InterviewCategory`, `Difficulty`, `TargetRole`, `ExperienceLevel`, AI response types for feedback, story, teardown, debrief.

- [ ] **Step 2: Create constants** (`src/lib/constants.ts`)

Include: `INTERVIEW_CATEGORIES`, `DIFFICULTY_LEVELS`, `BEHAVIORAL_THEMES`, `TEARDOWN_MODES`, `COMPANY_LIST` (pre-loaded companies), `FRAMEWORKS_DATA` (for knowledge library).

- [ ] **Step 3: Create utils** (`src/lib/utils.ts`)

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string { ... }
export function daysUntil(date: Date): number { ... }
export function calculateReadinessScore(data: ReadinessData): number { ... }
```

---

### Task 5: Claude API Wrapper + System Prompts

**Files:**
- Create: `src/lib/ai.ts`
- Create: `src/lib/ai-prompts.ts`

- [ ] **Step 1: Create AI wrapper** (`src/lib/ai.ts`)

```typescript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-4-20250514'

export async function callClaude({ systemPrompt, userMessage, maxTokens = 4096, tools }: AIRequestOptions) {
  // non-streaming version
}

export async function streamClaude({ systemPrompt, messages, maxTokens = 4096 }: StreamOptions) {
  // streaming version returning ReadableStream
}

export async function callClaudeWithSearch({ systemPrompt, userMessage }: AIRequestOptions) {
  // version with web_search_20250305 tool
}
```

- [ ] **Step 2: Create system prompts** (`src/lib/ai-prompts.ts`) — copy all prompts from PRD Section 10

- [ ] **Step 3: Test Claude connection** — create a simple test route `src/app/api/test-ai/route.ts` and hit it

---

### Task 6: Root Layout + Navigation

**Files:**
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/Navbar.tsx`
- Create: `src/components/layout/MobileNav.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Build Sidebar** (`src/components/layout/Sidebar.tsx`)

Nav items: Dashboard, Mock Interview, Stories, Knowledge, Teardown, Company Prep, Jobs, Panic Mode, Debrief, Progress, Settings. Each with icon from lucide-react. Active state highlighting.

- [ ] **Step 2: Build Navbar** with user avatar, streak counter placeholder, sign out

- [ ] **Step 3: Build authenticated layout wrapper**

Pages under `/dashboard`, `/mock-interview`, etc. use a shared layout with Sidebar + Navbar. Landing page and `/onboarding` use a minimal layout.

- [ ] **Step 4: Create `(app)` route group** for authenticated pages

Move all feature pages under `src/app/(app)/` with a shared layout.tsx that checks auth and redirects to `/` if not signed in.

---

### Task 7: Landing Page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Build landing page sections** per PRD Section 12:
  - Hero with CTA
  - Problem statement
  - 3-column feature highlights
  - How it works (4 steps)
  - Feature deep-dive accordions
  - Social proof placeholders
  - Footer

- [ ] **Step 2: Apply design system** — blue #1E40AF primary, emerald #059669 secondary, amber #D97706 accent

---

### Task 8: Onboarding Wizard

**Files:**
- Create: `src/app/onboarding/page.tsx`
- Create: `src/components/onboarding/OnboardingWizard.tsx`
- Create: `src/components/onboarding/steps/RoleStep.tsx`
- Create: `src/components/onboarding/steps/ExperienceStep.tsx`
- Create: `src/components/onboarding/steps/CompaniesStep.tsx`
- Create: `src/components/onboarding/steps/TimelineStep.tsx`
- Create: `src/app/api/user/onboarding/route.ts`

- [ ] **Step 1: Build 4-step wizard shell** with progress bar, step navigation

- [ ] **Step 2: Step 1 — Role selection** (4 cards with descriptions)

- [ ] **Step 3: Step 2 — Experience level** (slider or card grid)

- [ ] **Step 4: Step 3 — Target companies** (searchable multi-select from COMPANY_LIST)

- [ ] **Step 5: Step 4 — Timeline + weak areas** (date picker + checkbox grid)

- [ ] **Step 6: Create API route** to save onboarding data to User model

- [ ] **Step 7: Redirect to /dashboard on completion**

---

### Task 9: Dashboard

**Files:**
- Create: `src/app/(app)/dashboard/page.tsx`
- Create: `src/components/dashboard/ReadinessGauge.tsx`
- Create: `src/components/dashboard/StreakCounter.tsx`
- Create: `src/components/dashboard/QuickActionGrid.tsx`
- Create: `src/components/dashboard/ProgressSnapshot.tsx`
- Create: `src/components/dashboard/DailyRecommendation.tsx`
- Create: `src/components/dashboard/RecentActivity.tsx`

- [ ] **Step 1: Build dashboard page** with server-side data fetching for user profile + progress

- [ ] **Step 2: ReadinessGauge** — circular progress ring, color coded (red/yellow/green)

- [ ] **Step 3: StreakCounter** — fire icon + streak number

- [ ] **Step 4: DailyRecommendation** — personalized card based on weak areas + interview date

- [ ] **Step 5: QuickActionGrid** — 2x3 cards, Panic Mode highlighted if interview < 48h

- [ ] **Step 6: ProgressSnapshot** — mini bar chart (use recharts) for category coverage

- [ ] **Step 7: RecentActivity** — last 5 activities from ProgressEntry table

---

## Phase 2 — Core Features

### Task 10: Mock Interview — Pre-Session Setup

**Files:**
- Create: `src/app/(app)/mock-interview/page.tsx`
- Create: `src/components/mock-interview/CategorySelector.tsx`
- Create: `src/components/mock-interview/DifficultyPicker.tsx`
- Create: `src/app/api/mock-interview/sessions/route.ts`

- [ ] **Step 1: Build setup screen** with category cards, difficulty picker, company context dropdown, timed mode toggle

- [ ] **Step 2: Create session via API** — POST to `/api/mock-interview/sessions` creates MockSession in DB, returns sessionId

- [ ] **Step 3: Redirect to `/mock-interview/[sessionId]`** after creation

---

### Task 11: Mock Interview — Active Session (Flagship)

**Files:**
- Create: `src/app/(app)/mock-interview/[sessionId]/page.tsx`
- Create: `src/components/mock-interview/ChatInterface.tsx`
- Create: `src/components/mock-interview/MessageBubble.tsx`
- Create: `src/components/mock-interview/FeedbackCard.tsx`
- Create: `src/components/mock-interview/TimerBar.tsx`
- Create: `src/components/mock-interview/HintButton.tsx`
- Create: `src/store/interview-store.ts`
- Create: `src/app/api/ai/mock-interview/start/route.ts`
- Create: `src/app/api/ai/mock-interview/respond/route.ts`
- Create: `src/app/api/ai/mock-interview/hint/route.ts`
- Create: `src/app/api/ai/mock-interview/summary/route.ts`

- [ ] **Step 1: Create Zustand store** for interview state (messages, currentQuestion, sessionPhase, timer)

- [ ] **Step 2: Build ChatInterface** with scrollable message list, input area, submit/hint/done buttons

- [ ] **Step 3: Build MessageBubble** — different styles for INTERVIEWER / CANDIDATE / FEEDBACK / HINT roles

- [ ] **Step 4: Build FeedbackCard** — expandable card showing scores (structure/clarity/depth/creativity) + strengths/improvements

- [ ] **Step 5: Build TimerBar** — top progress bar, yellow at 1min, red at 30sec

- [ ] **Step 6: `/api/ai/mock-interview/start`** — streaming response, uses MOCK_INTERVIEWER prompt, saves first message to DB

- [ ] **Step 7: `/api/ai/mock-interview/respond`** — takes conversation history, determines if should ask follow-up or give feedback (based on message count), streams response

- [ ] **Step 8: `/api/ai/mock-interview/hint`** — returns a non-streaming hint

- [ ] **Step 9: Story suggestion integration** — when category is BEHAVIORAL, fetch user's stories and show subtle suggestion panel

- [ ] **Step 10: Session completion** — POST to `/api/ai/mock-interview/summary`, saves scores to MockSession, redirects to summary

---

### Task 12: Mock Interview — History + Session Summary

**Files:**
- Create: `src/app/(app)/mock-interview/history/page.tsx`
- Create: `src/components/mock-interview/SessionSummary.tsx`

- [ ] **Step 1: History page** — paginated list of past sessions with scores, filterable by category

- [ ] **Step 2: SessionSummary component** — shown at end of session with aggregate scores, radar chart, key insights

---

### Task 13: Behavioral Story Bank

**Files:**
- Create: `src/app/(app)/stories/page.tsx`
- Create: `src/app/(app)/stories/new/page.tsx`
- Create: `src/app/(app)/stories/[storyId]/page.tsx`
- Create: `src/components/stories/StoryCard.tsx`
- Create: `src/components/stories/StoryForm.tsx`
- Create: `src/components/stories/STAREditor.tsx`
- Create: `src/components/stories/ThemeTag.tsx`
- Create: `src/app/api/stories/route.ts`
- Create: `src/app/api/stories/[storyId]/route.ts`
- Create: `src/app/api/ai/story/structure/route.ts`
- Create: `src/app/api/ai/story/rate/route.ts`

- [ ] **Step 1: Stories list page** with theme filter, StoryCard grid, empty state

- [ ] **Step 2: StoryCard** — title, theme tags, strength rating (stars), edit/delete actions

- [ ] **Step 3: Add story flow** (4 steps: raw input → STAR editor → theme tagging → strength rating)

- [ ] **Step 4: `/api/ai/story/structure`** — calls STORY_STRUCTURER prompt, returns STAR JSON

- [ ] **Step 5: STAREditor** — 4 editable text areas (S/T/A/R), pre-filled from AI, user can refine

- [ ] **Step 6: `/api/ai/story/rate`** — calls STORY_RATER prompt, returns rating + tips

- [ ] **Step 7: Story CRUD API** — GET (list), POST (create), PUT (update), DELETE

---

### Task 14: Knowledge Library

**Files:**
- Create: `src/app/(app)/knowledge/page.tsx`
- Create: `src/app/(app)/knowledge/[topicSlug]/page.tsx`
- Create: `src/lib/knowledge-data.ts`

- [ ] **Step 1: Build knowledge data file** with all frameworks + AI-PM concepts from PRD Section 4.7 (static content, no AI needed)

Each entry: `{ slug, title, category, explanation, whenToUse, commonMistakes, relatedCategory }`

- [ ] **Step 2: Knowledge library index page** — categorized grid: Prioritization, Metrics, Strategy, User Research, Communication, AI-PM Concepts

- [ ] **Step 3: Individual topic page** — explanation, visual diagram (structured component), when to use, mistakes, "Practice this" CTA

- [ ] **Step 4: Mark topics as studied** — record ProgressEntry with FRAMEWORK_STUDY activity

---

## Phase 3 — Company & Job Intelligence

### Task 15: Company Deep-Dive Module

**Files:**
- Create: `src/app/(app)/company-prep/page.tsx`
- Create: `src/app/(app)/company-prep/[companySlug]/page.tsx`
- Create: `src/components/company/CompanyCard.tsx`
- Create: `src/components/company/CompanyInsightSection.tsx`
- Create: `src/app/api/companies/route.ts`
- Create: `src/app/api/ai/company/research/route.ts`

- [ ] **Step 1: Company list page** — grid of user's target companies + "Add company" button

- [ ] **Step 2: CompanyCard** — name, tier badge, prep completion %, "Deep Dive" button

- [ ] **Step 3: Company detail page** — 7 sections from PRD Section 4.4

- [ ] **Step 4: `/api/ai/company/research`** — uses COMPANY_RESEARCHER prompt + web search tool, caches result for 24h (use Next.js `revalidate`)

- [ ] **Step 5: "Practice for This Company" CTA** — links to `/mock-interview?company={slug}`

---

### Task 16: Job Search + JD Analyzer

**Files:**
- Create: `src/app/(app)/jobs/page.tsx`
- Create: `src/app/(app)/jobs/[jobId]/page.tsx`
- Create: `src/components/jobs/JobSearchBar.tsx`
- Create: `src/components/jobs/JobCard.tsx`
- Create: `src/components/jobs/JDAnalysis.tsx`
- Create: `src/components/jobs/MatchScore.tsx`
- Create: `src/app/api/jobs/route.ts`
- Create: `src/app/api/jobs/[jobId]/route.ts`
- Create: `src/app/api/ai/jobs/search/route.ts`
- Create: `src/app/api/ai/jobs/analyze-jd/route.ts`

- [ ] **Step 1: Job search page** with search bar + paste-JD textarea + saved jobs list

- [ ] **Step 2: `/api/ai/jobs/search`** — web search for job postings, returns structured list

- [ ] **Step 3: Job card** — title, company, location, status badge, "Analyze" button

- [ ] **Step 4: `/api/ai/jobs/analyze-jd`** — uses JD_ANALYZER prompt with user profile, returns requirements + match score + prep plan

- [ ] **Step 5: JD Analysis page** — match score ring, requirements list, prep plan checklist, "Start Prepping" CTA

- [ ] **Step 6: Kanban board** for job pipeline (drag-to-update status using HTML drag API)

---

## Phase 4 — Lifecycle Features

### Task 17: Product Teardown Arena

**Files:**
- Create: `src/app/(app)/teardown/page.tsx`
- Create: `src/app/(app)/teardown/[challengeId]/page.tsx`
- Create: `src/components/teardown/ProductCard.tsx`
- Create: `src/components/teardown/ChallengePrompt.tsx`
- Create: `src/components/teardown/TeardownFeedback.tsx`
- Create: `src/app/api/teardown/route.ts`
- Create: `src/app/api/ai/teardown/generate/route.ts`
- Create: `src/app/api/ai/teardown/feedback/route.ts`

- [ ] **Step 1: Product grid page** with 12+ product cards + random challenge button

- [ ] **Step 2: Challenge mode selector** (6 modes as tabs after product selection)

- [ ] **Step 3: `/api/ai/teardown/generate`** — TEARDOWN_GENERATOR prompt, saves TeardownAttempt with prompt

- [ ] **Step 4: Active challenge UI** — prompt display, optional timer, response textarea, submit button

- [ ] **Step 5: `/api/ai/teardown/feedback`** — TEARDOWN_EVALUATOR prompt, saves feedback + score to DB

- [ ] **Step 6: Feedback card** — 4 score rings + strengths/improvements/sample answer

---

### Task 18: Interview Debrief Tool

**Files:**
- Create: `src/app/(app)/debrief/page.tsx`
- Create: `src/app/(app)/debrief/new/page.tsx`
- Create: `src/app/(app)/debrief/[debriefId]/page.tsx`
- Create: `src/components/debrief/DebriefForm.tsx`
- Create: `src/components/debrief/QuestionLogger.tsx`
- Create: `src/components/debrief/DebriefAnalysis.tsx`
- Create: `src/app/api/debriefs/route.ts`
- Create: `src/app/api/ai/debrief/analyze/route.ts`

- [ ] **Step 1: New debrief form** — company/role/date/round fields

- [ ] **Step 2: QuestionLogger** — dynamic list of questions with category/answer/feeling fields, add/remove

- [ ] **Step 3: `/api/debriefs`** POST — saves debrief, triggers AI analysis

- [ ] **Step 4: `/api/ai/debrief/analyze`** — DEBRIEF_ANALYZER prompt, updates user weak areas in DB

- [ ] **Step 5: Debrief analysis view** — patterns, per-question feedback, recommended prep, next steps

- [ ] **Step 6: Debrief history** — timeline view with trend note

---

### Task 19: Panic Mode

**Files:**
- Create: `src/app/(app)/panic-mode/page.tsx`
- Create: `src/app/api/ai/panic-mode/generate/route.ts`
- Create: `src/components/shared/ExportButton.tsx`

- [ ] **Step 1: Panic mode page** — company/round selectors, generate button

- [ ] **Step 2: `/api/ai/panic-mode/generate`** — PANIC_MODE prompt using user profile + weak areas

- [ ] **Step 3: Render 10 items** as priority-ordered cards (framework/story/tip/question/talking_point styled differently)

- [ ] **Step 4: Export button** — `window.print()` with print-optimized CSS for one-pager

---

## Phase 5 — Gamification & Analytics

### Task 20: Progress Tracking + Readiness Score

**Files:**
- Create: `src/app/(app)/progress/page.tsx`
- Create: `src/lib/scoring.ts`
- Create: `src/components/progress/RadarChart.tsx`
- Create: `src/components/progress/AchievementBadge.tsx`
- Create: `src/app/api/progress/route.ts`

- [ ] **Step 1: Scoring logic** (`src/lib/scoring.ts`) — calculateReadinessScore() from PRD Section 4.11

- [ ] **Step 2: Progress page** — readiness gauge, category radar chart, time spent bars, trend lines

- [ ] **Step 3: RadarChart component** using recharts RadarChart

- [ ] **Step 4: Streak logic** — `updateStreak()` helper called after every activity, updates StreakData

- [ ] **Step 5: Achievements** — check achievement conditions after each activity, store unlocked in ProgressEntry metadata

---

## Phase 6 — Polish

### Task 21: Dark Mode + Responsive

- [ ] **Step 1: Configure Tailwind dark mode** (`darkMode: 'class'` in tailwind.config.ts)

- [ ] **Step 2: Add theme toggle** in Navbar

- [ ] **Step 3: Audit all components** for dark: variants — focus on cards, chat bubbles, feedback cards, sidebar

- [ ] **Step 4: Mobile layout** — Sidebar becomes a drawer on mobile, bottom nav for quick actions

- [ ] **Step 5: Responsive grid adjustments** — dashboard QuickActionGrid 2-col on mobile, 3-col on desktop

---

### Task 22: Loading States + Error Handling

**Files:**
- Create: `src/components/shared/AIThinking.tsx`
- Create: `src/components/shared/LoadingSkeleton.tsx`
- Create: `src/components/shared/EmptyState.tsx`

- [ ] **Step 1: AIThinking component** — 3 pulsing dots with "AI is thinking..." text

- [ ] **Step 2: LoadingSkeleton** — generic skeleton for cards and list items

- [ ] **Step 3: EmptyState component** — icon + message + CTA button

- [ ] **Step 4: Retry logic in AI wrapper** — 3 attempts with exponential backoff

- [ ] **Step 5: Global error boundary** + toast notifications via shadcn Toaster

---

### Task 23: Settings Page

**Files:**
- Create: `src/app/(app)/settings/page.tsx`
- Create: `src/app/api/user/settings/route.ts`

- [ ] **Step 1: Settings page** — profile info, target role/experience, interview timeline, weak areas, target companies, ANTHROPIC_API_KEY input (optional user override)

- [ ] **Step 2: Save changes** via PATCH to `/api/user/settings`

---

## Shared Components Reference

- `src/components/shared/ScoreRing.tsx` — reusable circular progress ring (used in feedback, readiness gauge, match score)
- `src/hooks/useAI.ts` — wraps fetch calls to AI routes with loading/error state
- `src/hooks/useUser.ts` — wraps useSession + user profile fetch
- `src/hooks/useStreak.ts` — streak data + updateStreak helper
