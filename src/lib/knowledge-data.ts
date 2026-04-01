export interface Framework {
  name: string
  description: string
  whenToUse?: string
  steps?: string[]
}

export const FRAMEWORKS: Framework[] = [
  {
    name: 'RICE Framework',
    description: 'Reach, Impact, Confidence, Effort — a structured scoring method for feature prioritization.',
    whenToUse: 'When you need to compare multiple features or initiatives objectively.',
    steps: [
      'Estimate Reach: how many users in a time period',
      'Estimate Impact: how much will this move the needle (0.25–3)',
      'Estimate Confidence: how sure are you (low/medium/high %)',
      'Estimate Effort: person-months of work',
      'Score = (Reach × Impact × Confidence) / Effort',
    ],
  },
  {
    name: 'MoSCoW Method',
    description: "Must have, Should have, Could have, Won't have — categorizes requirements by priority.",
    whenToUse: 'When aligning stakeholders on scope for a release or sprint.',
    steps: [
      "Must have: non-negotiable requirements for launch",
      "Should have: important but not critical",
      "Could have: nice-to-have if time permits",
      "Won't have: explicitly deferred to future",
    ],
  },
  {
    name: 'Kano Model',
    description: 'Categorizes features by user satisfaction: Basic, Performance, and Delight.',
    whenToUse: 'When deciding which features will genuinely delight vs. just satisfy users.',
    steps: [
      'Identify Basic needs (expected, cause dissatisfaction if absent)',
      'Identify Performance needs (more = better)',
      'Identify Delight features (unexpected, create wow moments)',
      'Prioritize delighters that are feasible',
    ],
  },
  {
    name: 'AARRR (Pirate Metrics)',
    description: 'Acquisition, Activation, Retention, Revenue, Referral — the full product funnel.',
    whenToUse: 'When diagnosing where your product is leaking users or value.',
    steps: [
      'Acquisition: how do users find you?',
      'Activation: do users have a great first experience?',
      'Retention: do users come back?',
      'Revenue: how do you monetize?',
      'Referral: do users tell others?',
    ],
  },
  {
    name: 'HEART Framework',
    description: 'Happiness, Engagement, Adoption, Retention, Task Success — user-centered metrics.',
    whenToUse: "When defining success metrics for a product or feature from the user's perspective.",
    steps: [
      'Define goals for each HEART dimension',
      'Identify signals (user behaviors)',
      'Choose measurable metrics per signal',
      'Track and iterate',
    ],
  },
  {
    name: 'Jobs-to-be-Done',
    description: 'Users "hire" products to do a job. Focus on the job, not the user persona.',
    whenToUse: 'When conducting user research or defining product value propositions.',
    steps: [
      'Interview users about what they were trying to accomplish',
      'Identify the functional, social, and emotional jobs',
      'Map current solutions and their shortcomings',
      'Design for the job, not the demographic',
    ],
  },
  {
    name: 'OKRs',
    description: 'Objectives and Key Results — aligning teams around measurable outcomes.',
    whenToUse: 'When setting quarterly or annual team goals and tracking progress.',
    steps: [
      'Define an inspiring Objective (qualitative)',
      'Define 2-4 measurable Key Results',
      'Set ambitious targets (60-70% achievement = success)',
      'Review progress weekly, grade at end of quarter',
    ],
  },
  {
    name: 'North Star Framework',
    description: 'A single metric that best captures the core value your product delivers to users.',
    whenToUse: "When aligning the team on what matters most for long-term growth.",
    steps: [
      'Identify the core value your product delivers',
      'Choose a metric that captures that value exchange',
      'Ensure it leads to revenue (not vanity)',
      'Break it into input metrics your team can influence',
    ],
  },
  {
    name: 'CIRCLES Method',
    description: 'Comprehend, Identify, Report, Cut, List, Evaluate, Summarize — a product design framework.',
    whenToUse: 'For structured product design interview questions.',
    steps: [
      'Comprehend the situation',
      'Identify the customer',
      'Report the customer needs',
      'Cut through prioritization',
      'List solutions',
      'Evaluate tradeoffs',
      'Summarize recommendation',
    ],
  },
  {
    name: 'STAR Method',
    description: 'Situation, Task, Action, Result — for structuring behavioral interview answers.',
    whenToUse: 'Whenever answering behavioral or leadership questions in interviews.',
    steps: [
      'Situation: set the scene with context',
      'Task: describe your responsibility',
      'Action: explain what YOU specifically did',
      'Result: share outcomes with metrics if possible',
    ],
  },
]
