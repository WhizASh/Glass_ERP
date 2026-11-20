ALTER TABLE "sale_orders"
 ADD COLUMN "amountReceived" DECIMAL(24,2) NOT NULL DEFAULT 0,
 ADD COLUMN "paymentDate" DATE,
 ADD COLUMN "paymentReference" VARCHAR(200);
UPDATE "sale_orders" SET "amountReceived" = "totalAmount" WHERE "paymentStatus" = 'PAID';
ALTER TABLE "purchases"
 ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
 ADD COLUMN "amountPaid" DECIMAL(24,2) NOT NULL DEFAULT 0,
 ADD COLUMN "paymentMode" TEXT NOT NULL DEFAULT 'CASH',
 ADD COLUMN "paymentDate" DATE,
 ADD COLUMN "paymentReference" VARCHAR(200);
