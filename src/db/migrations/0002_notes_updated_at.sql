ALTER TABLE `notes` ADD `updated_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE `notes` SET `updated_at` = `created_at` WHERE `updated_at` = '';
