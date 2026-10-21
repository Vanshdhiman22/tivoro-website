CREATE TABLE `enquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`submission_id` text NOT NULL,
	`name` text NOT NULL,
	`business` text NOT NULL,
	`email` text NOT NULL,
	`service` text NOT NULL,
	`message` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text,
	`payload_hash` text NOT NULL,
	`notification_state` text NOT NULL,
	`notification_error` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enquiries_submission_unique` ON `enquiries` (`submission_id`);--> statement-breakpoint
CREATE INDEX `enquiries_created_index` ON `enquiries` (`created_at`);--> statement-breakpoint
CREATE INDEX `enquiries_status_index` ON `enquiries` (`status`);--> statement-breakpoint
CREATE TABLE `enquiry_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`attempts` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `enquiry_limits_expiry_index` ON `enquiry_limits` (`expires_at`);