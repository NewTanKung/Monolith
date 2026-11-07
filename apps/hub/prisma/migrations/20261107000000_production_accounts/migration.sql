CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE "ServiceMode" AS ENUM ('LINK', 'SSO');
CREATE TYPE "EmailPurpose" AS ENUM ('VERIFY_EMAIL', 'RESET_PASSWORD', 'CHANGE_EMAIL');
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3), ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "AppItem" ADD COLUMN "mode" "ServiceMode" NOT NULL DEFAULT 'LINK';
CREATE TABLE "Session" (
  "id" TEXT PRIMARY KEY, "tokenHash" TEXT NOT NULL UNIQUE, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "device" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL, "revokedAt" TIMESTAMP(3)
);
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");
CREATE TABLE "EmailToken" (
  "id" TEXT PRIMARY KEY, "tokenHash" TEXT NOT NULL UNIQUE, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "purpose" "EmailPurpose" NOT NULL, "email" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL, "usedAt" TIMESTAMP(3)
);
CREATE INDEX "EmailToken_userId_purpose_idx" ON "EmailToken"("userId", "purpose");
CREATE TABLE "ServiceToken" (
  "id" TEXT PRIMARY KEY, "appId" TEXT NOT NULL REFERENCES "AppItem"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "tokenHash" TEXT NOT NULL UNIQUE, "prefix" TEXT NOT NULL, "scopes" TEXT[] NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "lastUsedAt" TIMESTAMP(3), "revokedAt" TIMESTAMP(3)
);
CREATE INDEX "ServiceToken_appId_idx" ON "ServiceToken"("appId");
CREATE TABLE "HubSettings" ("id" TEXT PRIMARY KEY DEFAULT 'hub', "registrationEnabled" BOOLEAN NOT NULL DEFAULT true);
CREATE TABLE "AuditLog" ("id" TEXT PRIMARY KEY, "actorId" TEXT NOT NULL, "action" TEXT NOT NULL, "targetId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
