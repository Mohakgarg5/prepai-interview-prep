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
              "How do you decide when to push back on a designer's proposal?",
            ],
            interviewTip: "Interviewers test whether you understand you don't own resources — you own outcomes.",
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
            interviewTip: "Mention specific artifacts you've owned (PRDs, roadmaps, OKRs) — abstract answers lose points.",
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
              "Porter's 5 Forces: buyer/supplier power, substitutes, new entrants, competitive rivalry",
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
              "Milkshake example: McDonald's found morning commuters hired milkshakes as entertainment, not food",
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
              "MoSCoW: Must Have / Should Have / Could Have / Won't Have — good for stakeholder alignment",
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
              "The Mom Test: ask questions even your mom can't lie about",
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
            interviewTip: "Use \"MVP\" deliberately: always say what you're testing, not just what you're cutting.",
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
              "A designer proposes a feature you think is wrong. How do you handle it?",
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
              "Non-goals are as important as goals — they prevent scope creep",
              "Engineers don't need wireframes — they need clear success criteria",
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
              "You don't need to code, but you need to estimate effort and spot technical debt",
              'Key concepts to know: APIs, databases, latency, caching, microservices',
              "Tech debt: the long-term cost of short-term shortcuts — PMs must budget for it",
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
              "Guardrail metrics: things you're watching to make sure you're not breaking",
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
            interviewTip: "In metrics questions: name the metric, explain why it matters, explain how you'd move it.",
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
              "Porter's 5 Forces: external competitive analysis",
              'Ansoff Matrix: growth strategy (market penetration, development, product development, diversification)',
            ],
            practiceQuestions: [
              'What strategy would you recommend for a mid-size SaaS company entering a new vertical?',
              'How do you evaluate whether to expand internationally?',
            ],
            interviewTip: "Name your framework, apply it, then add your own judgment — don't just recite the framework.",
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
              "Your team's velocity dropped 40% in Q2. Walk me through your investigation.",
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
            interviewTip: "Prepare 7–10 core stories that can be adapted to different questions — don't memorize scripts.",
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
              "What are the risks of building your entire product on top of OpenAI's API?",
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
              "Data moat: proprietary data that others can't replicate — the strongest AI moat",
              'Workflow moat: deeply embedded in user workflow, high switching cost',
              'Model moat: your fine-tuned or proprietary model is better — hard to build, easy to lose',
            ],
            practiceQuestions: [
              "Perplexity AI uses existing search data. What's their moat?",
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
              '"AI-powered" is not a benefit — users care about outcomes, not technology',
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
              "How would you improve ChatGPT's retention for non-power users?",
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
              "Design Cursor's expansion into a new user segment beyond developers.",
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
              "Gemini: Google's advantage is multimodal data + search integration + Android distribution",
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
              "You're launching an AI hiring tool. What are the top 3 risks and how do you mitigate them?",
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
              "You are the PM for Google's AI search. A study shows it reduces user trust in health queries. What do you do?",
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
    explanation: "Surveys measure stated preference (unreliable). User interviews about past behavior reveal actual behavior. Building is validation but it's the most expensive.",
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
    explanation: "Amazon built because delivery data + logistics infrastructure creates network effects and long-term cost advantages. Speed-to-market is a valid reason to partner but doesn't explain the strategic rationale.",
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
      "List the stakeholder's concerns and how you addressed each",
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
    explanation: "NSM captures user value, not just business value. Revenue is a lagging indicator. Airbnb's NSM is \"nights booked\" — it captures value for both hosts and guests.",
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
    explanation: "Revenue potential matters but is secondary. The key is whether your value prop translates AND whether you have a path to distribution. Without both, market size is irrelevant.",
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
    explanation: "Scope down is the PM move. Delaying impacts commitments. Shipping known issues is a trust/safety risk. Overtime is not a PM decision to make unilaterally.",
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
    explanation: "RAG lets you update knowledge without retraining (great for docs/databases). Fine-tuning changes model behavior/style (great for brand voice, domain-specific reasoning). They solve different problems.",
  },
]
