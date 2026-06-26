CREATE TABLE `contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`company` varchar(255),
	`address` text,
	`taxId` varchar(50),
	`totalRevenue` decimal(10,2) NOT NULL DEFAULT '0',
	`invoiceCount` int NOT NULL DEFAULT 0,
	`notes` text,
	`tags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `elsterChatHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`model` varchar(50) NOT NULL DEFAULT 'gpt-4o',
	`tokensUsed` int,
	`helpful` boolean,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `elsterChatHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` datetime NOT NULL,
	`description` varchar(255) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`category` varchar(50) NOT NULL,
	`deductiblePercentage` int NOT NULL DEFAULT 100,
	`receipt` boolean NOT NULL DEFAULT false,
	`receiptUrl` varchar(512),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`number` varchar(50) NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`clientAddress` text,
	`clientEmail` varchar(320),
	`clientTaxId` varchar(50),
	`senderName` varchar(255) NOT NULL,
	`senderAddress` text,
	`senderTaxId` varchar(50),
	`issueDate` datetime NOT NULL,
	`dueDate` datetime NOT NULL,
	`subtotal` decimal(10,2) NOT NULL,
	`taxAmount` decimal(10,2) NOT NULL DEFAULT '0',
	`total` decimal(10,2) NOT NULL,
	`status` enum('draft','sent','paid','overdue') NOT NULL DEFAULT 'draft',
	`isKleinunternehmer` boolean NOT NULL DEFAULT false,
	`notes` text,
	`pdfUrl` varchar(512),
	`lineItems` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`isKleinunternehmer` boolean NOT NULL DEFAULT false,
	`businessName` varchar(255),
	`businessAddress` text,
	`taxNumber` varchar(50),
	`vatId` varchar(50),
	`invoicePrefix` varchar(20) NOT NULL DEFAULT 'RE',
	`nextInvoiceNumber` int NOT NULL DEFAULT 1,
	`currency` varchar(3) NOT NULL DEFAULT 'EUR',
	`language` varchar(5) NOT NULL DEFAULT 'de',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `userSettings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `vatReminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('voranmeldung','jahreserklarung','einkommensteuererklarung','custom') NOT NULL,
	`year` int NOT NULL,
	`month` int,
	`dueDate` datetime NOT NULL,
	`completed` boolean NOT NULL DEFAULT false,
	`completedDate` datetime,
	`notificationEnabled` boolean NOT NULL DEFAULT true,
	`notificationDaysBefore` int NOT NULL DEFAULT 7,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vatReminders_id` PRIMARY KEY(`id`)
);
