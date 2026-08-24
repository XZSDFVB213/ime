/*
  Warnings:

  - You are about to drop the `chats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `messages` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."ChatType" AS ENUM ('DIRECT', 'GROUP');

-- DropForeignKey
ALTER TABLE "public"."attachments" DROP CONSTRAINT "attachments_messageId_fkey";

-- DropForeignKey
ALTER TABLE "public"."chat_members" DROP CONSTRAINT "chat_members_chatId_fkey";

-- DropForeignKey
ALTER TABLE "public"."chats" DROP CONSTRAINT "chats_createdById_fkey";

-- DropForeignKey
ALTER TABLE "public"."messages" DROP CONSTRAINT "messages_chatId_fkey";

-- DropForeignKey
ALTER TABLE "public"."messages" DROP CONSTRAINT "messages_replyToId_fkey";

-- DropForeignKey
ALTER TABLE "public"."messages" DROP CONSTRAINT "messages_senderId_fkey";

-- DropTable
DROP TABLE "public"."chats";

-- DropTable
DROP TABLE "public"."messages";

-- CreateTable
CREATE TABLE "public"."Chat" (
    "id" TEXT NOT NULL,
    "type" "public"."ChatType" NOT NULL DEFAULT 'DIRECT',
    "title" TEXT,
    "directKey" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatParticipant" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Chat_directKey_key" ON "public"."Chat"("directKey");

-- CreateIndex
CREATE INDEX "Chat_lastMessageAt_idx" ON "public"."Chat"("lastMessageAt");

-- CreateIndex
CREATE INDEX "ChatParticipant_userId_idx" ON "public"."ChatParticipant"("userId");

-- CreateIndex
CREATE INDEX "ChatParticipant_chatId_idx" ON "public"."ChatParticipant"("chatId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatParticipant_chatId_userId_key" ON "public"."ChatParticipant"("chatId", "userId");

-- CreateIndex
CREATE INDEX "Message_chatId_createdAt_idx" ON "public"."Message"("chatId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "public"."Message"("senderId");

-- AddForeignKey
ALTER TABLE "public"."chat_members" ADD CONSTRAINT "chat_members_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Chat" ADD CONSTRAINT "Chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatParticipant" ADD CONSTRAINT "ChatParticipant_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatParticipant" ADD CONSTRAINT "ChatParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attachments" ADD CONSTRAINT "attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
