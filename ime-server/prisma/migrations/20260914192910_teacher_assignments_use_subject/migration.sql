-- Удаляем старую связь subjectId -> Discipline
ALTER TABLE "public"."TeacherDisciplineGroup"
DROP CONSTRAINT IF EXISTS "TeacherDisciplineGroup_subjectId_fkey";


-- Создаем новую связь subjectId -> Subject
ALTER TABLE "public"."TeacherDisciplineGroup"
ADD CONSTRAINT "TeacherDisciplineGroup_subjectId_fkey"
FOREIGN KEY ("subjectId")
REFERENCES "public"."subjects"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;