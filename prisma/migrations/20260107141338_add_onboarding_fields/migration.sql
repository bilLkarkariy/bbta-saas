-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "businessName" TEXT,
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT;
