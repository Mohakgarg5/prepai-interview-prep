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
