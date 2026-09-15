-- Создаём таблицу many-to-many
CREATE TABLE "public"."TeacherDepartment" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherDepartment_pkey" PRIMARY KEY ("id")
);


-- Индексы
CREATE INDEX "TeacherDepartment_teacherId_idx"
ON "public"."TeacherDepartment"("teacherId");


CREATE INDEX "TeacherDepartment_departmentId_idx"
ON "public"."TeacherDepartment"("departmentId");


CREATE UNIQUE INDEX "TeacherDepartment_teacherId_departmentId_key"
ON "public"."TeacherDepartment"("teacherId", "departmentId");


-- Внешние ключи новой таблицы
ALTER TABLE "public"."TeacherDepartment"
ADD CONSTRAINT "TeacherDepartment_teacherId_fkey"
FOREIGN KEY ("teacherId")
REFERENCES "public"."teachers"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;


ALTER TABLE "public"."TeacherDepartment"
ADD CONSTRAINT "TeacherDepartment_departmentId_fkey"
FOREIGN KEY ("departmentId")
REFERENCES "public"."departments"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;


-- =============================================
-- ПЕРЕНОСИМ СУЩЕСТВУЮЩИЕ КАФЕДРЫ ПРЕПОДАВАТЕЛЕЙ
-- =============================================

INSERT INTO "public"."TeacherDepartment" (
    "id",
    "teacherId",
    "departmentId",
    "createdAt"
)
SELECT
    CONCAT("id", '_', "departmentId"),
    "id",
    "departmentId",
    CURRENT_TIMESTAMP
FROM "public"."teachers"
WHERE "departmentId" IS NOT NULL;


-- =============================================
-- ТОЛЬКО ТЕПЕРЬ УДАЛЯЕМ СТАРУЮ СВЯЗЬ
-- =============================================

ALTER TABLE "public"."teachers"
DROP CONSTRAINT "teachers_departmentId_fkey";


DROP INDEX "public"."teachers_departmentId_idx";


ALTER TABLE "public"."teachers"
DROP COLUMN "departmentId";