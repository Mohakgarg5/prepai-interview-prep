-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'LESSON_COMPLETE';

-- CreateTable
CREATE TABLE "KnowledgeChunk" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "chapterRef" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPath" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "LearningPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningModule" (
    "id" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "weekNumber" INTEGER,
    "estimatedMinutes" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "LearningModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningLesson" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "keyTakeaways" TEXT[],
    "practiceQuestions" TEXT[],
    "interviewTip" TEXT,
    "sourceRefs" TEXT[],
    "estimatedMinutes" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "LearningLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLessonProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "quizScore" DOUBLE PRECISION,
    "timeSpentMs" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserLessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPathEnrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "currentWeek" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "UserPathEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeChunk_source_idx" ON "KnowledgeChunk"("source");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPath_slug_key" ON "LearningPath"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "LearningModule_pathId_slug_key" ON "LearningModule"("pathId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "LearningLesson_moduleId_slug_key" ON "LearningLesson"("moduleId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "UserLessonProgress_userId_lessonId_key" ON "UserLessonProgress"("userId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPathEnrollment_userId_pathId_key" ON "UserPathEnrollment"("userId", "pathId");

-- AddForeignKey
ALTER TABLE "LearningModule" ADD CONSTRAINT "LearningModule_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningLesson" ADD CONSTRAINT "LearningLesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "LearningModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLessonProgress" ADD CONSTRAINT "UserLessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLessonProgress" ADD CONSTRAINT "UserLessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "LearningLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPathEnrollment" ADD CONSTRAINT "UserPathEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPathEnrollment" ADD CONSTRAINT "UserPathEnrollment_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "LearningPath"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "KnowledgeChunk_embedding_hnsw_idx" ON "KnowledgeChunk" USING hnsw (embedding vector_cosine_ops);
