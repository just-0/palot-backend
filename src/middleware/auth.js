const { PrismaClient } = require('@prisma/client');
const config = require('../config/server');

const prisma = new PrismaClient();

// Middleware para verificar si el usuario está autenticado
const authenticateUser = async (req, res, next) => {
  try {
    const { userid, usertype } = req.headers;
    if (!userid || !usertype) {
      return res.status(config.httpCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verificar que el usuario existe
    let user = null;
    if (usertype === 'admin') {
      user = await prisma.admin.findUnique({
        where: { nombre: userid }
      });
      //console.log('Admin found:', !!user);
    } else if (usertype === 'empleado') {
      user = await prisma.empleado.findUnique({
        where: { id_empleado: parseInt(userid) }
      });
      //console.log('Empleado found:', !!user);
    }

    if (!user) {
      return res.status(config.httpCodes.UNAUTHORIZED).json({
        success: false,
        message: 'User not found'
      });
    }

    // Agregar información del usuario a la request
    req.user = {
      id: userid,
      type: usertype,
      data: user
    };

    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(config.httpCodes.INTERNAL_ERROR).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Middleware para verificar si el usuario es administrador
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(config.httpCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.type !== 'admin') {
    return res.status(config.httpCodes.FORBIDDEN).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

// Middleware para verificar acceso a playa específica
const checkPlayaAccess = async (req, res, next) => {
  try {
    const playaId = req.params.id_playa || req.query.id_playa || req.body.id_playa;
    
    if (!playaId) {
      return res.status(config.httpCodes.BAD_REQUEST).json({
        success: false,
        message: 'Playa ID is required'
      });
    }

    // Si es admin, tiene acceso a todas las playas que administra
    if (req.user.type === 'admin') {
      const playa = await prisma.playa.findFirst({
        where: {
          id_playa: parseInt(playaId),
          nombre_admin: req.user.id
        }
      });

      if (!playa) {
        return res.status(config.httpCodes.FORBIDDEN).json({
          success: false,
          message: 'Access denied to this playa'
        });
      }
    } 
    // Si es empleado, verificar que tenga acceso a esta playa
    else if (req.user.type === 'empleado') {
      const trabaja = await prisma.trabaja.findFirst({
        where: {
          id_empleado: parseInt(req.user.id),
          id_playa: parseInt(playaId)
        }
      });

      if (!trabaja) {
        return res.status(config.httpCodes.FORBIDDEN).json({
          success: false,
          message: 'Access denied to this playa'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Playa access check error:', error);
    res.status(config.httpCodes.INTERNAL_ERROR).json({
      success: false,
      message: 'Access verification error'
    });
  }
};

module.exports = {
  authenticateUser,
  requireAdmin,
  checkPlayaAccess
};