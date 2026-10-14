-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'past_due', 'expired', 'canceled');

-- AlterTable: subscription tier on the business (additive to the existing module-entitlement "plan")
ALTER TABLE "Tenant" ADD COLUMN "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE';
ALTER TABLE "Tenant" ADD COLUMN "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'active';
ALTER TABLE "Tenant" ADD COLUMN "subscriptionExpiresAt" TIMESTAMP(3);
