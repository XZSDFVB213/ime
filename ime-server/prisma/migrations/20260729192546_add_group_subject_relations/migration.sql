/*
  Warnings:

  - Changed the type of `year` on the `academic_years` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."academic_years" DROP COLUMN "year",
ADD COLUMN     "year" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_year_key" ON "public"."academic_years"("year");
