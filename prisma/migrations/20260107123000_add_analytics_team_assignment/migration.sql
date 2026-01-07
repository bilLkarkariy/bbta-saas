-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'AGENT', 'VIEWER');

-- AlterTable: Add new columns to Tenant
ALTER TABLE "Tenant" ADD COLUMN "assignmentStrategy" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "Tenant" ADD COLUMN "autoAssignOnInbound" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Add new columns to User
ALTER TABLE "User" ADD COLUMN "isAvailable" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "maxConversations" INTEGER NOT NULL DEFAULT 10;

-- Convert existing role values to enum
-- First drop the old column and add new enum column
ALTER TABLE "User" DROP COLUMN "role";
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'AGENT';

-- AlterTable: Add new columns to Conversation
ALTER TABLE "Conversation" ADD COLUMN "assignedToId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "assignedAt" TIMESTAMP(3);
ALTER TABLE "Conversation" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE "Conversation" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable: AnalyticsDaily
CREATE TABLE "AnalyticsDaily" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "conversationsTotal" INTEGER NOT NULL DEFAULT 0,
    "conversationsNew" INTEGER NOT NULL DEFAULT 0,
    "conversationsResolved" INTEGER NOT NULL DEFAULT 0,
    "conversationsEscalated" INTEGER NOT NULL DEFAULT 0,
    "messagesInbound" INTEGER NOT NULL DEFAULT 0,
    "messagesOutbound" INTEGER NOT NULL DEFAULT 0,
    "messagesAI" INTEGER NOT NULL DEFAULT 0,
    "messagesHuman" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTimeMs" INTEGER,
    "avgResponseTimeHuman" INTEGER,
    "botResolutionRate" DOUBLE PRECISION,
    "leadsCapture" INTEGER NOT NULL DEFAULT 0,
    "contactsNew" INTEGER NOT NULL DEFAULT 0,
    "aiTier1Calls" INTEGER NOT NULL DEFAULT 0,
    "aiTier2Calls" INTEGER NOT NULL DEFAULT 0,
    "aiTier3Calls" INTEGER NOT NULL DEFAULT 0,
    "aiCostEstimate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AnalyticsHourly
CREATE TABLE "AnalyticsHourly" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "conversationsActive" INTEGER NOT NULL DEFAULT 0,
    "messagesInbound" INTEGER NOT NULL DEFAULT 0,
    "messagesOutbound" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsHourly_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ConversationNote
CREATE TABLE "ConversationNote" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsDaily_tenantId_date_key" ON "AnalyticsDaily"("tenantId", "date");
CREATE INDEX "AnalyticsDaily_tenantId_idx" ON "AnalyticsDaily"("tenantId");
CREATE INDEX "AnalyticsDaily_date_idx" ON "AnalyticsDaily"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsHourly_tenantId_timestamp_key" ON "AnalyticsHourly"("tenantId", "timestamp");
CREATE INDEX "AnalyticsHourly_tenantId_idx" ON "AnalyticsHourly"("tenantId");
CREATE INDEX "AnalyticsHourly_timestamp_idx" ON "AnalyticsHourly"("timestamp");

-- CreateIndex
CREATE INDEX "ConversationNote_conversationId_idx" ON "ConversationNote"("conversationId");
CREATE INDEX "ConversationNote_userId_idx" ON "ConversationNote"("userId");

-- CreateIndex
CREATE INDEX "User_isAvailable_idx" ON "User"("isAvailable");
CREATE INDEX "Conversation_assignedToId_idx" ON "Conversation"("assignedToId");
CREATE INDEX "Conversation_priority_idx" ON "Conversation"("priority");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsDaily" ADD CONSTRAINT "AnalyticsDaily_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsHourly" ADD CONSTRAINT "AnalyticsHourly_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationNote" ADD CONSTRAINT "ConversationNote_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationNote" ADD CONSTRAINT "ConversationNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
