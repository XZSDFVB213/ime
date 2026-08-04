/*
  Warnings:

  - Added the required column `groupId` to the `lessons` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."lessons" ADD COLUMN     "groupId" TEXT NOT NULL;
