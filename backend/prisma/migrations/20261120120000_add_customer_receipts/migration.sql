CREATE TABLE "customer_receipts" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "paymentDate" DATE NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "paymentType" VARCHAR(20) NOT NULL,
    "reference" VARCHAR(200),
    "notes" VARCHAR(2000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customer_receipts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "customer_receipts_amount_check" CHECK ("amount" > 0),
    CONSTRAINT "customer_receipts_type_check" CHECK ("paymentType" IN ('CASH', 'NEFT', 'UPI', 'CARD', 'CHEQUE', 'OTHER'))
);

CREATE INDEX "customer_receipts_customerId_paymentDate_idx" ON "customer_receipts"("customerId", "paymentDate");
ALTER TABLE "customer_receipts" ADD CONSTRAINT "customer_receipts_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
