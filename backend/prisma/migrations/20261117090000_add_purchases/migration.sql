-- CreateTable
CREATE TABLE "purchases" (
    "id" TEXT NOT NULL,
    "materialName" VARCHAR(200) NOT NULL,
    "supplier" VARCHAR(200),
    "purchaseDate" DATE NOT NULL,
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'PCS',
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "additionalCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(24,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "purchases_purchaseDate_createdAt_idx" ON "purchases"("purchaseDate", "createdAt");
