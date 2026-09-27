CREATE TABLE `channel_stats` (
	`id` text PRIMARY KEY NOT NULL,
	`month` text NOT NULL,
	`channel` text NOT NULL,
	`value` real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `channel_stats_month_channel` ON `channel_stats` (`month`,`channel`);--> statement-breakpoint
CREATE TABLE `marketing_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`channel` text DEFAULT 'instagram' NOT NULL,
	`date` text,
	`status` text DEFAULT 'idea' NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
