const express = require('express');
const VehicleController = require('../controllers/VehicleController');
const { validatePlayaId, validateVehicleId, validateManualVehicle } = require('../middleware/validation');

const router = express.Router();

/**
 * @route GET /api/vehicles/autos
 * @desc Get autos by playa
 * @access Public
 */
router.get('/autos', validatePlayaId, VehicleController.getAutos);

/**
 * @route GET /api/vehicles/motos
 * @desc Get motos by playa
 * @access Public
 */
router.get('/motos', validatePlayaId, VehicleController.getMotos);

/**
 * @route PUT /api/vehicles/autos/:id_auto/state
 * @desc Update auto state
 * @access Public
 */
router.put('/autos/:id_auto/state', validateVehicleId, VehicleController.updateAutoState);

/**
 * @route PUT /api/vehicles/motos/:id_moto/state
 * @desc Update moto state
 * @access Public
 */
router.put('/motos/:id_moto/state', validateVehicleId, VehicleController.updateMotoState);

/**
 * @route PUT /api/vehicles/autos/payment
 * @desc Process auto payment
 * @access Public
 */
router.put('/autos/payment', VehicleController.processAutoPayment);

/**
 * @route PUT /api/vehicles/motos/payment
 * @desc Process moto payment
 * @access Public
 */
router.put('/motos/payment', VehicleController.processMotoPayment);

/**
 * @route PUT /api/vehicles/autos/manual
 * @desc Create manual auto
 * @access Public
 */
router.put('/autos/manual', validateManualVehicle, VehicleController.createManualAuto);

/**
 * @route PUT /api/vehicles/motos/manual
 * @desc Create manual moto
 * @access Public
 */
router.put('/motos/manual', validateManualVehicle, VehicleController.createManualMoto);

/**
 * @route GET /api/vehicles/boletas
 * @desc Get boletas by playa
 * @access Public
 */
router.get('/boletas', validatePlayaId, VehicleController.getBoletas);

module.exports = router;