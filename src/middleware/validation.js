const config = require('../config/server');

const validateLogin = (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(config.httpCodes.BAD_REQUEST).json({
      success: false,
      message: 'Username and password are required'
    });
  }

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(config.httpCodes.BAD_REQUEST).json({
      success: false,
      message: 'Username and password must be strings'
    });
  }

  next();
};

const validatePlayaId = (req, res, next) => {
  const idPlaya = req.query.idPlaya || req.query.id_playa;

  if (!idPlaya) {
    return res.status(config.httpCodes.BAD_REQUEST).json({
      success: false,
      message: 'Playa ID is required'
    });
  }

  if (isNaN(parseInt(idPlaya))) {
    return res.status(config.httpCodes.BAD_REQUEST).json({
      success: false,
      message: 'Playa ID must be a number'
    });
  }

  next();
};

const validateVehicleId = (req, res, next) => {
  const id = req.params.id_auto || req.params.id_moto;

  if (!id) {
    return res.status(config.httpCodes.BAD_REQUEST).json({
      success: false,
      message: 'Vehicle ID is required'
    });
  }

  if (isNaN(parseInt(id))) {
    return res.status(config.httpCodes.BAD_REQUEST).json({
      success: false,
      message: 'Vehicle ID must be a number'
    });
  }

  next();
};

const validateManualVehicle = (req, res, next) => {
  const { placa, id_playa, horaEntrada, state } = req.body;

  if (!placa || !id_playa || !horaEntrada || state === undefined) {
    return res.status(config.httpCodes.BAD_REQUEST).json({
      success: false,
      message: 'All fields are required: placa, id_playa, horaEntrada, state'
    });
  }

  if (typeof placa !== 'string') {
    return res.status(config.httpCodes.BAD_REQUEST).json({
      success: false,
      message: 'Placa must be a string'
    });
  }

  if (isNaN(parseInt(id_playa)) || isNaN(parseInt(state))) {
    return res.status(config.httpCodes.BAD_REQUEST).json({
      success: false,
      message: 'id_playa and state must be numbers'
    });
  }

  next();
};

module.exports = {
  validateLogin,
  validatePlayaId,
  validateVehicleId,
  validateManualVehicle
};