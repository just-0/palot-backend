const config = require("../config/server");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

class PlayaController {
  static async getAllPlayas(req, res) {
    try {
      let playas = [];

      if (req.user.type === "admin") {
        // ADMIN ve TODAS las playas del sistema (sin filtro

        playas = await prisma.playa.findMany({
          // SIN WHERE - Admin ve todas las playas
          select: {
            id_playa: true,
            nombre: true,
            direccion: true,
            tarifaAuto: true,
            tarifaMoto: true,
            estado: true,
            horaAbierto: true,
            horaCerrado: true,
            usuarioAbrio: true,
            usuarioCerro: true,
            Auto: {
              select: { id_auto: true, state: true },
            },
            Moto: {
              select: { id_moto: true, state: true },
            },
          },
        });
      } else if (req.user.type === "empleado") {
        // Empleado ve solo las playas asignadas
        const trabajaRecords = await prisma.trabaja.findMany({
          where: { id_empleado: parseInt(req.user.id) },
          include: {
            Playa: {
              select: {
                id_playa: true,
                nombre: true,
                direccion: true,
                tarifaAuto: true,
                tarifaMoto: true,
                estado: true,
                horaAbierto: true,
                horaCerrado: true,
                usuarioAbrio: true,
                usuarioCerro: true,
                Auto: {
                  select: { id_auto: true, state: true },
                },
                Moto: {
                  select: { id_moto: true, state: true },
                },
              },
            },
          },
        });
        playas = trabajaRecords.map((t) => t.Playa);
      }

      res.status(config.httpCodes.OK).json(playas);
    } catch (error) {
      console.error("Get playas controller error:", error);
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Crear nueva playa (solo para admin)
  static async createPlaya(req, res) {
    try {
      const { nombre_admin, nombre, direccion, tarifaAuto, tarifaMoto } =
        req.body;

      // Validar datos requeridos
      if (!nombre_admin || !nombre) {
        return res.status(config.httpCodes.BAD_REQUEST).json({
          success: false,
          message: "Nombre del admin y nombre de la playa son requeridos",
        });
      }

      // Verificar que el admin existe
      const adminExists = await prisma.admin.findUnique({
        where: { nombre: nombre_admin },
      });

      if (!adminExists) {
        return res.status(config.httpCodes.BAD_REQUEST).json({
          success: false,
          message: "El administrador especificado no existe",
        });
      }

      // Crear la playa
      const newPlaya = await prisma.playa.create({
        data: {
          nombre_admin,
          nombre,
          direccion: direccion || null,
          tarifaAuto: tarifaAuto ? parseFloat(tarifaAuto) : null,
          tarifaMoto: tarifaMoto ? parseFloat(tarifaMoto) : null,
        },
      });

      res.status(config.httpCodes.CREATED).json({
        success: true,
        message: "Playa creada exitosamente",
        data: newPlaya,
      });
    } catch (error) {
      console.error("Create playa controller error:", error);

      // Manejar errores específicos de Prisma
      if (error.code === "P2002") {
        return res.status(config.httpCodes.BAD_REQUEST).json({
          success: false,
          message: "Ya existe una playa con ese nombre",
        });
      }

      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  // Actualizar playa
  static async updatePlaya(req, res) {
    try {
      const { id } = req.params;
      const { nombre, direccion, tarifaAuto, tarifaMoto } = req.body;

      const updatedPlaya = await prisma.playa.update({
        where: { id_playa: parseInt(id) },
        data: {
          nombre: nombre || undefined,
          direccion: direccion !== undefined ? direccion : undefined,
          tarifaAuto: tarifaAuto ? parseFloat(tarifaAuto) : undefined,
          tarifaMoto: tarifaMoto ? parseFloat(tarifaMoto) : undefined,
        },
      });

      res.status(config.httpCodes.OK).json({
        success: true,
        message: "Playa actualizada exitosamente",
        data: updatedPlaya,
      });
    } catch (error) {
      console.error("Update playa controller error:", error);
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: "Error al actualizar la playa",
      });
    }
  }

  // Eliminar playa
  static async deletePlaya(req, res) {
    try {
      const { id } = req.params;
      const playaId = parseInt(id);

      // Usar transacción para eliminar todo de forma segura
      await prisma.$transaction(async (tx) => {
        // 1. Eliminar boletas relacionadas con autos de esta playa
        const autos = await tx.auto.findMany({
          where: { id_playa: playaId },
          select: { id_auto: true }
        });
        
        for (const auto of autos) {
          await tx.boleta.deleteMany({
            where: { id_auto: auto.id_auto }
          });
        }

        // 2. Eliminar clientes relacionados con autos de esta playa
        await tx.cliente.deleteMany({
          where: {
            Auto: {
              id_playa: playaId
            }
          }
        });

        // 3. Eliminar autos de esta playa
        await tx.auto.deleteMany({
          where: { id_playa: playaId }
        });

        // 4. Eliminar motos de esta playa
        await tx.moto.deleteMany({
          where: { id_playa: playaId }
        });

        // 5. Eliminar relaciones de trabajo (empleados asignados)
        await tx.trabaja.deleteMany({
          where: { id_playa: playaId }
        });

        // 6. Finalmente eliminar la playa
        await tx.playa.delete({
          where: { id_playa: playaId }
        });
      });

      res.status(config.httpCodes.OK).json({
        success: true,
        message: "Playa eliminada exitosamente",
      });
    } catch (error) {
      console.error("Delete playa controller error:", error);
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: "Error al eliminar la playa",
      });
    }
  }

  // Obtener todas las playas para gestión de usuarios (sin autenticación)
  static async getAllPlayasForUserManagement(req, res) {
    try {
      const playas = await prisma.playa.findMany({
        select: {
          id_playa: true,
          nombre: true,
        },
      });

      res.status(config.httpCodes.OK).json(playas);
    } catch (error) {
      console.error("Get all playas for user management error:", error);
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: "Error al obtener las playas",
      });
    }
  }

  // Abrir playa
  static async abrirPlaya(req, res) {
    try {
      const { id } = req.params;
      const { usuarioAbrio } = req.body;

      // Verificar que la playa existe
      const playa = await prisma.playa.findUnique({
        where: { id_playa: parseInt(id) }
      });

      if (!playa) {
        return res.status(config.httpCodes.NOT_FOUND).json({
          success: false,
          message: "Playa no encontrada"
        });
      }

      // Verificar que la playa no esté ya abierta
      if (playa.estado === 'abierto') {
        return res.status(config.httpCodes.BAD_REQUEST).json({
          success: false,
          message: "La playa ya está abierta"
        });
      }

      // Determinar si es primera apertura o reapertura
      const isReapertura = playa.horaAbierto && playa.horaCerrado;
      const now = new Date();

      let updateData = {
        estado: 'abierto',
        usuarioAbrio: usuarioAbrio
      };

      // Si es primera apertura del día o reapertura, actualizar horaAbierto
      if (!playa.horaAbierto || isReapertura) {
        updateData.horaAbierto = now;
      }

      // Si es reapertura, limpiar datos de cierre
      if (isReapertura) {
        updateData.horaCerrado = null;
        updateData.usuarioCerro = null;
      }

      // Abrir la playa
      const playaAbierta = await prisma.playa.update({
        where: { id_playa: parseInt(id) },
        data: updateData
      });

      const message = isReapertura ? "Playa reabierta exitosamente" : "Playa abierta exitosamente";

      res.status(config.httpCodes.OK).json({
        success: true,
        message: message,
        data: playaAbierta
      });
    } catch (error) {
      console.error("Abrir playa controller error:", error);
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: "Error al abrir la playa"
      });
    }
  }

  // Cerrar playa
  static async cerrarPlaya(req, res) {
    try {
      const { id } = req.params;
      const { usuarioCerro } = req.body;

      // Verificar que la playa existe
      const playa = await prisma.playa.findUnique({
        where: { id_playa: parseInt(id) }
      });

      if (!playa) {
        return res.status(config.httpCodes.NOT_FOUND).json({
          success: false,
          message: "Playa no encontrada"
        });
      }

      // Verificar que la playa esté abierta
      if (playa.estado === 'cerrado') {
        return res.status(config.httpCodes.BAD_REQUEST).json({
          success: false,
          message: "La playa ya está cerrada"
        });
      }

      // Cerrar la playa
      const playaCerrada = await prisma.playa.update({
        where: { id_playa: parseInt(id) },
        data: {
          estado: 'cerrado',
          horaCerrado: new Date(),
          usuarioCerro: usuarioCerro
        }
      });

      res.status(config.httpCodes.OK).json({
        success: true,
        message: "Playa cerrada exitosamente",
        data: playaCerrada
      });
    } catch (error) {
      console.error("Cerrar playa controller error:", error);
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: "Error al cerrar la playa"
      });
    }
  }

  // Obtener playa específica
  static async getPlayaById(req, res) {
    try {
      const { id } = req.params;

      const playa = await prisma.playa.findUnique({
        where: { id_playa: parseInt(id) },
        include: {
          Auto: {
            include: {
              Cliente: true,
              Boleta: true,
            },
          },
          Moto: true,
          Admin: {
            select: { nombre: true },
          },
          Trabaja: {
            include: {
              Empleado: {
                select: { id_empleado: true, nombre: true },
              },
            },
          },
        },
      });

      if (!playa) {
        return res.status(config.httpCodes.NOT_FOUND).json({
          success: false,
          message: "Playa no encontrada",
        });
      }

      res.status(config.httpCodes.OK).json({
        success: true,
        data: playa,
      });
    } catch (error) {
      console.error("Get playa by ID controller error:", error);
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: "Error al obtener la playa",
      });
    }
  }
}

module.exports = PlayaController;
