CREATE TABLE "tax_invoices" (
  "id" TEXT NOT NULL,
  "number" SERIAL NOT NULL,
  "saleOrderId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "issueDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "data" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tax_invoices_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "tax_invoices_number_key" ON "tax_invoices"("number");
CREATE INDEX "tax_invoices_saleOrderId_idx" ON "tax_invoices"("saleOrderId");
ALTER TABLE "tax_invoices" ADD CONSTRAINT "tax_invoices_saleOrderId_fkey" FOREIGN KEY ("saleOrderId") REFERENCES "sale_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tax_invoices" ADD CONSTRAINT "tax_invoices_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
