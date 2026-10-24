CREATE TABLE "chat_conversations" (
    "id" UUID NOT NULL,
    "title" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" UUID NOT NULL,
    "userId" UUID,

    CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversationId" UUID NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "chat_conversations_companyId_updatedAt_idx"
    ON "chat_conversations"("companyId", "updatedAt");
CREATE INDEX "chat_conversations_userId_updatedAt_idx"
    ON "chat_conversations"("userId", "updatedAt");
CREATE INDEX "chat_messages_conversationId_createdAt_idx"
    ON "chat_messages"("conversationId", "createdAt");

ALTER TABLE "chat_conversations"
    ADD CONSTRAINT "chat_conversations_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chat_conversations"
    ADD CONSTRAINT "chat_conversations_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chat_messages"
    ADD CONSTRAINT "chat_messages_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "chat_conversations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
