const Admin = require("../models/Admin");
const config = require("../config/server");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

class AuthService {
  static async login(username, password) {
    try {
      if (!username || !password) {
        return {
          success: false,
          code: config.loginErrors.DB_ERROR,
          message: "Username and password are required",
        };
      }

      // Primero buscar en admins
      let user = await prisma.admin.findUnique({
        where: { nombre: username },
        include: {
          Playa: {
            select: {
              id_playa: true,
              nombre: true,
            },
          },
        },
      });

      let userType = "admin";
      let userPlayas = [];

      // Si no es admin, buscar en empleados
      if (!user) {
        user = await prisma.empleado.findFirst({
          where: { nombre: username },
          include: {
            Trabaja: {
              include: {
                Playa: {
                  select: {
                    id_playa: true,
                    nombre: true,
                  },
                },
              },
            },
          },
        });
        userType = "empleado";
      }

      if (!user) {
        return {
          success: false,
          code: config.loginErrors.USER_NOT_FOUND,
          message: "User not found",
        };
      }

      // Verificar contraseña (usando bcrypt para nuevos usuarios, string directo para compatibilidad)
      let passwordValid = false;
      try {
        passwordValid = await bcrypt.compare(password, user.hashed);
      } catch (error) {
        // Fallback para contraseñas sin hash (compatibilidad)
        passwordValid = password === user.hashed;
      }

      if (!passwordValid) {
        return {
          success: false,
          code: config.loginErrors.WRONG_PASSWORD,
          message: "Invalid password",
        };
      }

      // Preparar información de playas según el tipo de usuario
      if (userType === "admin") {
        userPlayas = user.Playa || [];
      } else {
        userPlayas = user.Trabaja ? user.Trabaja.map((t) => t.Playa) : [];
      }

      return {
        success: true,
        message: "Login successful",
        user: {
          id: userType === "admin" ? user.nombre : user.id_empleado,
          nombre: user.nombre,
          tipo: userType,
          playas: userPlayas,
          numDias: userType === "empleado" ? user.numDias : null,
        },
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        code: config.loginErrors.DB_ERROR,
        message: "Database error",
      };
    }
  }
}

module.exports = AuthService;
