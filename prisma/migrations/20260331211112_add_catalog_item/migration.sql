-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "catalogItemId" TEXT;

-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "backdropImageUrl" TEXT,
    "year" INTEGER,
    "metadata" JSONB,
    "externalId" TEXT,
    "provider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_externalId_provider_key" ON "CatalogItem"("externalId", "provider");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
