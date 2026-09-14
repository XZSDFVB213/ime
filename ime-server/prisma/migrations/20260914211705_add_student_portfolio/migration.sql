-- CreateEnum
CREATE TYPE "public"."PortfolioItemType" AS ENUM ('PROJECT', 'COURSEWORK', 'RESEARCH', 'PRESENTATION', 'CERTIFICATE', 'DIPLOMA', 'OTHER');

-- CreateTable
CREATE TABLE "public"."PortfolioItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."PortfolioItemType" NOT NULL,
    "url" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PortfolioItem_studentId_idx" ON "public"."PortfolioItem"("studentId");

-- CreateIndex
CREATE INDEX "PortfolioItem_subjectId_idx" ON "public"."PortfolioItem"("subjectId");

-- CreateIndex
CREATE INDEX "PortfolioItem_type_idx" ON "public"."PortfolioItem"("type");

-- AddForeignKey
ALTER TABLE "public"."PortfolioItem" ADD CONSTRAINT "PortfolioItem_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PortfolioItem" ADD CONSTRAINT "PortfolioItem_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
