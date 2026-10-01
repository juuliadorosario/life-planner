CREATE TABLE `creative_items` (
	`id` text PRIMARY KEY NOT NULL,
	`board` text DEFAULT 'Moodboard' NOT NULL,
	`kind` text NOT NULL,
	`image` text,
	`text` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
