-- CreateTable
CREATE TABLE `Admin` (
    `nombre` VARCHAR(191) NOT NULL,
    `hashed` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`nombre`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Playa` (
    `id_playa` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_admin` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `direccion` VARCHAR(191) NULL,
    `hashed` VARCHAR(191) NULL,
    `tarifaAuto` DOUBLE NULL,
    `tarifaMoto` DOUBLE NULL,

    PRIMARY KEY (`id_playa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Auto` (
    `id_auto` INTEGER NOT NULL AUTO_INCREMENT,
    `id_playa` INTEGER NOT NULL,
    `placa` VARCHAR(191) NOT NULL,
    `hora_entrada` DATETIME(3) NOT NULL,
    `hora_salida` DATETIME(3) NULL,
    `image` VARCHAR(191) NULL,
    `state` INTEGER NULL,

    PRIMARY KEY (`id_auto`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Moto` (
    `id_moto` INTEGER NOT NULL AUTO_INCREMENT,
    `id_playa` INTEGER NOT NULL,
    `placa` VARCHAR(191) NOT NULL,
    `hora_entrada` DATETIME(3) NOT NULL,
    `hora_salida` DATETIME(3) NULL,
    `image` VARCHAR(191) NULL,
    `state` INTEGER NULL,

    PRIMARY KEY (`id_moto`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cliente` (
    `id_cliente` INTEGER NOT NULL AUTO_INCREMENT,
    `id_auto` INTEGER NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `dni_ruc` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Cliente_id_auto_key`(`id_auto`),
    PRIMARY KEY (`id_cliente`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Boleta` (
    `id_boleta` INTEGER NOT NULL AUTO_INCREMENT,
    `id_auto` INTEGER NOT NULL,
    `id_cliente` INTEGER NOT NULL,
    `total_pagar` DOUBLE NOT NULL,
    `fecha_emision` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id_boleta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Empleado` (
    `id_empleado` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `numDias` INTEGER NULL,
    `hashed` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id_empleado`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Trabaja` (
    `id_empleado` INTEGER NOT NULL,
    `id_playa` INTEGER NOT NULL,

    PRIMARY KEY (`id_empleado`, `id_playa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Playa` ADD CONSTRAINT `Playa_nombre_admin_fkey` FOREIGN KEY (`nombre_admin`) REFERENCES `Admin`(`nombre`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Auto` ADD CONSTRAINT `Auto_id_playa_fkey` FOREIGN KEY (`id_playa`) REFERENCES `Playa`(`id_playa`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Moto` ADD CONSTRAINT `Moto_id_playa_fkey` FOREIGN KEY (`id_playa`) REFERENCES `Playa`(`id_playa`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cliente` ADD CONSTRAINT `Cliente_id_auto_fkey` FOREIGN KEY (`id_auto`) REFERENCES `Auto`(`id_auto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Boleta` ADD CONSTRAINT `Boleta_id_auto_fkey` FOREIGN KEY (`id_auto`) REFERENCES `Auto`(`id_auto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Boleta` ADD CONSTRAINT `Boleta_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `Cliente`(`id_cliente`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Trabaja` ADD CONSTRAINT `Trabaja_id_empleado_fkey` FOREIGN KEY (`id_empleado`) REFERENCES `Empleado`(`id_empleado`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Trabaja` ADD CONSTRAINT `Trabaja_id_playa_fkey` FOREIGN KEY (`id_playa`) REFERENCES `Playa`(`id_playa`) ON DELETE RESTRICT ON UPDATE CASCADE;
