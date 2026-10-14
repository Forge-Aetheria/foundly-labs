-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('mobile_payment', 'bank_transfer', 'binance');

-- CreateEnum
CREATE TYPE "AdvanceKind" AS ENUM ('fixed', 'percent');

-- AlterTable: service advance rule
ALTER TABLE "Service" ADD COLUMN "requiresAdvance" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Service" ADD COLUMN "advanceKind" "AdvanceKind";
ALTER TABLE "Service" ADD COLUMN "advanceValue" INTEGER;

-- AlterTable: embedded advance payment on the appointment
ALTER TABLE "Appointment" ADD COLUMN "paymentMethodType" "PaymentMethodType";
ALTER TABLE "Appointment" ADD COLUMN "advanceAmountCents" INTEGER;
ALTER TABLE "Appointment" ADD COLUMN "paymentReference" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "paymentProofUrl" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "paymentSubmittedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "label" TEXT,
    "details" TEXT,
    "instructions" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_tenantId_type_key" ON "PaymentMethod"("tenantId", "type");

-- CreateIndex
CREATE INDEX "PaymentMethod_tenantId_active_idx" ON "PaymentMethod"("tenantId", "active");

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "AppointmentNotification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'simulated',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppointmentNotification_appointmentId_createdAt_idx" ON "AppointmentNotification"("appointmentId", "createdAt");

-- AddForeignKey
ALTER TABLE "AppointmentNotification" ADD CONSTRAINT "AppointmentNotification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentNotification" ADD CONSTRAINT "AppointmentNotification_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
