const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

class UserController {
  // Obtener todos los usuarios (solo para admin)
  static async getAllUsers(req, res) {
    try {
      const admins = await prisma.admin.findMany({
        include: {
          Playa: {
            select: {
              id_playa: true,
              nombre: true
            }
          }
        }
      });

      const empleados = await prisma.empleado.findMany({
        include: {
          Trabaja: {
            include: {
              Playa: {
                select: {
                  id_playa: true,
                  nombre: true
                }
              }
            }
          }
        }
      });

      const users = [
        ...admins.map(admin => ({
          id: admin.nombre,
          nombre: admin.nombre,
          tipo: 'admin',
          playas: admin.Playa
        })),
        ...empleados.map(empleado => ({
          id: empleado.id_empleado,
          nombre: empleado.nombre,
          tipo: 'empleado',
          numDias: empleado.numDias,
          playas: empleado.Trabaja.map(t => t.Playa)
        }))
      ];

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener usuarios'
      });
    }
  }

  // Crear nuevo usuario
  static async createUser(req, res) {
    try {
      const { nombre, password, tipo, numDias, playasAsignadas } = req.body;

      // Validar datos requeridos
      if (!nombre || !password || !tipo) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, contraseña y tipo son requeridos'
        });
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      let newUser;

      if (tipo === 'admin') {
        // Crear admin
        newUser = await prisma.admin.create({
          data: {
            nombre,
            hashed: hashedPassword
          }
        });
      } else if (tipo === 'empleado') {
        // Crear empleado
        newUser = await prisma.empleado.create({
          data: {
            nombre,
            hashed: hashedPassword,
            numDias: numDias || 0
          }
        });

        // Asignar playas al empleado si se proporcionaron
        if (playasAsignadas && playasAsignadas.length > 0) {
          const trabajaData = playasAsignadas.map(playaId => ({
            id_empleado: newUser.id_empleado,
            id_playa: parseInt(playaId)
          }));

          await prisma.trabaja.createMany({
            data: trabajaData
          });
        }
      }

      res.json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: newUser
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear usuario'
      });
    }
  }

  // Actualizar usuario
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { nombre, password, numDias, playasAsignadas, tipo } = req.body;

      let updateData = { nombre };

      // Si se proporciona nueva contraseña, hashearla
      if (password) {
        updateData.hashed = await bcrypt.hash(password, 10);
      }

      let updatedUser;

      if (tipo === 'admin') {
        updatedUser = await prisma.admin.update({
          where: { nombre: id },
          data: updateData
        });
      } else if (tipo === 'empleado') {
        if (numDias !== undefined) {
          updateData.numDias = numDias;
        }

        updatedUser = await prisma.empleado.update({
          where: { id_empleado: parseInt(id) },
          data: updateData
        });

        // Actualizar asignación de playas
        if (playasAsignadas !== undefined) {
          // Eliminar asignaciones existentes
          await prisma.trabaja.deleteMany({
            where: { id_empleado: parseInt(id) }
          });

          // Crear nuevas asignaciones
          if (playasAsignadas.length > 0) {
            const trabajaData = playasAsignadas.map(playaId => ({
              id_empleado: parseInt(id),
              id_playa: parseInt(playaId)
            }));

            await prisma.trabaja.createMany({
              data: trabajaData
            });
          }
        }
      }

      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: updatedUser
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar usuario'
      });
    }
  }

  // Eliminar usuario
  static async deleteUser(req, res) {
    try {
      const { id, tipo } = req.params;

      if (tipo === 'admin') {
        await prisma.admin.delete({
          where: { nombre: id }
        });
      } else if (tipo === 'empleado') {
        // Primero eliminar las relaciones en Trabaja
        await prisma.trabaja.deleteMany({
          where: { id_empleado: parseInt(id) }
        });

        // Luego eliminar el empleado
        await prisma.empleado.delete({
          where: { id_empleado: parseInt(id) }
        });
      }

      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar usuario'
      });
    }
  }

  // Obtener playas asignadas a un empleado
  static async getUserPlayas(req, res) {
    try {
      const { id, tipo } = req.params;

      let playas = [];

      if (tipo === 'admin') {
        // Admin puede ver todas las playas
        playas = await prisma.playa.findMany({
          where: { nombre_admin: id }
        });
      } else if (tipo === 'empleado') {
        // Empleado solo ve sus playas asignadas
        const trabajaRecords = await prisma.trabaja.findMany({
          where: { id_empleado: parseInt(id) },
          include: {
            Playa: true
          }
        });
        playas = trabajaRecords.map(t => t.Playa);
      }

      res.json({
        success: true,
        data: playas
      });
    } catch (error) {
      console.error('Error getting user playas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener playas del usuario'
      });
    }
  }
}

module.exports = UserController;