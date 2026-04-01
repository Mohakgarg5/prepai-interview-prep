-- CreateEnum
CREATE TYPE "TargetRole" AS ENUM ('GENERAL_PM', 'AI_PM', 'TECHNICAL_PM', 'GROWTH_PM');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('NEW_GRAD', 'JUNIOR', 'MID', 'SENIOR', 'DIRECTOR_PLUS');

-- CreateEnum
CREATE TYPE "CompanyTier" AS ENUM ('FAANG', 'BIG_TECH', 'MID_STAGE', 'STARTUP', 'ENTERPRISE', 'OTHER');

-- CreateEnum
CREATE TYPE "InterviewCategory" AS ENUM ('PRODUCT_SENSE', 'EXECUTION', 'STRATEGY', 'BEHAVIORAL', 'ESTIMATION', 'TECHNICAL_AI', 'ML_SYSTEM_DESIGN', 'AI_ETHICS', 'METRICS', 'PRODUCT_DESIGN');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'FAANG_LEVEL');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('INTERVIEWER', 'CANDIDATE', 'FEEDBACK', 'HINT', 'FOLLOWUP', 'SYSTEM');

-- CreateEnum
CREATE TYPE "BehavioralTheme" AS ENUM ('LEADERSHIP', 'CONFLICT_RESOLUTION', 'FAILURE_AND_LEARNING', 'DATA_DRIVEN_DECISION', 'AMBIGUITY', 'CROSS_FUNCTIONAL', 'CUSTOMER_OBSESSION', 'INNOVATION', 'PRIORITIZATION', 'INFLUENCE_WITHOUT_AUTHORITY', 'TECHNICAL_DEPTH', 'STAKEHOLDER_MANAGEMENT');

-- CreateEnum
CREATE TYPE "TeardownMode" AS ENUM ('IMPROVE_FEATURE', 'DEFINE_NORTH_STAR', 'PRIORITIZE_ROADMAP', 'DESIGN_V2', 'COMPETITIVE_ANALYSIS', 'DEFINE_METRICS');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('SAVED', 'APPLIED', 'PHONE_SCREEN', 'INTERVIEWING', 'OFFER', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('MOCK_INTERVIEW', 'TEARDOWN', 'FRAMEWORK_STUDY', 'STORY_CRAFTING', 'COMPANY_RESEARCH', 'DEBRIEF', 'PANIC_MODE_REVIEW');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "targetRole" "TargetRole" NOT NULL DEFAULT 'GENERAL_PM',
    "experienceLevel" "ExperienceLevel" NOT NULL DEFAULT 'MID',
    "interviewTimeline" TIMESTAMP(3),
    "weakAreas" TEXT[],

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetCompany" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "CompanyTier" NOT NULL DEFAULT 'MID_STAGE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TargetCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "category" "InterviewCategory" NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "companyContext" TEXT,
    "jobContext" TEXT,
    "timedMode" BOOLEAN NOT NULL DEFAULT false,
    "timeLimitMinutes" INTEGER,
    "overallScore" DOUBLE PRECISION,
    "structureScore" DOUBLE PRECISION,
    "clarityScore" DOUBLE PRECISION,
    "depthScore" DOUBLE PRECISION,
    "creativityScore" DOUBLE PRECISION,
    "feedback" TEXT,

    CONSTRAINT "MockSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order" INTEGER NOT NULL,

    CONSTRAINT "MockMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehavioralStory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "rawContent" TEXT NOT NULL,
    "situation" TEXT,
    "task" TEXT,
    "action" TEXT,
    "result" TEXT,
    "themes" "BehavioralTheme"[],
    "companies" TEXT[],
    "strength" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "BehavioralStory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeardownAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productName" TEXT NOT NULL,
    "mode" "TeardownMode" NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "feedback" TEXT,
    "score" DOUBLE PRECISION,

    CONSTRAINT "TeardownAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Debrief" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyName" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "interviewDate" TIMESTAMP(3) NOT NULL,
    "interviewRound" TEXT,
    "interviewerName" TEXT,
    "questionsAsked" JSONB NOT NULL,
    "overallFeeling" INTEGER NOT NULL,
    "whatWentWell" TEXT,
    "whatWentPoorly" TEXT,
    "surprises" TEXT,
    "aiAnalysis" TEXT,
    "areasToImprove" TEXT[],
    "followUpPlan" TEXT,

    CONSTRAINT "Debrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT,
    "url" TEXT,
    "jdContent" TEXT,
    "keyRequirements" TEXT[],
    "suggestedPrep" JSONB,
    "matchScore" DOUBLE PRECISION,
    "status" "JobStatus" NOT NULL DEFAULT 'SAVED',

    CONSTRAINT "SavedJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" "InterviewCategory" NOT NULL,
    "activity" "ActivityType" NOT NULL,
    "score" DOUBLE PRECISION,
    "timeSpent" INTEGER NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "ProgressEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreakData" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityDate" TIMESTAMP(3),
    "freezesRemaining" INTEGER NOT NULL DEFAULT 2,
    "totalActiveDays" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StreakData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StreakData_userId_key" ON "StreakData"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- AddForeignKey
ALTER TABLE "TargetCompany" ADD CONSTRAINT "TargetCompany_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockSession" ADD CONSTRAINT "MockSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockMessage" ADD CONSTRAINT "MockMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MockSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehavioralStory" ADD CONSTRAINT "BehavioralStory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeardownAttempt" ADD CONSTRAINT "TeardownAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Debrief" ADD CONSTRAINT "Debrief_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressEntry" ADD CONSTRAINT "ProgressEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakData" ADD CONSTRAINT "StreakData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
