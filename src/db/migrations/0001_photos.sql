CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`name` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
