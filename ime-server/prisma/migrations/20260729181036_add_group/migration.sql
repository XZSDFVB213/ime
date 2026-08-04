/*
  Warnings:

  - A unique constraint covering the columns `[studentCode]` on the table `students` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."students" ADD COLUMN     "studentCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "students_studentCode_key" ON "public"."students"("studentCode");
