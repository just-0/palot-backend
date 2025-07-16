const config = require('../config/server');

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.stack);

  // Error de validación
  if (err.name === 'ValidationError') {
    return res.status(config.httpCodes.BAD_REQUEST).json({
      success: false,
      message: 'Validation error',
      errors: err.errors
    });
  }

  // Error de base de datos
  if (err.code && err.code.startsWith('ER_')) {
    return res.status(config.httpCodes.INTERNAL_ERROR).json({
      success: false,
      message: 'Database error'
    });
  }

  // Error por defecto
  res.status(config.httpCodes.INTERNAL_ERROR).json({
    success: false,
    message: config.nodeEnv === 'development' ? err.message : 'Internal server error'
  });
};

module.exports = errorHandler;