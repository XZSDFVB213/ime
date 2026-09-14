-- DropForeignKey
ALTER TABLE "public"."TeacherDisciplineGroup" DROP CONSTRAINT "TeacherDisciplineGroup_subjectId_fkey";

-- AlterTable
ALTER TABLE "public"."TeacherDisciplineGroup" ADD COLUMN     "disciplineId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."TeacherDisciplineGroup" ADD CONSTRAINT "TeacherDisciplineGroup_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherDisciplineGroup" ADD CONSTRAINT "TeacherDisciplineGroup_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "public"."Discipline"("id") ON DELETE SET NULL ON UPDATE CASCADE;
