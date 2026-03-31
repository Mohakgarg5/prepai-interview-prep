# Learn Module Design Spec
**Date:** 2026-03-31
**Project:** PrepAI — World's Best PM + AI-PM Interview Prep & Learning Platform
**Sub-project:** 1 of 3 — Learn Module (Curriculum + AI Tutor + Playbook)

---

## 1. Problem & Goal

PrepAI already has strong interview practice tools (mock interviews, teardowns, story bank, panic mode). What it lacks is a **learning layer** — structured content that teaches PM from scratch and connects knowledge to practice.

Goal: Add a `/learn` section that turns PrepAI into a complete platform serving three user types:
- **Switchers** — people breaking into PM from other fields (0→1)
- **Levelers-up** — working PMs sharpening for FAANG/top-tier interviews
- **Students** — taking PM courses alongside the platform

---

## 2. Content Sources

### Source A: The Product Book (2nd Ed.) — Product School
9 chapters, ~300 pages. Foundation concepts taught in the AI's own words (not reproduced verbatim).

| Chapter | Topic |
|---------|-------|
| 1 | What Is Product Management |
| 2 | Strategically Understanding a Company |
| 3 | Creating an Opportunity Hypothesis |
| 4 | Validating Your Hypothesis |
| 5 | From Idea to Action |
| 6 | Working with Design |
| 7 | Working with Engineering |
| 8 | Bringing Your Product to Market |
| 9 | Finishing the Product-Development Life Cycle |

### Source B: Kellogg Course Material (10 Modules)
Applied, real-world PM curriculum with assignments, case studies, and PRD examples.

| Module | Topic |
|--------|-------|
| 1 | Intro to Product Management |
| 2 | Assessing Product Opportunities |
| 3 | Discovery & Requirements Definition |
| 4 | Business Model Design & Usability |
| 5 | AI Changing Product Management |
| 6 | Taking Products to Market |
| 7 | Managing Whole Products & Partner Ecosystems |
| 8 | Product Management in Startups & Data Planning |
| 9 | Advanced Product Strategies |
| 10 | Capstone / Final Presentations |

### Source C: Existing Platform Frameworks
The 20+ PM frameworks already in `knowledge-data.ts` — integrated into lessons instead of living in isolation.

---

## 3. Architecture

### 3.1 Content Delivery: Hybrid Structured + RAG

**Structured curriculum** (DB-driven, curated) drives the UX — learners follow a clear path with modules, lessons, and progress tracking.

**RAG layer** (pgvector + OpenAI embeddings) powers the AI tutor — semantic search over all source material so the tutor can answer any question, cite sources, and connect concepts across both books.

Content in lessons is **AI-synthesized from sources** (concepts explained in the platform's own words), not reproduced verbatim. This is both legally clean and pedagogically better.

### 3.2 PDF Ingestion Pipeline

One-time script: `scripts/ingest-content.ts`
1. Extract text from both PDFs using `pdf-parse`
2. Split into ~500-token chunks with 50-token overlap
3. Embed each chunk via OpenAI `text-embedding-3-small`
4. Store in `KnowledgeChunk` table with pgvector `vector(1536)` column
5. Tag each chunk with `source` ("product-book" | "kellogg") and `chapterRef`

Re-runnable with `--source` flag to add new books later.

### 3.3 AI Tutor Flow

```
User question
    → embed question (OpenAI)
    → pgvector similarity search (top 5 chunks)
    → build context: [lesson content] + [retrieved chunks] + [conversation history]
    → stream response via existing AI setup
```

Tutor is available in two modes:
- **Inline** — sidebar on every lesson page, context-aware of the current lesson
- **Open chat** — `/learn/tutor`, ask anything across all sources

---

## 4. Learning Paths

### Path 1: PM Playbook (0→1 Beginner)
8-week structured roadmap. Each week = 1 module = 3–5 lessons + practice questions.

| Week | Theme | Sources |
|------|-------|---------|
| 1 | What is PM? Role, responsibilities, day-in-life | Product Book Ch.1, Kellogg M1 |
| 2 | Understanding Markets, Users & Strategy | Product Book Ch.2, Kellogg M2 |
| 3 | Opportunity Assessment & Framing | Product Book Ch.3, Kellogg M2-3 |
| 4 | User Research & Hypothesis Validation | Product Book Ch.4, Kellogg M3 |
| 5 | Prioritization, Roadmapping & Execution | Product Book Ch.5, Kellogg M4, Frameworks |
| 6 | Design Thinking & Engineering Collaboration | Product Book Ch.6-7, Kellogg M4 |
| 7 | Go-to-Market & Launch | Product Book Ch.8, Kellogg M6 |
| 8 | Metrics, Scaling & Advanced Strategy | Product Book Ch.9, Kellogg M8-9, Frameworks |

After each week: a short quiz + suggested mock interview in the week's topic.

### Path 2: Interview Prep Fast Track
For PMs who know the concepts but need interview-ready execution.

1. Diagnostic quiz (10 questions) → identifies 2–3 weakest skill areas
2. Personalized module order based on weak areas
3. Each module: concept refresh (10 min) → 3 practice questions → mock interview
4. Skill areas: Strategy, Execution, Metrics, Leadership/Behavioral, AI-PM

### Path 3: AI-PM Track
For PMs targeting AI product roles. Technically rigorous.

| Module | Topic |
|--------|-------|
| 1 | AI/ML Fundamentals for PMs (LLMs, RAG, fine-tuning, evals, embeddings) |
| 2 | AI Product Strategy (build vs. buy, model selection, trust & safety) |
| 3 | AI Product Metrics (latency, hallucination rate, RLHF, DSAT) |
| 4 | AI Product Teardowns (ChatGPT, Cursor, Perplexity, Copilot, Gemini) |
| 5 | Trust, Safety & Ethics in AI Products |
| 6 | AI-PM Interview Prep (question bank + AI-specific mock sessions) |

Content sources: Kellogg Module 5, public AI product knowledge, platform's existing AI-PM frameworks.

---

## 5. Database Schema Additions

```prisma
// pgvector extension (one migration)
// ALTER TABLE ... (handled in migration)

model KnowledgeChunk {
  id         String   @id @default(cuid())
  source     String   // "product-book" | "kellogg" | "frameworks"
  chapterRef String   // e.g., "ch3", "module-4"
  content    String
  embedding  Unsupported("vector(1536)")
  createdAt  DateTime @default(now())
}

model LearningPath {
  id          String   @id @default(cuid())
  slug        String   @unique  // "playbook" | "fast-track" | "ai-pm"
  title       String
  description String
  icon        String
  order       Int
  modules     LearningModule[]
  enrollments UserPathEnrollment[]
}

model LearningModule {
  id               String   @id @default(cuid())
  pathId           String
  path             LearningPath    @relation(fields: [pathId], references: [id])
  slug             String
  title            String
  description      String
  weekNumber       Int?             // for Playbook path
  estimatedMinutes Int
  order            Int
  lessons          LearningLesson[]
}

model LearningLesson {
  id                String   @id @default(cuid())
  moduleId          String
  module            LearningModule  @relation(fields: [moduleId], references: [id])
  slug              String
  title             String
  content           String          // AI-synthesized MDX content
  keyTakeaways      String[]
  practiceQuestions String[]
  interviewTip      String?         // direct connect to interview usage
  sourceRefs        String[]        // ["product-book-ch3", "kellogg-module3"]
  estimatedMinutes  Int
  order             Int
  progress          UserLessonProgress[]
}

model UserLessonProgress {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  lessonId    String
  lesson      LearningLesson @relation(fields: [lessonId], references: [id])
  completedAt DateTime?
  quizScore   Float?
  timeSpentMs Int      @default(0)
  @@unique([userId, lessonId])
}

model UserPathEnrollment {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  pathId      String
  path        LearningPath @relation(fields: [pathId], references: [id])
  startedAt   DateTime @default(now())
  completedAt DateTime?
  currentWeek Int      @default(1)
  @@unique([userId, pathId])
}
```

Add `lessonProgress UserLessonProgress[]` and `pathEnrollments UserPathEnrollment[]` relations to `User` model.

---

## 6. New Routes & Components

### Routes
```
/learn                              → LearningHub (path selection)
/learn/tutor                        → OpenAITutor (freeform chat)
/learn/playbook                     → PlaybookRoadmap (week-by-week visual)
/learn/[track]                      → TrackOverview (module grid + progress)
/learn/[track]/[module]             → ModuleView (lesson list)
/learn/[track]/[module]/[lesson]    → LessonView (content + inline tutor)
```

### Components
```
src/components/learn/
  LearningHub.tsx          → path cards with enrollment CTA
  PathOverview.tsx         → module list with completion rings
  PlaybookRoadmap.tsx      → visual 8-week timeline with milestones
  ModuleCard.tsx           → module card with progress indicator
  LessonView.tsx           → main lesson layout
  LessonContent.tsx        → MDX renderer for lesson body
  InlineTutor.tsx          → collapsible AI tutor sidebar
  TutorChat.tsx            → reusable chat UI (used inline + open)
  SkillMastery.tsx         → radar chart of skill areas
  ReadinessBadge.tsx       → completion certificate display
  LessonQuiz.tsx           → end-of-lesson quiz (3–5 Qs)
  PracticePrompt.tsx       → "Practice this topic" CTA linking to mock interview
```

### API Routes
```
/api/ai/tutor          POST  → RAG-powered tutor (streaming)
/api/learn/progress    POST  → mark lesson complete, save quiz score
/api/learn/enroll      POST  → enroll user in a path
/api/learn/diagnostic  POST  → score diagnostic quiz, return weak areas
```

---

## 7. Cross-Feature Integration

The Learn Module connects to existing features so the platform feels like one cohesive product, not separate tools:

- **Lesson → Mock Interview**: Every lesson has a "Practice This Topic" button that starts a mock interview pre-configured for that topic
- **Lesson → Framework Library**: Lessons on prioritization link directly to RICE, MoSCoW, etc. in the existing knowledge base
- **Lesson → Story Bank**: Lessons on behavioral leadership prompt the user to add a STAR story for that skill
- **Completion → Panic Mode**: Panic Mode's one-pager draws from lessons the user has completed, personalizing the review
- **Progress → Dashboard**: Dashboard shows current path, current week/lesson, and a "Resume Learning" card
- **Readiness Score**: Calculated from lesson completion % + quiz avg + mock interview scores in relevant categories

---

## 8. Readiness Certification

After completing a full path:
- **Readiness Score** = (Lessons completed × 0.3) + (Avg quiz score × 0.3) + (Avg mock score in path topics × 0.4)
- Visual badge displayed on dashboard + profile
- Breakdown: which skill areas are strong vs. need more work
- Actionable next step: "You're 78% ready. Your weakest area is Metrics — take 2 more mock interviews."

---

## 9. Content Generation Strategy

Lesson content is generated once (not at runtime) using a seed script:
`scripts/generate-lesson-content.ts`

For each lesson, the script:
1. Retrieves relevant chunks from pgvector (top 10 for the chapter/topic)
2. Prompts Claude/GPT-4 to synthesize a structured lesson (explanation + takeaways + practice Qs + interview tip)
3. Stores the result in `LearningLesson.content` as MDX
4. This runs once; content is static in the DB unless manually regenerated

This keeps runtime costs low (no generation per page load) while ensuring content is high-quality, synthesized, and original.

---

## 10. Build Sequence

1. Database migration (add pgvector extension + new models)
2. PDF ingestion script (`scripts/ingest-content.ts`)
3. Lesson content generation script (`scripts/generate-lesson-content.ts`)
4. AI Tutor API endpoint (`/api/ai/tutor`)
5. Progress API endpoints
6. Learning Hub + Path Overview UI
7. Lesson View + Inline Tutor UI
8. Playbook Roadmap UI
9. Diagnostic quiz + personalized path
10. AI-PM Track content
11. Readiness score + badge
12. Cross-feature integration (dashboard card, mock interview CTAs, panic mode)

---

## 11. Out of Scope (Sub-projects 2 & 3)

- PM Playbook standalone marketing page
- AI-PM Track expansion beyond Module 6
- Community features (discussion, peer review)
- Video content
- Mobile app
