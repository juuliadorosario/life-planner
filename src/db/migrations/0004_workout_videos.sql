CREATE TABLE `workout_videos` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`youtube_id` text,
	`title` text NOT NULL,
	`channel` text,
	`duration_min` integer,
	`focus` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `workouts` ADD `video_id` text REFERENCES workout_videos(id);