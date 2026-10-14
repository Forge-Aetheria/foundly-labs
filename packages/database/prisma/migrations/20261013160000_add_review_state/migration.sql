-- CreateEnum
CREATE TYPE "ReviewState" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "Review" ADD COLUMN "state" "ReviewState" NOT NULL DEFAULT 'pending';

-- Backfill: existing (already published) reviews stay public.
UPDATE "Review" SET "state" = 'approved';

-- CreateIndex
CREATE INDEX "Review_tenantId_state_idx" ON "Review"("tenantId", "state");
