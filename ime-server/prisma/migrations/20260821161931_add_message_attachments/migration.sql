/*
  Warnings:

  - You are about to drop the `attachments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."attachments" DROP CONSTRAINT "attachments_homeworkId_fkey";

-- DropForeignKey
ALTER TABLE "public"."attachments" DROP CONSTRAINT "attachments_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "public"."attachments" DROP CONSTRAINT "attachments_messageId_fkey";

-- DropForeignKey
ALTER TABLE "public"."attachments" DROP CONSTRAINT "attachments_submissionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."attachments" DROP CONSTRAINT "attachments_uploadedById_fkey";

-- AlterTable
ALTER TABLE "public"."Message" ALTER COLUMN "text" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."attachments";

-- CreateTable
CREATE TABLE "public"."MessageAttachment" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "lessonId" TEXT,
    "homeworkId" TEXT,
    "homeworkSubmissionId" TEXT,

    CONSTRAINT "MessageAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageAttachment_messageId_idx" ON "public"."MessageAttachment"("messageId");

-- AddForeignKey
ALTER TABLE "public"."MessageAttachment" ADD CONSTRAINT "MessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageAttachment" ADD CONSTRAINT "MessageAttachment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageAttachment" ADD CONSTRAINT "MessageAttachment_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "public"."lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageAttachment" ADD CONSTRAINT "MessageAttachment_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "public"."homeworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageAttachment" ADD CONSTRAINT "MessageAttachment_homeworkSubmissionId_fkey" FOREIGN KEY ("homeworkSubmissionId") REFERENCES "public"."homework_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
