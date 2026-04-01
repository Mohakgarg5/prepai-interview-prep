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
