/*
  Warnings:

  - You are about to drop the column `numDias` on the `Empleado` table. All the data in the column will be lost.
  - You are about to drop the column `hashed` on the `Playa` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Boleta` DROP FOREIGN KEY `Boleta_id_cliente_fkey`;

-- DropForeignKey
ALTER TABLE `Cliente` DROP FOREIGN KEY `Cliente_id_auto_fkey`;

-- AlterTable
ALTER TABLE `Boleta` MODIFY `id_cliente` INTEGER NULL;

-- AlterTable
ALTER TABLE `Cliente` MODIFY `id_auto` INTEGER NULL;

-- AlterTable
ALTER TABLE `Empleado` DROP COLUMN `numDias`;

-- AlterTable
ALTER TABLE `Playa` DROP COLUMN `hashed`,
    ADD COLUMN `estado` VARCHAR(191) NOT NULL DEFAULT 'cerrado',
    ADD COLUMN `facturacion` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `horaAbierto` DATETIME(3) NULL,
    ADD COLUMN `horaCerrado` DATETIME(3) NULL,
    ADD COLUMN `usuarioAbrio` VARCHAR(191) NULL,
    ADD COLUMN `usuarioCerro` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Ticket` (
    `id_ticket` INTEGER NOT NULL AUTO_INCREMENT,
    `id_auto` INTEGER NULL,
    `id_moto` INTEGER NULL,
    `id_cliente` INTEGER NULL,
    `total_pagar` DOUBLE NOT NULL,
    `fecha_emision` DATETIME(3) NOT NULL,

    INDEX `Ticket_id_auto_fkey`(`id_auto`),
    INDEX `Ticket_id_moto_fkey`(`id_moto`),
    INDEX `Ticket_id_cliente_fkey`(`id_cliente`),
    PRIMARY KEY (`id_ticket`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Cliente` ADD CONSTRAINT `Cliente_id_auto_fkey` FOREIGN KEY (`id_auto`) REFERENCES `Auto`(`id_auto`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Boleta` ADD CONSTRAINT `Boleta_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `Cliente`(`id_cliente`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_id_auto_fkey` FOREIGN KEY (`id_auto`) REFERENCES `Auto`(`id_auto`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_id_moto_fkey` FOREIGN KEY (`id_moto`) REFERENCES `Moto`(`id_moto`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `Cliente`(`id_cliente`) ON DELETE SET NULL ON UPDATE CASCADE;
