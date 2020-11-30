-- CreateEnum
CREATE TYPE "public"."TokenType" AS ENUM ('EMAIL', 'API');
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "firstName" DROP NOT NULL,
ALTER COLUMN "lastName" DROP NOT NULL;
-- CreateTable
CREATE TABLE "Token" (
"id" SERIAL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "TokenType" NOT NULL,
    "emailToken" TEXT,
    "valid" BOOLEAN NOT NULL DEFAULT true,
    "expiration" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "Token.emailToken_unique" ON "Token"("emailToken");
-- AddForeignKey
ALTER TABLE "Token" ADD FOREIGN KEY("userId")REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
