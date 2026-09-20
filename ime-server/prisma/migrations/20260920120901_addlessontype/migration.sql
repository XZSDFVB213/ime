-- CreateEnum
CREATE TYPE "public"."AssessmentResult" AS ENUM ('EXCELLENT', 'GOOD', 'SATISFACTORY', 'UNSATISFACTORY', 'PASSED', 'NOT_PASSED');

-- CreateTable
CREATE TABLE "public"."lesson_assessments" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "result" "public"."AssessmentResult" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lesson_assessments_lessonId_idx" ON "public"."lesson_assessments"("lessonId");

-- CreateIndex
CREATE INDEX "lesson_assessments_studentId_idx" ON "public"."lesson_assessments"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_assessments_lessonId_studentId_key" ON "public"."lesson_assessments"("lessonId", "studentId");

-- AddForeignKey
ALTER TABLE "public"."lesson_assessments" ADD CONSTRAINT "lesson_assessments_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "public"."lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lesson_assessments" ADD CONSTRAINT "lesson_assessments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
