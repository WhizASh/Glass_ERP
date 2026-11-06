-- Baseline PostgreSQL Migration for Glass ERP
-- Created for Supabase PostgreSQL

CREATE TYPE "CustomerType" AS ENUM ('INDIVIDUAL', 'ORGANIZATION');

-- Customers Table
CREATE TABLE IF NOT EXISTS "customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerType" "CustomerType" NOT NULL DEFAULT 'ORGANIZATION',
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "taxId" TEXT,
    "email" TEXT UNIQUE,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Product SKUs Table (Pure Catalog: Specs & Pricing, no stock)
CREATE TABLE IF NOT EXISTS "product_skus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "skuCode" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "glassType" TEXT NOT NULL,
    "thicknessMm" DECIMAL(65,30) NOT NULL,
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'SQ_METER',
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Quotations Table
CREATE TABLE IF NOT EXISTS "quotations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteNumber" TEXT NOT NULL UNIQUE,
    "customerId" TEXT NOT NULL REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Quotation Sections Table (e.g., 1st Floor, 2nd Floor, Facade)
CREATE TABLE IF NOT EXISTS "quotation_sections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quotationId" TEXT NOT NULL REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "sectionName" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Quotation Items Table
CREATE TABLE IF NOT EXISTS "quotation_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectionId" TEXT NOT NULL REFERENCES "quotation_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "productSkuId" TEXT NOT NULL REFERENCES "product_skus"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "description" TEXT,
    "widthMm" DECIMAL(65,30),
    "heightMm" DECIMAL(65,30),
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "areaSqM" DECIMAL(65,30),
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "totalPrice" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sale Orders Table
CREATE TABLE IF NOT EXISTS "sale_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL UNIQUE,
    "customerId" TEXT NOT NULL REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "quotationId" TEXT REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryAddress" TEXT,
    "totalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sale Order Items Table
CREATE TABLE IF NOT EXISTS "sale_order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleOrderId" TEXT NOT NULL REFERENCES "sale_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "sectionName" TEXT,
    "productSkuId" TEXT NOT NULL REFERENCES "product_skus"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "description" TEXT,
    "widthMm" DECIMAL(65,30),
    "heightMm" DECIMAL(65,30),
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "totalPrice" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
