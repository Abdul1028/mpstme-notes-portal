-- CreateTable
CREATE TABLE "MessageOwnership" (
    "id" TEXT NOT NULL,
    "messageId" BIGINT NOT NULL,
    "channelId" BIGINT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageOwnership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageOwnership_userId_idx" ON "MessageOwnership"("userId");

-- CreateIndex
CREATE INDEX "MessageOwnership_messageId_idx" ON "MessageOwnership"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageOwnership_messageId_channelId_key" ON "MessageOwnership"("messageId", "channelId");

-- AddForeignKey
ALTER TABLE "MessageOwnership" ADD CONSTRAINT "MessageOwnership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
