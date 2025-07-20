/*
  Warnings:

  - Added the required column `tolerancia` to the `Playa` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Playa` ADD COLUMN `tolerancia` INTEGER NOT NULL DEFAULT 15;
