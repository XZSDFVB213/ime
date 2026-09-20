/*
  Warnings:

  - You are about to drop the column `userId` on the `Material` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Material" DROP CONSTRAINT "Material_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Material" DROP CONSTRAINT "Material_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Material" DROP COLUMN "userId",
ADD COLUMN     "groupId" TEXT,
ALTER COLUMN "subjectId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Material" ADD CONSTRAINT "Material_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Material" ADD CONSTRAINT "Material_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
