-- CreateTable
CREATE TABLE "public"."Discipline" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discipline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeacherDisciplineGroup" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherDisciplineGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherDisciplineGroup_teacherId_idx" ON "public"."TeacherDisciplineGroup"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherDisciplineGroup_subjectId_idx" ON "public"."TeacherDisciplineGroup"("subjectId");

-- CreateIndex
CREATE INDEX "TeacherDisciplineGroup_groupId_idx" ON "public"."TeacherDisciplineGroup"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherDisciplineGroup_teacherId_subjectId_groupId_key" ON "public"."TeacherDisciplineGroup"("teacherId", "subjectId", "groupId");

-- AddForeignKey
ALTER TABLE "public"."TeacherDisciplineGroup" ADD CONSTRAINT "TeacherDisciplineGroup_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherDisciplineGroup" ADD CONSTRAINT "TeacherDisciplineGroup_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Discipline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherDisciplineGroup" ADD CONSTRAINT "TeacherDisciplineGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
