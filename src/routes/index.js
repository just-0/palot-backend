const express = require('express');
const authRoutes = require('./auth');
const playaRoutes = require('./playas');
const vehicleRoutes = require('./vehicles');
const cameraRoutes = require('./camera');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
router.use('/auth', authRoutes);
router.use('/playas', playaRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/camera', cameraRoutes);

// Legacy routes for backward compatibility
const AuthController = require('../controllers/AuthController');
const PlayaController = require('../controllers/PlayaController');
const VehicleController = require('../controllers/VehicleController');
const CameraController = require('../controllers/CameraController');
const { validateLogin, validatePlayaId } = require('../middleware/validation');

router.post('/login', validateLogin, AuthController.login);
router.get('/showPlayas', PlayaController.getAllPlayas);
router.get('/getPlacas', validatePlayaId, VehicleController.getAutos);
router.get('/getPlacasMotos', validatePlayaId, VehicleController.getMotos);
router.put('/updateStateAuto/:id_auto', VehicleController.updateAutoState);
router.put('/updateStateMoto/:id_moto', VehicleController.updateMotoState);
router.put('/carroPagoTicketVenta', VehicleController.processAutoPayment);
router.put('/motoPagoTicketVenta', VehicleController.processMotoPayment);
router.put('/createManualCar', VehicleController.createManualAuto);
router.put('/createManualBike', VehicleController.createManualMoto);
router.get('/getBoletas', validatePlayaId, VehicleController.getBoletas);
router.get('/api/ISAPI/Traffic/channels/1/vehicleDetect/plates', validatePlayaId, CameraController.getPlatesFromCamera);

module.exports = router;