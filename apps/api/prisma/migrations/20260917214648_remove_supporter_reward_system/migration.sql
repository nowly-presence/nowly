/*
  Warnings:

  - You are about to drop the `donation_events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `supporter_devices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `supporter_passes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "donation_events" DROP CONSTRAINT "donation_events_pass_id_fkey";

-- DropForeignKey
ALTER TABLE "supporter_devices" DROP CONSTRAINT "supporter_devices_pass_id_fkey";

-- DropTable
DROP TABLE "donation_events";

-- DropTable
DROP TABLE "supporter_devices";

-- DropTable
DROP TABLE "supporter_passes";
