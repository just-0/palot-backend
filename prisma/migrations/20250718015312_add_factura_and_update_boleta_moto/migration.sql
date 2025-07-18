-- DropForeignKey
ALTER TABLE `Boleta` DROP FOREIGN KEY `Boleta_id_auto_fkey`;

-- AlterTable
ALTER TABLE `Boleta` ADD COLUMN `id_moto` INTEGER NULL,
    MODIFY `id_auto` INTEGER NULL;

-- CreateTable
CREATE TABLE `Factura` (
    `id_factura` INTEGER NOT NULL AUTO_INCREMENT,
    `id_auto` INTEGER NULL,
    `id_moto` INTEGER NULL,
    `id_cliente` INTEGER NULL,
    `total_pagar` DOUBLE NOT NULL,
    `fecha_emision` DATETIME(3) NOT NULL,

    INDEX `Factura_id_auto_fkey`(`id_auto`),
    INDEX `Factura_id_moto_fkey`(`id_moto`),
    INDEX `Factura_id_cliente_fkey`(`id_cliente`),
    PRIMARY KEY (`id_factura`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Boleta_id_moto_fkey` ON `Boleta`(`id_moto`);

-- AddForeignKey
ALTER TABLE `Boleta` ADD CONSTRAINT `Boleta_id_auto_fkey` FOREIGN KEY (`id_auto`) REFERENCES `Auto`(`id_auto`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Boleta` ADD CONSTRAINT `Boleta_id_moto_fkey` FOREIGN KEY (`id_moto`) REFERENCES `Moto`(`id_moto`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Factura` ADD CONSTRAINT `Factura_id_auto_fkey` FOREIGN KEY (`id_auto`) REFERENCES `Auto`(`id_auto`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Factura` ADD CONSTRAINT `Factura_id_moto_fkey` FOREIGN KEY (`id_moto`) REFERENCES `Moto`(`id_moto`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Factura` ADD CONSTRAINT `Factura_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `Cliente`(`id_cliente`) ON DELETE SET NULL ON UPDATE CASCADE;
