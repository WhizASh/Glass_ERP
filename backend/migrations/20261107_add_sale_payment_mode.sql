-- AlterTable sale_orders: add paymentMode
ALTER TABLE "sale_orders" ADD COLUMN IF NOT EXISTS "paymentMode" TEXT NOT NULL DEFAULT 'CASH';

-- AlterTable sale_order_items: make productSkuId nullable for direct custom items
ALTER TABLE "sale_order_items" ALTER COLUMN "productSkuId" DROP NOT NULL;
