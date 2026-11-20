-- DropForeignKey
ALTER TABLE "sale_order_items" DROP CONSTRAINT "sale_order_items_productSkuId_fkey";

-- AlterTable
ALTER TABLE "sale_order_items" ALTER COLUMN "productSkuId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "sale_orders" ADD COLUMN     "discountAmount" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "discountType" TEXT DEFAULT 'PERCENTAGE',
ADD COLUMN     "discountValue" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentMode" TEXT NOT NULL DEFAULT 'CASH',
ALTER COLUMN "taxRate" DROP NOT NULL,
ALTER COLUMN "taxAmount" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "sale_order_items" ADD CONSTRAINT "sale_order_items_productSkuId_fkey" FOREIGN KEY ("productSkuId") REFERENCES "product_skus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
