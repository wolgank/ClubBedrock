CREATE TABLE `reservation_inscription` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`is_cancelled` boolean NOT NULL,
	`reservation_id` bigint unsigned NOT NULL,
	`inscription_x_user` bigint unsigned NOT NULL,
	CONSTRAINT `reservation_inscription_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `member_exclusion_request` (
	`id` bigint unsigned NOT NULL,
	`id_Member` bigint unsigned NOT NULL,
	`reasonToExclude` varchar(250) NOT NULL,
	CONSTRAINT `member_exclusion_request_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment` (
	`id` bigint unsigned NOT NULL,
	`debt_id` varchar(255) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`status` enum('PENDING','PAID','OVERDUE','CANCELLED') NOT NULL,
	`payment_date` datetime NOT NULL,
	`payment_method` enum('CASH','CREDIT_CARD','DEBIT_CARD','BANK_TRANSFER','OTHER') NOT NULL,
	`reference_code` varchar(255) NOT NULL,
	CONSTRAINT `payment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `membership` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`code` varchar(255) NOT NULL,
	`state` enum('ENDED','ACTIVE','ON_REVISION') NOT NULL,
	CONSTRAINT `membership_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `academy_course` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`description` varchar(255),
	`academy_id` bigint unsigned NOT NULL,
	CONSTRAINT `academy_course_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `space` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` varchar(255),
	`reference` varchar(255),
	`capacity` int NOT NULL,
	`cost_per_hour` decimal(10,2) NOT NULL,
	`can_be_reserved` boolean,
	`is_available` boolean NOT NULL,
	`type` enum('LEISURE','SPORTS') NOT NULL,
	CONSTRAINT `space_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bill_detail` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`bill_id` bigint unsigned NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`discount` decimal(10,2),
	`final_price` decimal(10,2) NOT NULL,
	`description` text,
	CONSTRAINT `bill_detail_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee` (
	`id` bigint unsigned NOT NULL,
	`position` enum('EVENTS','SPORTS','MEMBERSHIP') NOT NULL,
	`salary` float NOT NULL,
	`active` boolean NOT NULL,
	CONSTRAINT `employee_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_inscription` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`assisted` boolean NOT NULL,
	`is_cancelled` boolean NOT NULL,
	`events_id` bigint unsigned NOT NULL,
	`inscription_x_user` bigint unsigned NOT NULL,
	CONSTRAINT `event_inscription_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `membership_fee_ticket` (
	`id` bigint unsigned NOT NULL,
	`membership_id` bigint unsigned NOT NULL,
	`start_date` datetime NOT NULL,
	`end_date` datetime NOT NULL,
	`moratorium_applied` boolean NOT NULL,
	CONSTRAINT `membership_fee_ticket_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rec_member` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`member_id` bigint unsigned NOT NULL,
	`membership_application_id` bigint unsigned NOT NULL,
	CONSTRAINT `rec_member_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `course_time_slot` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`day` enum('MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY') NOT NULL,
	`start_hour` datetime NOT NULL,
	`end_hour` datetime NOT NULL,
	`name` varchar(255),
	`academy_course_id` bigint unsigned NOT NULL,
	`reservation_id` bigint unsigned NOT NULL,
	CONSTRAINT `course_time_slot_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `member_request` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`reason` varchar(50) NOT NULL,
	`submissionDate` date,
	`requestState` enum('PENDING','REJECTED','APPROVED'),
	CONSTRAINT `member_request_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `member_inclusion_request` (
	`id` bigint unsigned NOT NULL,
	`documentType` enum('DNI','CE','PASSPORT') NOT NULL,
	`newMemberDocumentId` varchar(50) NOT NULL,
	`newMemberName` varchar(50) NOT NULL,
	`newMemberLastName` varchar(50) NOT NULL,
	`newMemberType` bigint unsigned NOT NULL,
	CONSTRAINT `member_inclusion_request_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_format` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`isForInclusion` boolean NOT NULL,
	`name` varchar(50) NOT NULL,
	`description` varchar(50) NOT NULL,
	`document_type` enum('DNI','CE','PASSPORT') NOT NULL,
	CONSTRAINT `document_format_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditory` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`table_changed` varchar(255) NOT NULL,
	`field_changed` varchar(255) NOT NULL,
	`previous_value` text,
	`post_value` text,
	`id_row_modified_or_created` int NOT NULL,
	`date_hour` datetime NOT NULL,
	`action` enum('CREATE','UPDATE','DELETE','LOGICAL_DELETE') NOT NULL,
	`account_id` bigint unsigned NOT NULL,
	CONSTRAINT `auditory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `member` (
	`id` bigint unsigned NOT NULL,
	`subCode` varchar(50) NOT NULL,
	`isActive` boolean NOT NULL,
	`member_type_id` bigint unsigned NOT NULL,
	CONSTRAINT `member_id` PRIMARY KEY(`id`),
	CONSTRAINT `member_subCode_unique` UNIQUE(`subCode`)
);
--> statement-breakpoint
CREATE TABLE `academy_inscription` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`is_cancelled` boolean NOT NULL,
	`academy_id` bigint unsigned NOT NULL,
	`inscription_x_user` bigint unsigned NOT NULL,
	CONSTRAINT `academy_inscription_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `space_day_time_slot_for_member` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`day` date NOT NULL,
	`start_hour` datetime NOT NULL,
	`end_hour` datetime NOT NULL,
	`space_used` bigint unsigned NOT NULL,
	CONSTRAINT `space_day_time_slot_for_member_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `membership_x_member` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`member_id` bigint unsigned NOT NULL,
	`membership_id` bigint unsigned NOT NULL,
	`start_date` datetime NOT NULL,
	`end_date` datetime,
	`reason_to_end` enum('SUSPENSION','TERMINATION','DISAFFILIATION'),
	CONSTRAINT `membership_x_member_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `member_type` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`description` varchar(250) NOT NULL,
	`inclusionCost` double NOT NULL,
	`exclusionCost` double NOT NULL,
	`isCanPayAndRegister` boolean NOT NULL,
	`costInMembershipFee` double NOT NULL,
	CONSTRAINT `member_type_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `academy` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`inscription_price_member` decimal(10,2) NOT NULL,
	`inscription_price_guest` decimal(10,2) NOT NULL,
	`capacity` int NOT NULL,
	`description` varchar(255),
	`allow_outsiders` boolean,
	CONSTRAINT `academy_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `club` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slogan` varchar(255) NOT NULL,
	`logo_url` text,
	`moratorium_rate` decimal(10,2) NOT NULL,
	`max_member_reservation_hours_per_day_and_space` int NOT NULL,
	`max_member_reservation_hours_per_day` int NOT NULL,
	`max_guests_number_per_month` int NOT NULL,
	`devolution_reservation_rate` decimal(10,2) NOT NULL,
	`devolution_event_inscription_rate` decimal(10,2) NOT NULL,
	`devolution_academy_inscription_rate` decimal(10,2) NOT NULL,
	CONSTRAINT `club_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `member_attached_document` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`fileName` varchar(50) NOT NULL,
	`fileUrl` varchar(50) NOT NULL,
	`member_request_id` bigint unsigned NOT NULL,
	`document_format_id` bigint unsigned NOT NULL,
	CONSTRAINT `member_attached_document_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`date` date NOT NULL,
	`start_hour` datetime NOT NULL,
	`end_hour` datetime NOT NULL,
	`space_used` varchar(255) NOT NULL,
	`ticket_price_member` decimal(10,2) NOT NULL,
	`ticket_price_guest` decimal(10,2),
	`capacity` int NOT NULL,
	`description` varchar(500) NOT NULL,
	`allow_outsiders` boolean NOT NULL,
	`number_of_assistants` int NOT NULL,
	`reservation_id` bigint unsigned NOT NULL,
	CONSTRAINT `event_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `membership_aplk` (
	`id` bigint unsigned NOT NULL,
	`applicantJobInfo` varchar(250) NOT NULL,
	CONSTRAINT `membership_aplk_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`lastname` varchar(100) NOT NULL,
	`name` varchar(100) NOT NULL,
	`document_type` enum('DNI','CE','PASSPORT') NOT NULL,
	`document_id` varchar(20) NOT NULL,
	`phone_number` varchar(20),
	`birth_date` date,
	`gender` enum('MALE','FEMALE','OTHER'),
	`address` text,
	`profile_picture_url` text,
	`account_id` bigint unsigned NOT NULL,
	CONSTRAINT `user_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reservation` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`date` date NOT NULL,
	`start_hour` datetime NOT NULL,
	`end_hour` datetime NOT NULL,
	`capacity` int NOT NULL,
	`allow_outsiders` boolean NOT NULL,
	`description` varchar(255),
	`space_id` bigint unsigned NOT NULL,
	CONSTRAINT `reservation_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auth` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`role` enum('ADMIN','MEMBER','GUEST') NOT NULL,
	`is_active` boolean NOT NULL,
	CONSTRAINT `auth_id` PRIMARY KEY(`id`),
	CONSTRAINT `auth_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `inscription_x_user` (
	`id` bigint unsigned NOT NULL,
	`is_cancelled` boolean NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	CONSTRAINT `inscription_x_user_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bill` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`final_amount` decimal(10,2) NOT NULL,
	`status` enum('PENDING','PAID','OVERDUE','CANCELLED') NOT NULL,
	`description` text,
	`created_at` datetime NOT NULL,
	`due_date` datetime,
	`user_id` bigint unsigned NOT NULL,
	CONSTRAINT `bill_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `reservation_inscription` ADD CONSTRAINT `custom_fk_inscription_x_user_id` FOREIGN KEY (`inscription_x_user`) REFERENCES `inscription_x_user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `member_exclusion_request` ADD CONSTRAINT `member_exclusion_request_id_member_request_id_fk` FOREIGN KEY (`id`) REFERENCES `member_request`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `member_exclusion_request` ADD CONSTRAINT `member_exclusion_request_id_Member_member_id_fk` FOREIGN KEY (`id_Member`) REFERENCES `member`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment` ADD CONSTRAINT `payment_id_bill_id_fk` FOREIGN KEY (`id`) REFERENCES `bill`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `academy_course` ADD CONSTRAINT `academy_course_academy_id_academy_id_fk` FOREIGN KEY (`academy_id`) REFERENCES `academy`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bill_detail` ADD CONSTRAINT `bill_detail_bill_id_bill_id_fk` FOREIGN KEY (`bill_id`) REFERENCES `bill`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee` ADD CONSTRAINT `employee_id_user_id_fk` FOREIGN KEY (`id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_inscription` ADD CONSTRAINT `event_inscription_events_id_event_id_fk` FOREIGN KEY (`events_id`) REFERENCES `event`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_inscription` ADD CONSTRAINT `event_inscription_inscription_x_user_inscription_x_user_id_fk` FOREIGN KEY (`inscription_x_user`) REFERENCES `inscription_x_user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `membership_fee_ticket` ADD CONSTRAINT `membership_fee_ticket_id_bill_detail_id_fk` FOREIGN KEY (`id`) REFERENCES `bill_detail`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `membership_fee_ticket` ADD CONSTRAINT `membership_fee_ticket_membership_id_membership_id_fk` FOREIGN KEY (`membership_id`) REFERENCES `membership`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rec_member` ADD CONSTRAINT `rec_member_member_id_member_id_fk` FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rec_member` ADD CONSTRAINT `rec_member_membership_application_id_membership_aplk_id_fk` FOREIGN KEY (`membership_application_id`) REFERENCES `membership_aplk`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_time_slot` ADD CONSTRAINT `course_time_slot_academy_course_id_academy_course_id_fk` FOREIGN KEY (`academy_course_id`) REFERENCES `academy_course`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_time_slot` ADD CONSTRAINT `course_time_slot_reservation_id_reservation_id_fk` FOREIGN KEY (`reservation_id`) REFERENCES `reservation`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `member_inclusion_request` ADD CONSTRAINT `member_inclusion_request_id_member_request_id_fk` FOREIGN KEY (`id`) REFERENCES `member_request`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `member_inclusion_request` ADD CONSTRAINT `member_inclusion_request_newMemberType_member_type_id_fk` FOREIGN KEY (`newMemberType`) REFERENCES `member_type`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auditory` ADD CONSTRAINT `auditory_account_id_auth_id_fk` FOREIGN KEY (`account_id`) REFERENCES `auth`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `member` ADD CONSTRAINT `member_id_user_id_fk` FOREIGN KEY (`id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `member` ADD CONSTRAINT `custom_fk_member_type_id` FOREIGN KEY (`member_type_id`) REFERENCES `member_type`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `academy_inscription` ADD CONSTRAINT `academy_inscription_academy_id_academy_id_fk` FOREIGN KEY (`academy_id`) REFERENCES `academy`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `academy_inscription` ADD CONSTRAINT `academy_inscription_inscription_x_user_inscription_x_user_id_fk` FOREIGN KEY (`inscription_x_user`) REFERENCES `inscription_x_user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `space_day_time_slot_for_member` ADD CONSTRAINT `space_day_time_slot_for_member_space_used_space_id_fk` FOREIGN KEY (`space_used`) REFERENCES `space`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `membership_x_member` ADD CONSTRAINT `membership_x_member_member_id_member_id_fk` FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `membership_x_member` ADD CONSTRAINT `membership_x_member_membership_id_membership_id_fk` FOREIGN KEY (`membership_id`) REFERENCES `membership`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `member_attached_document` ADD CONSTRAINT `custom_fk_member_request_id` FOREIGN KEY (`member_request_id`) REFERENCES `member_request`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `member_attached_document` ADD CONSTRAINT `custom_fk_document_format_id` FOREIGN KEY (`document_format_id`) REFERENCES `document_format`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event` ADD CONSTRAINT `event_reservation_id_reservation_id_fk` FOREIGN KEY (`reservation_id`) REFERENCES `reservation`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `membership_aplk` ADD CONSTRAINT `membership_aplk_id_member_request_id_fk` FOREIGN KEY (`id`) REFERENCES `member_request`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user` ADD CONSTRAINT `user_account_id_auth_id_fk` FOREIGN KEY (`account_id`) REFERENCES `auth`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reservation` ADD CONSTRAINT `reservation_space_id_space_id_fk` FOREIGN KEY (`space_id`) REFERENCES `space`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inscription_x_user` ADD CONSTRAINT `inscription_x_user_id_bill_detail_id_fk` FOREIGN KEY (`id`) REFERENCES `bill_detail`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inscription_x_user` ADD CONSTRAINT `inscription_x_user_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bill` ADD CONSTRAINT `bill_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `email_idx` ON `auth` (`email`);