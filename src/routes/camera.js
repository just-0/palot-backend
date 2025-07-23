const express = require('express');
const CameraController = require('../controllers/CameraController');
const { validatePlayaId } = require('../middleware/validation');

const router = express.Router();

/**
 * @route GET /api/camera/plates
 * @desc Get plates from camera
 * @access Public
 */
router.get('/plates', validatePlayaId, CameraController.getPlatesFromCamera);

/**
 * @route POST /api/camera/vehicle-detection
 * @desc Receive vehicle detection notifications from cameras
 * @access Public (cameras need to send notifications without authentication)
 */
router.post('/vehicle-detection', CameraController.receiveVehicleDetection);

/**
 * @route PUT /api/camera/vehicle-detection
 * @desc Receive vehicle detection notifications from cameras (some cameras use PUT)
 * @access Public
 */
router.put('/vehicle-detection', CameraController.receiveVehicleDetection);

module.exports = router;