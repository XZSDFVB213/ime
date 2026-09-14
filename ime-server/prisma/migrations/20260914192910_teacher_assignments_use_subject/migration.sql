-- Удаляем старый FK Discipline
ALTER TABLE "public"."TeacherDisciplineGroup"
DROP CONSTRAINT IF EXISTS "TeacherDisciplineGroup_disciplineId_fkey";


-- Удаляем старый unique, если он существует
ALTER TABLE "public"."TeacherDisciplineGroup"
DROP CONSTRAINT IF EXISTS "TeacherDisciplineGroup_teacherId_disciplineId_groupId_key";


-- Удаляем старый индекс
DROP INDEX IF EXISTS
"public"."TeacherDisciplineGroup_disciplineId_idx";


-- Удаляем старую связь с Discipline
ALTER TABLE "public"."TeacherDisciplineGroup"
DROP COLUMN IF EXISTS "disciplineId";


-- Добавляем связь с Subject
ALTER TABLE "public"."TeacherDisciplineGroup"
ADD COLUMN "subjectId" TEXT NOT NULL;


-- FK -> subjects
ALTER TABLE "public"."TeacherDisciplineGroup"
ADD CONSTRAINT "TeacherDisciplineGroup_subjectId_fkey"
FOREIGN KEY ("subjectId")
REFERENCES "public"."subjects"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;


-- Уникальное назначение
ALTER TABLE "public"."TeacherDisciplineGroup"
ADD CONSTRAINT "TeacherDisciplineGroup_teacherId_subjectId_groupId_key"
UNIQUE ("teacherId", "subjectId", "groupId");


-- Индекс
CREATE INDEX "TeacherDisciplineGroup_subjectId_idx"
ON "public"."TeacherDisciplineGroup"("subjectId");