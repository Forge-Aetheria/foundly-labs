-- AlterTable: make the public page toggle-able (defaults to visible).
ALTER TABLE "Tenant" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT true;