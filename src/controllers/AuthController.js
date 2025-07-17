const AuthService = require('../services/AuthService');
const config = require('../config/server');

class AuthController {
  static async login(req, res) {
    try {
      const { username, password } = req.body;
      const result = await AuthService.login(username, password);

      if (result.success) {
        res.status(config.httpCodes.OK).json(result);
      } else {
        res.status(config.httpCodes.UNAUTHORIZED).json(result);
      }
    } catch (error) {
      console.error('Login controller error:', error);
      res.status(config.httpCodes.INTERNAL_ERROR).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Método temporal para verificar usuarios existentes
  static async checkUsers(req, res) {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const admins = await prisma.admin.findMany({
        select: {
          nombre: true,
          hashed: true
        }
      });

      const empleados = await prisma.empleado.findMany({
        select: {
          id_empleado: true,
          nombre: true,
          hashed: true
        }
      });

      res.json({
        success: true,
        data: {
          admins: admins.map(admin => ({
            nombre: admin.nombre,
            hasPassword: !!admin.hashed,
            passwordLength: admin.hashed ? admin.hashed.length : 0
          })),
          empleados: empleados.map(emp => ({
            id: emp.id_empleado,
            nombre: emp.nombre,
            hasPassword: !!emp.hashed,
            passwordLength: emp.hashed ? emp.hashed.length : 0
          }))
        }
      });
    } catch (error) {
      console.error('Check users error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking users'
      });
    }
  }
}

module.exports = AuthController;