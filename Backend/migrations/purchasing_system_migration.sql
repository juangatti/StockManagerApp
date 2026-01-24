-- Migration script: Purchasing System Re-engineering
-- Date: 2026-01-24

-- 1. Create the purchases table
CREATE TABLE IF NOT EXISTS `purchases` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `supplier_id` int(11) NOT NULL,
  `invoice_number` varchar(100) NOT NULL,
  `invoice_date` date NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `main_category` enum('comida', 'bebidas', 'mantenimiento', 'cerveza') NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_purchase_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- 2. Add purchase_id to kegs
ALTER TABLE `kegs` ADD COLUMN `purchase_id` int(11) DEFAULT NULL;
ALTER TABLE `kegs` ADD CONSTRAINT `fk_keg_purchase` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`);

-- 3. Add purchase_id to stock_movements
ALTER TABLE `stock_movements` ADD COLUMN `purchase_id` int(11) DEFAULT NULL;
ALTER TABLE `stock_movements` ADD CONSTRAINT `fk_movement_purchase` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`);

-- 4. Expand unidad_medida ENUM in stock_items
-- Note: MySQL/TiDB might require re-defining the entire column for ENUM changes
ALTER TABLE `stock_items` MODIFY COLUMN `unidad_medida` ENUM('ml', 'g', 'l', 'kg', 'u') COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'ml';
