-- AlterTable sale_orders: add subtotal, discountType, discountValue, discountAmount, taxRate, taxAmount
ALTER TABLE "sale_orders" ADD COLUMN IF NOT EXISTS "subtotal" DECIMAL(65,30);
ALTER TABLE "sale_orders" ADD COLUMN IF NOT EXISTS "discountType" TEXT NOT NULL DEFAULT 'PERCENTAGE';
ALTER TABLE "sale_orders" ADD COLUMN IF NOT EXISTS "discountValue" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "sale_orders" ADD COLUMN IF NOT EXISTS "discountAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "sale_orders" ADD COLUMN IF NOT EXISTS "taxRate" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "sale_orders" ADD COLUMN IF NOT EXISTS "taxAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable sale_order_items: add widthInches, heightInches, areaSqFt
ALTER TABLE "sale_order_items" ADD COLUMN IF NOT EXISTS "widthInches" DECIMAL(65,30);
ALTER TABLE "sale_order_items" ADD COLUMN IF NOT EXISTS "heightInches" DECIMAL(65,30);
ALTER TABLE "sale_order_items" ADD COLUMN IF NOT EXISTS "areaSqFt" DECIMAL(65,30);
