-- CreateTable
CREATE TABLE `AppSettings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'global',
    `branchFormat` VARCHAR(120) NOT NULL DEFAULT '{tipo}/{num-task}-{slug}',
    `defaultBranchType` VARCHAR(40) NOT NULL DEFAULT 'task',
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `description` LONGTEXT NULL,
    `observations` LONGTEXT NULL,
    `branchFormat` VARCHAR(120) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Project_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectLink` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProjectLink_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Task` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NULL,
    `title` VARCHAR(200) NOT NULL,
    `summary` TEXT NOT NULL,
    `cardNumber` VARCHAR(40) NULL,
    `status` VARCHAR(40) NOT NULL DEFAULT 'development',
    `branchType` VARCHAR(40) NOT NULL DEFAULT 'task',
    `suggestedBranchType` VARCHAR(40) NULL,
    `branchTypeReason` TEXT NULL,
    `slug` VARCHAR(200) NOT NULL,
    `branchName` VARCHAR(255) NOT NULL,
    `branchManual` BOOLEAN NOT NULL DEFAULT false,
    `tagsJson` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Task_projectId_idx`(`projectId`),
    INDEX `Task_branchType_idx`(`branchType`),
    INDEX `Task_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TaskEvent` (
    `id` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(40) NOT NULL,
    `previousValue` TEXT NULL,
    `newValue` TEXT NULL,
    `userName` VARCHAR(120) NOT NULL DEFAULT 'Usuário',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TaskEvent_taskId_createdAt_idx`(`taskId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WikiArticle` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `summary` TEXT NOT NULL,
    `content` LONGTEXT NOT NULL,
    `category` VARCHAR(80) NULL,
    `tagsJson` TEXT NOT NULL,
    `projectId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WikiArticle_slug_key`(`slug`),
    INDEX `WikiArticle_category_idx`(`category`),
    INDEX `WikiArticle_projectId_idx`(`projectId`),
    INDEX `WikiArticle_updatedAt_idx`(`updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProjectLink` ADD CONSTRAINT `ProjectLink_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TaskEvent` ADD CONSTRAINT `TaskEvent_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
