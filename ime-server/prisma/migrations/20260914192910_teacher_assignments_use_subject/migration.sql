-- Удаляем старый внешний ключ на Discipline
ALTER TABLE "public"."TeacherDisciplineGroup"
DROP CONSTRAINT IF EXISTS "TeacherDisciplineGroup_disciplineId_fkey";


-- Удаляем старое unique-ограничение
ALTER TABLE "public"."TeacherDisciplineGroup"
DROP CONSTRAINT IF EXISTS "TeacherDisciplineGroup_teacherId_disciplineId_groupId_key";


-- Удаляем старый индекс
DROP INDEX IF EXISTS
"public"."TeacherDisciplineGroup_disciplineId_idx";


-- Удаляем старый disciplineId
ALTER TABLE "public"."TeacherDisciplineGroup"
DROP COLUMN IF EXISTS "disciplineId";


-- Добавляем subjectId.
-- Таблица сейчас пустая, поэтому NOT NULL можно добавить сразу.
ALTER TABLE "public"."TeacherDisciplineGroup"
ADD COLUMN "subjectId" TEXT NOT NULL;


-- Связываем назначение с Subject
ALTER TABLE "public"."TeacherDisciplineGroup"
ADD CONSTRAINT "TeacherDisciplineGroup_subjectId_fkey"
FOREIGN KEY ("subjectId")
REFERENCES "public"."subjects"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;


-- Преподаватель + дисциплина + группа должны быть уникальны
ALTER TABLE "public"."TeacherDisciplineGroup"
ADD CONSTRAINT "TeacherDisciplineGroup_teacherId_subjectId_groupId_key"
UNIQUE ("teacherId", "subjectId", "groupId");


-- Индекс по Subject
CREATE INDEX "TeacherDisciplineGroup_subjectId_idx"
ON "public"."TeacherDisciplineGroup"("subjectId");