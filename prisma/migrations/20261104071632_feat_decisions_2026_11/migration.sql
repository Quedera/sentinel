-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'SERVICE_CONFIRMATION_SIGNED', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'OVERDUE', 'VOID');

-- CreateEnum
CREATE TYPE "TerminationSide" AS ENUM ('CLIENT', 'CONSULTANT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'SERVICE_CONFIRMATION_SIGNED';
ALTER TYPE "AuditAction" ADD VALUE 'VERIFICATION_GRANTED';
ALTER TYPE "AuditAction" ADD VALUE 'VERIFICATION_REJECTED';
ALTER TYPE "AuditAction" ADD VALUE 'INVOICE_ISSUED';
ALTER TYPE "AuditAction" ADD VALUE 'INVOICE_PAID';
ALTER TYPE "AuditAction" ADD VALUE 'INVOICE_VOIDED';
ALTER TYPE "AuditAction" ADD VALUE 'ENGAGEMENT_TERMINATED';
ALTER TYPE "AuditAction" ADD VALUE 'TERMINATION_PENALTY_APPLIED';

-- AlterEnum
ALTER TYPE "EngagementStatus" ADD VALUE 'TERMINATED';

-- AlterTable
ALTER TABLE "Consultant" ADD COLUMN     "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "ratingCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Engagement" ADD COLUMN     "terminatedAt" TIMESTAMP(3),
ADD COLUMN     "terminationPenalty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "terminationReason" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "ServiceConfirmation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "signedName" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "consultantId" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "subtotal" INTEGER NOT NULL,
    "vat" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Termination" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "initiatedById" TEXT NOT NULL,
    "side" "TerminationSide" NOT NULL,
    "reason" TEXT NOT NULL,
    "penalty" INTEGER NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Termination_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceConfirmation_userId_idx" ON "ServiceConfirmation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- CreateIndex
CREATE INDEX "Invoice_engagementId_idx" ON "Invoice"("engagementId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_clientId_idx" ON "Invoice"("clientId");

-- CreateIndex
CREATE INDEX "Invoice_consultantId_idx" ON "Invoice"("consultantId");

-- CreateIndex
CREATE UNIQUE INDEX "Termination_engagementId_key" ON "Termination"("engagementId");

-- CreateIndex
CREATE INDEX "Termination_engagementId_idx" ON "Termination"("engagementId");

-- CreateIndex
CREATE INDEX "Termination_side_idx" ON "Termination"("side");

-- CreateIndex
CREATE INDEX "User_verificationStatus_idx" ON "User"("verificationStatus");

-- AddForeignKey
ALTER TABLE "ServiceConfirmation" ADD CONSTRAINT "ServiceConfirmation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "Consultant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Termination" ADD CONSTRAINT "Termination_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Termination" ADD CONSTRAINT "Termination_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
