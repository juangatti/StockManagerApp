-- Migration: Schedules Refactor
-- Date: 2026-01-30

-- 1. Create workers table
CREATE TABLE IF NOT EXISTS `workers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `role_id` int(11) DEFAULT NULL,
  `is_active` boolean DEFAULT TRUE,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_worker_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Modify work_schedules to use worker_id instead of user_id
-- We add worker_id and make it nullable for now to avoid breaking existing queries until migrate.
ALTER TABLE `work_schedules` ADD COLUMN `worker_id` int(11) DEFAULT NULL AFTER `user_id`;
ALTER TABLE `work_schedules` ADD CONSTRAINT `fk_schedule_worker` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`id`);

-- 3. Bar operating hours table
CREATE TABLE IF NOT EXISTS `bar_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `day_of_week` tinyint(4) NOT NULL COMMENT '0=Sunday, 1=Monday...',
  `opening_time` time DEFAULT NULL,
  `kitchen_close_time` time DEFAULT NULL,
  `bar_close_time` time DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_day` (`day_of_week`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Initialize bar_config with defaults
INSERT IGNORE INTO `bar_config` (day_of_week, opening_time, kitchen_close_time, bar_close_time) VALUES
(0, '18:00:00', '00:00:00', '02:00:00'),
(1, '18:00:00', '00:00:00', '02:00:00'),
(2, '18:00:00', '00:00:00', '02:00:00'),
(3, '18:00:00', '00:00:00', '02:00:00'),
(4, '18:00:00', '01:00:00', '03:00:00'),
(5, '18:00:00', '02:00:00', '04:00:00'),
(6, '18:00:00', '02:00:00', '04:00:00');
