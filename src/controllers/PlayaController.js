const PlayaService = require('../services/PlayaService');
const config = require('../config/server');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class PlayaController {
  static async getAllPlayas(req, res) {
    try {
      const result = await PlayaService.getAllPlayas();

      if (result.success) {
        res.status(config.httpCodes.OK).json(result.data);
      } else {
        res.status(config.httpCodes.INTERNAL_ERROR).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Get playas controller error:', error);
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Crear nueva playa (solo para admin)
  static async createPlaya(req, res) {
    try {
      const { nombre_admin, nombre, direccion, tarifaAuto, tarifaMoto } = req.body;

      // Validar datos requeridos
      if (!nombre_admin || !nombre) {
        return res.status(config.httpCodes.BAD_REQUEST).json({
          success: false,
          message: 'Nombre del admin y nombre de la playa son requeridos'
        });
      }

      // Verificar que el admin existe
      const adminExists = await prisma.admin.findUnique({
        where: { nombre: nombre_admin }
      });

      if (!adminExists) {
        return res.status(config.httpCodes.BAD_REQUEST).json({
          success: false,
          message: 'El administrador especificado no existe'
        });
      }

      // Crear la playa
      const newPlaya = await prisma.playa.create({
        data: {
          nombre_admin,
          nombre,
          direccion: direccion || null,
          tarifaAuto: tarifaAuto ? parseFloat(tarifaAuto) : null,
          tarifaMoto: tarifaMoto ? parseFloat(tarifaMoto) : null
        }
      });

      res.status(config.httpCodes.CREATED).json({
        success: true,
        message: 'Playa creada exitosamente',
        data: newPlaya
      });
    } catch (error) {
      console.error('Create playa controller error:', error);
      
      // Manejar errores específicos de Prisma
      if (error.code === 'P2002') {
        return res.status(config.httpCodes.BAD_REQUEST).json({
          success: false,
          message: 'Ya existe una playa con ese nombre'
        });
      }

      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: 'Error interno del servidor'
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
          tarifaMoto: tarifaMoto ? parseFloat(tarifaMoto) : undefined
        }
      });

      res.status(config.httpCodes.OK).json({
        success: true,
        message: 'Playa actualizada exitosamente',
        data: updatedPlaya
      });
    } catch (error) {
      console.error('Update playa controller error:', error);
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: 'Error al actualizar la playa'
      });
    }
  }

  // Eliminar playa
  static async deletePlaya(req, res) {
    try {
      const { id } = req.params;

      await prisma.playa.delete({
        where: { id_playa: parseInt(id) }
      });

      res.status(config.httpCodes.OK).json({
        success: true,
        message: 'Playa eliminada exitosamente'
      });
    } catch (error) {
      console.error('Delete playa controller error:', error);
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: 'Error al eliminar la playa'
      });
    }
  }
}

module.exports = PlayaController;