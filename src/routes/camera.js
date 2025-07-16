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

module.exports = router;