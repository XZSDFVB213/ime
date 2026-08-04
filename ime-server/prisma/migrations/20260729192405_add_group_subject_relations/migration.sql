/*
  Warnings:

  - You are about to drop the column `name` on the `academic_years` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[year]` on the table `academic_years` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `year` to the `academic_years` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."academic_years_name_key";

-- AlterTable
ALTER TABLE "public"."academic_years" DROP COLUMN "name",
ADD COLUMN     "year" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_year_key" ON "public"."academic_years"("year");
