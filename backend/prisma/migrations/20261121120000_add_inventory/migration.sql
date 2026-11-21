BEGIN;

CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "materialName" VARCHAR(200) NOT NULL,
    "nameKey" VARCHAR(200) NOT NULL,
    "unitOfMeasure" TEXT NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "notes" VARCHAR(2000),
    "revision" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "inventory_items_quantity_check" CHECK ("quantity" >= 0)
);
CREATE UNIQUE INDEX "inventory_items_nameKey_unitOfMeasure_key" ON "inventory_items"("nameKey", "unitOfMeasure");

-- Start with all historical purchases, merging names case-insensitively within a unit.
INSERT INTO "inventory_items" ("id", "materialName", "nameKey", "unitOfMeasure", "quantity", "createdAt", "updatedAt")
SELECT 'inventory-' || md5(LOWER(TRIM(REGEXP_REPLACE("materialName", '[[:space:]]+', ' ', 'g'))) || ':' || "unitOfMeasure"),
       MIN(TRIM(REGEXP_REPLACE("materialName", '[[:space:]]+', ' ', 'g'))),
       LOWER(TRIM(REGEXP_REPLACE("materialName", '[[:space:]]+', ' ', 'g'))),
       "unitOfMeasure", SUM("quantity"), MIN("createdAt"), CURRENT_TIMESTAMP
FROM "purchases"
GROUP BY LOWER(TRIM(REGEXP_REPLACE("materialName", '[[:space:]]+', ' ', 'g'))), "unitOfMeasure";

ALTER TABLE "purchases" ADD COLUMN "inventoryItemId" TEXT;
UPDATE "purchases" p SET "inventoryItemId" = i."id" FROM "inventory_items" i
WHERE i."nameKey" = LOWER(TRIM(REGEXP_REPLACE(p."materialName", '[[:space:]]+', ' ', 'g')))
  AND i."unitOfMeasure" = p."unitOfMeasure";
ALTER TABLE "purchases" ALTER COLUMN "inventoryItemId" SET NOT NULL;
CREATE INDEX "purchases_inventoryItemId_idx" ON "purchases"("inventoryItemId");
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_inventoryItemId_fkey"
  FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_items" ENABLE ROW LEVEL SECURITY;

COMMIT;
