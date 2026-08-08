-- 0001_initial_schema.sql — Wend-Kabré
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN CREATE TYPE "PlanType" AS ENUM ('FREE','PREMIUM','ENTERPRISE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE','EXPIRED','CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "PaymentStatus" AS ENUM ('PENDING','SUCCESS','FAILED','CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "UserRole" AS ENUM ('USER','ADMIN','SUPER_ADMIN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "WebhookEventType" AS ENUM ('PAYMENT_SUCCESS','PAYMENT_FAILED','PAYMENT_CANCELLED','SUBSCRIPTION_ACTIVATED','SUBSCRIPTION_EXPIRED','UNKNOWN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "AuditAction" AS ENUM ('ROLE_CHANGE','PAYMENT_VALIDATION','PAYMENT_REFUND','SUBSCRIPTION_UPDATE','USER_DELETE','USER_SUSPEND','USER_REACTIVATE','ADMIN_LOGIN','SETTINGS_CHANGE','WEBHOOK_MANUAL_RETRY'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL UNIQUE,
    "phone" TEXT,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "plan" "PlanType" NOT NULL DEFAULT 'FREE',
    "startDate" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "endDate" TIMESTAMPTZ NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "subscriptions_userId_idx" ON "subscriptions"("userId");
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions"("status");

CREATE TABLE IF NOT EXISTS "payment_transactions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "reference" TEXT NOT NULL UNIQUE,
    "moneyFusionId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "planId" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT NOT NULL DEFAULT 'MONEY_FUSION',
    "rawCallbackPayload" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "payment_transactions_userId_idx" ON "payment_transactions"("userId");
CREATE INDEX IF NOT EXISTS "payment_transactions_reference_idx" ON "payment_transactions"("reference");
CREATE INDEX IF NOT EXISTS "payment_transactions_status_idx" ON "payment_transactions"("status");

CREATE TABLE IF NOT EXISTS "webhook_events" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "eventType" "WebhookEventType" NOT NULL DEFAULT 'UNKNOWN',
    "reference" TEXT,
    "paymentTransactionId" UUID REFERENCES "payment_transactions"("id") ON DELETE SET NULL,
    "rawPayload" JSONB NOT NULL,
    "signature" TEXT,
    "sourceIp" TEXT,
    "hmacValidated" BOOLEAN NOT NULL DEFAULT FALSE,
    "ipValidated" BOOLEAN NOT NULL DEFAULT FALSE,
    "replayChecked" BOOLEAN NOT NULL DEFAULT FALSE,
    "success" BOOLEAN NOT NULL DEFAULT FALSE,
    "errorMessage" TEXT,
    "processedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "webhook_events_reference_idx" ON "webhook_events"("reference");
CREATE INDEX IF NOT EXISTS "webhook_events_eventType_idx" ON "webhook_events"("eventType");
CREATE INDEX IF NOT EXISTS "webhook_events_success_idx" ON "webhook_events"("success");
CREATE INDEX IF NOT EXISTS "webhook_events_createdAt_idx" ON "webhook_events"("createdAt");

CREATE TABLE IF NOT EXISTS "processed_webhooks" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "nonceKey" TEXT NOT NULL UNIQUE,
    "reference" TEXT NOT NULL,
    "eventTs" TIMESTAMPTZ,
    "processedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "expiresAt" TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS "processed_webhooks_nonceKey_idx" ON "processed_webhooks"("nonceKey");
CREATE INDEX IF NOT EXISTS "processed_webhooks_reference_idx" ON "processed_webhooks"("reference");
CREATE INDEX IF NOT EXISTS "processed_webhooks_expiresAt_idx" ON "processed_webhooks"("expiresAt");

CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "actorId" UUID,
    "actorEmail" TEXT,
    "actorRole" "UserRole",
    "action" "AuditAction" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "targetUserId" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "audit_logs_actorId_idx" ON "audit_logs"("actorId");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "audit_logs_targetUserId_idx" ON "audit_logs"("targetUserId");
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
