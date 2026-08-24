-- CreateEnum
CREATE TYPE "public"."MaterialType" AS ENUM ('FILE', 'LINK');

-- CreateTable
CREATE TABLE "public"."Material" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."MaterialType" NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "subjectId" TEXT NOT NULL,
    "lessonId" TEXT,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Material_subjectId_idx" ON "public"."Material"("subjectId");

-- CreateIndex
CREATE INDEX "Material_lessonId_idx" ON "public"."Material"("lessonId");

-- CreateIndex
CREATE INDEX "Material_teacherId_idx" ON "public"."Material"("teacherId");

-- AddForeignKey
ALTER TABLE "public"."Material" ADD CONSTRAINT "Material_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Material" ADD CONSTRAINT "Material_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "public"."lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Material" ADD CONSTRAINT "Material_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
