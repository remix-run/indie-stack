-- CreateEnum
CREATE TYPE "WebhookEventState" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "service" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "state" "WebhookEventState" NOT NULL DEFAULT E'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failReason" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_service_externalId_key" ON "WebhookEvent"("service", "externalId");
