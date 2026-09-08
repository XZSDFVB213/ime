-- DropForeignKey
ALTER TABLE "public"."Material" DROP CONSTRAINT "Material_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Material" DROP CONSTRAINT "Material_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Material" DROP CONSTRAINT "Material_teacherId_fkey";

-- DropIndex
DROP INDEX "public"."Material_lessonId_idx";

-- DropIndex
DROP INDEX "public"."Material_subjectId_idx";

-- DropIndex
DROP INDEX "public"."Material_teacherId_idx";

-- AlterTable
ALTER TABLE "public"."Material" ADD COLUMN     "uploadedByUserId" TEXT,
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "teacherId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Material" ADD CONSTRAINT "Material_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Material" ADD CONSTRAINT "Material_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Material" ADD CONSTRAINT "Material_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Material" ADD CONSTRAINT "Material_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "public"."lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Material" ADD CONSTRAINT "Material_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
