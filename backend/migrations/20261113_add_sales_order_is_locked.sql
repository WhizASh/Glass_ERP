-- Add isLocked column to sale_orders for locking paid records
ALTER TABLE sale_orders ADD COLUMN IF NOT EXISTS "isLocked" BOOLEAN DEFAULT false;
