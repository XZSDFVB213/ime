/*
  Warnings:

  - Added the required column `lessonId` to the `homeworks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."homeworks" ADD COLUMN     "lessonId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."homeworks" ADD CONSTRAINT "homeworks_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "public"."lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
